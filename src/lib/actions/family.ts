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

const CreateFamilySchema = z.object({
  name: z.string().min(1).max(50),
  displayName: z.string().min(1).max(30),
})

export async function createFamily(data: { name: string; displayName: string }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  const parsed = CreateFamilySchema.parse(data)

  const { data: family, error: famErr } = await supabase
    .from("families")
    .insert({ name: parsed.name, created_by: user.id })
    .select()
    .single()
  if (famErr) throw famErr

  const { error: memErr } = await supabase
    .from("members")
    .insert({
      family_id: family.id,
      user_id: user.id,
      role: "admin",
      display_name: parsed.displayName,
      color: "#3D405B",
    })
  if (memErr) throw memErr

  revalidatePath("/")
  return { familyId: family.id }
}

export async function setupFamily(data: {
  familyName: string
  displayName: string
  color: string
  inviteEmail?: string
}) {
  // Verifica o usuário autenticado via cookie
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado. Faça login novamente.")

  // Verifica se já tem família (re-click protection)
  const admin = createAdminClient()
  const { data: existing } = await admin
    .from("members")
    .select("family_id")
    .eq("user_id", user.id)
    .maybeSingle()

  if (existing) return { familyId: existing.family_id }

  // Usa admin client para bypass de RLS no setup inicial
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
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  const { data: member } = await supabase
    .from("members")
    .select("id, role")
    .eq("family_id", familyId)
    .eq("user_id", user.id)
    .single()
  if (member?.role !== "admin") throw new Error("Sem permissão")

  const { count } = await supabase
    .from("members")
    .select("*", { count: "exact", head: true })
    .eq("family_id", familyId)

  const { data: family } = await supabase
    .from("families")
    .select("subscription_status")
    .eq("id", familyId)
    .single()

  const maxMembers = family?.subscription_status === "free" ? 2 : 6
  if ((count ?? 0) >= maxMembers) throw new Error("Limite de membros atingido. Faça upgrade para o Plano Família.")

  const { data: invitation, error } = await supabase
    .from("invitations")
    .insert({ family_id: familyId, invited_by: member.id, email })
    .select()
    .single()
  if (error) throw error

  revalidatePath("/familia")
  return { token: invitation.token }
}

export async function addChild(familyId: string, name: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  const { data: usedColors } = await supabase
    .from("members")
    .select("color")
    .eq("family_id", familyId)

  const palette = ["#3D405B", "#F49AC2", "#FFC145", "#70D6E3"]
  const used = usedColors?.map((m: any) => m.color) ?? []
  const color = palette.find(c => !used.includes(c)) ?? "#3D405B"

  const { data: adminMember } = await supabase
    .from("members")
    .select("id")
    .eq("family_id", familyId)
    .eq("user_id", user.id)
    .single()

  const { error } = await supabase
    .from("members")
    .insert({
      family_id: familyId,
      user_id: null,
      role: "child",
      display_name: name,
      color,
    })
  if (error) throw error

  revalidatePath("/familia")
}

export async function updateMemberProfile(memberId: string, displayName: string) {
  const supabase = await createServerClient()
  const { error } = await supabase
    .from("members")
    .update({ display_name: displayName })
    .eq("id", memberId)
  if (error) throw error
  revalidatePath("/config")
}
