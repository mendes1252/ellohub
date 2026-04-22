"use server"

import { createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { z } from "zod"

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getAuthUser() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")
  return user
}

export async function setupFamily(data: {
  familyName: string
  displayName: string
  color: string
  inviteEmail?: string
}) {
  const user = await getAuthUser()
  const admin = createAdminClient()

  const { data: existing } = await admin
    .from("members")
    .select("family_id")
    .eq("user_id", user.id)
    .maybeSingle()

  if (existing) return { familyId: existing.family_id }

  const { data: family, error: famErr } = await admin
    .from("families")
    .insert({ name: data.familyName, created_by: user.id })
    .select()
    .single()
  if (famErr) throw new Error(`Erro ao criar família: ${famErr.message}`)

  const { data: member, error: memErr } = await admin
    .from("members")
    .insert({
      family_id: family.id,
      user_id: user.id,
      role: "admin",
      display_name: data.displayName,
      color: data.color,
    })
    .select()
    .single()
  if (memErr) throw new Error(`Erro ao criar membro: ${memErr.message}`)

  if (data.inviteEmail) {
    await admin.from("invitations").insert({
      family_id: family.id,
      invited_by: member.id,
      email: data.inviteEmail,
    })
  }

  revalidatePath("/")
  return { familyId: family.id }
}

export async function inviteMember(familyId: string, email: string) {
  const user = await getAuthUser()
  const admin = createAdminClient()

  const { data: member } = await admin
    .from("members")
    .select("id, role")
    .eq("family_id", familyId)
    .eq("user_id", user.id)
    .single()
  if (!member || member.role !== "admin") throw new Error("Sem permissão de admin")

  const { count } = await admin
    .from("members")
    .select("*", { count: "exact", head: true })
    .eq("family_id", familyId)
    .not("user_id", "is", null)

  const { data: family } = await admin
    .from("families")
    .select("subscription_status")
    .eq("id", familyId)
    .single()

  const maxMembers = family?.subscription_status === "free" ? 2 : 6
  if ((count ?? 0) >= maxMembers) throw new Error("Limite de membros atingido. Faça upgrade para o Plano Família.")

  // Gera token explicitamente para não depender de DEFAULT do banco
  const token = crypto.randomUUID()

  const { data: invitation, error } = await admin
    .from("invitations")
    .insert({ family_id: familyId, invited_by: member.id, email, token })
    .select()
    .single()
  if (error) throw new Error(error.message)

  // Sem revalidatePath para não resetar o estado do InviteForm
  return { token: invitation.token ?? token }
}

export async function addChild(familyId: string, name: string) {
  const user = await getAuthUser()
  const admin = createAdminClient()

  const { data: usedColors } = await admin
    .from("members")
    .select("color")
    .eq("family_id", familyId)

  const palette = ["#3D405B", "#F49AC2", "#FFC145", "#70D6E3"]
  const used = usedColors?.map((m: any) => m.color) ?? []
  const color = palette.find(c => !used.includes(c)) ?? "#F49AC2"

  const { error } = await admin
    .from("members")
    .insert({
      family_id: familyId,
      user_id: null,
      role: "child",
      display_name: name,
      color,
    })
  if (error) throw new Error(error.message)

  revalidatePath("/familia")
}

export async function updateMemberProfile(memberId: string, displayName: string) {
  await getAuthUser()
  const admin = createAdminClient()
  const { error } = await admin
    .from("members")
    .update({ display_name: displayName })
    .eq("id", memberId)
  if (error) throw new Error(error.message)
  revalidatePath("/config")
  revalidatePath("/familia")
}

export async function updateMemberColor(memberId: string, color: string) {
  await getAuthUser()
  const admin = createAdminClient()
  const { error } = await admin
    .from("members")
    .update({ color })
    .eq("id", memberId)
  if (error) throw new Error(error.message)
  revalidatePath("/config")
  revalidatePath("/familia")
}

export async function acceptInvite(token: string) {
  const user = await getAuthUser()
  const admin = createAdminClient()

  const { data: invitation } = await admin
    .from("invitations")
    .select("*")
    .eq("token", token)
    .eq("status", "pending")
    .single()

  if (!invitation) throw new Error("Convite inválido ou expirado")

  const { data: existingMember } = await admin
    .from("members")
    .select("id")
    .eq("family_id", invitation.family_id)
    .eq("user_id", user.id)
    .maybeSingle()

  if (existingMember) {
    await admin.from("invitations").update({ status: "accepted", accepted_at: new Date().toISOString() }).eq("id", invitation.id)
    return { familyId: invitation.family_id, memberId: existingMember.id }
  }

  const { data: usedColors } = await admin.from("members").select("color").eq("family_id", invitation.family_id)
  const palette = ["#3D405B", "#F49AC2", "#FFC145", "#70D6E3"]
  const used = usedColors?.map((m: any) => m.color) ?? []
  const color = palette.find(c => !used.includes(c)) ?? "#70D6E3"

  const emailName = user.email?.split("@")[0] ?? "Membro"

  const { data: newMember, error: memErr } = await admin.from("members").insert({
    family_id: invitation.family_id,
    user_id: user.id,
    role: "member",
    display_name: emailName,
    color,
  }).select().single()
  if (memErr) throw new Error(memErr.message)

  await admin.from("invitations").update({ status: "accepted", accepted_at: new Date().toISOString() }).eq("id", invitation.id)

  return { familyId: invitation.family_id, memberId: newMember.id }
}

export async function fetchInviteByToken(token: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from("invitations")
    .select("family_id, email, status, families(name)")
    .eq("token", token)
    .single()
  return data as { family_id: string; email: string; status: string; families: { name: string } | null } | null
}

export async function createFamily(data: { name: string; displayName: string }) {
  const user = await getAuthUser()
  const admin = createAdminClient()

  const parsed = z.object({
    name: z.string().min(1).max(50),
    displayName: z.string().min(1).max(30),
  }).parse(data)

  const { data: family, error: famErr } = await admin
    .from("families")
    .insert({ name: parsed.name, created_by: user.id })
    .select()
    .single()
  if (famErr) throw new Error(famErr.message)

  const { error: memErr } = await admin
    .from("members")
    .insert({
      family_id: family.id,
      user_id: user.id,
      role: "admin",
      display_name: parsed.displayName,
      color: "#3D405B",
    })
  if (memErr) throw new Error(memErr.message)

  revalidatePath("/")
  return { familyId: family.id }
}
