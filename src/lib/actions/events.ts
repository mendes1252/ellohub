"use server"

import { createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"
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

const EventSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  memberId: z.string().uuid(),
  startsAt: z.string(),
  endsAt: z.string(),
  allDay: z.boolean().default(false),
  category: z.enum(["saude", "lazer", "escola", "trabalho", "outro"]).default("outro"),
  location: z.string().max(200).optional(),
})

export async function fetchEventsForFamily(
  familyId: string,
  start: string,
  end: string,
  memberFilter?: string[]
) {
  await getAuthUser()
  const admin = createAdminClient()
  let query = admin
    .from("events")
    .select("*, member:members!events_member_id_fkey(id, display_name, color)")
    .eq("family_id", familyId)
    .gte("starts_at", start)
    .lte("starts_at", end)
    .order("starts_at")
  if (memberFilter?.length) query = query.in("member_id", memberFilter)
  const { data } = await query
  return data ?? []
}

export async function fetchConflicts(familyId: string, dateStr: string) {
  await getAuthUser()
  const admin = createAdminClient()
  const { data } = await admin.rpc("detect_conflicts", {
    p_family_id: familyId,
    p_date: dateStr,
  } as any)
  return (data as any) ?? []
}

export async function createEvent(familyId: string, data: z.infer<typeof EventSchema>) {
  const user = await getAuthUser()
  const admin = createAdminClient()
  const parsed = EventSchema.parse(data)

  const { data: family } = await admin
    .from("families")
    .select("subscription_status")
    .eq("id", familyId)
    .single()

  if (family?.subscription_status === "free") {
    const { data: count } = await admin.rpc("count_monthly_events", { p_family_id: familyId })
    if ((count ?? 0) >= 50) throw new Error("Limite mensal de 50 eventos atingido. Faça upgrade para o Plano Família.")
  }

  const { data: member } = await admin
    .from("members")
    .select("id")
    .eq("family_id", familyId)
    .eq("user_id", user.id)
    .single()

  if (!member) throw new Error("Membro não encontrado")

  const { data: event, error } = await admin
    .from("events")
    .insert({
      family_id: familyId,
      member_id: parsed.memberId,
      created_by: member.id,
      title: parsed.title,
      description: parsed.description ?? null,
      starts_at: parsed.startsAt,
      ends_at: parsed.endsAt,
      all_day: parsed.allDay,
      category: parsed.category,
      location: parsed.location ?? null,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)

  return event
}

export async function updateEvent(eventId: string, data: Partial<z.infer<typeof EventSchema>>) {
  await getAuthUser()
  const admin = createAdminClient()

  const updateData: Record<string, any> = {}
  if (data.title) updateData.title = data.title
  if (data.description !== undefined) updateData.description = data.description
  if (data.memberId) updateData.member_id = data.memberId
  if (data.startsAt) updateData.starts_at = data.startsAt
  if (data.endsAt) updateData.ends_at = data.endsAt
  if (data.allDay !== undefined) updateData.all_day = data.allDay
  if (data.category) updateData.category = data.category
  if (data.location !== undefined) updateData.location = data.location

  const { error } = await admin.from("events").update(updateData).eq("id", eventId)
  if (error) throw new Error(error.message)
}

export async function deleteEvent(eventId: string) {
  await getAuthUser()
  const admin = createAdminClient()
  const { error } = await admin.from("events").delete().eq("id", eventId)
  if (error) throw new Error(error.message)
}
