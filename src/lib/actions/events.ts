"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

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

export async function createEvent(familyId: string, data: z.infer<typeof EventSchema>) {
  const supabase = await createServerClient()
  const parsed = EventSchema.parse(data)

  const { data: family } = await supabase
    .from("families")
    .select("subscription_status")
    .eq("id", familyId)
    .single()

  if (family?.subscription_status === "free") {
    const { data: count } = await supabase.rpc("count_monthly_events", { p_family_id: familyId })
    if ((count ?? 0) >= 50) throw new Error("Limite mensal de 50 eventos atingido. Faça upgrade para o Plano Família.")
  }

  const { data: { user } } = await supabase.auth.getUser()
  const { data: member } = await supabase
    .from("members")
    .select("id")
    .eq("family_id", familyId)
    .eq("user_id", user!.id)
    .single()

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      family_id: familyId,
      member_id: parsed.memberId,
      created_by: member!.id,
      title: parsed.title,
      description: parsed.description,
      starts_at: parsed.startsAt,
      ends_at: parsed.endsAt,
      all_day: parsed.allDay,
      category: parsed.category,
      location: parsed.location,
      synced_from: "manual",
    })
    .select()
    .single()
  if (error) throw error

  revalidatePath("/calendario")
  return event
}

export async function updateEvent(eventId: string, data: Partial<z.infer<typeof EventSchema>>) {
  const supabase = await createServerClient()

  const updateData: Record<string, any> = {}
  if (data.title) updateData.title = data.title
  if (data.description !== undefined) updateData.description = data.description
  if (data.memberId) updateData.member_id = data.memberId
  if (data.startsAt) updateData.starts_at = data.startsAt
  if (data.endsAt) updateData.ends_at = data.endsAt
  if (data.allDay !== undefined) updateData.all_day = data.allDay
  if (data.category) updateData.category = data.category
  if (data.location !== undefined) updateData.location = data.location

  const { error } = await supabase.from("events").update(updateData).eq("id", eventId)
  if (error) throw error

  revalidatePath("/calendario")
}

export async function deleteEvent(eventId: string) {
  const supabase = await createServerClient()
  const { error } = await supabase.from("events").delete().eq("id", eventId)
  if (error) throw error
  revalidatePath("/calendario")
}
