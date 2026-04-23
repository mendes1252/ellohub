"use server"

import { createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

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

export function getGoogleOAuthUrl(memberId: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: `${base}/api/google/callback`,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/calendar.readonly",
    access_type: "offline",
    prompt: "consent",
    state: memberId,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export async function getGoogleCalendarStatus(memberId: string) {
  await getAuthUser()
  const admin = createAdminClient()
  const { data } = await admin
    .from("google_calendar_tokens")
    .select("synced_at, calendar_id")
    .eq("member_id", memberId)
    .maybeSingle()
  return data as { synced_at: string | null; calendar_id: string } | null
}

export async function disconnectGoogleCalendar(memberId: string) {
  await getAuthUser()
  const admin = createAdminClient()
  await admin.from("google_calendar_tokens").delete().eq("member_id", memberId)
  revalidatePath("/config")
}

export async function syncGoogleCalendar(memberId: string, familyId: string) {
  await getAuthUser()
  const admin = createAdminClient()

  const { data: tokenData } = await admin
    .from("google_calendar_tokens")
    .select("*")
    .eq("member_id", memberId)
    .single()

  if (!tokenData) throw new Error("Google Calendar não conectado")

  let accessToken = tokenData.access_token

  // Refresh if expired
  if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
    if (!tokenData.refresh_token) throw new Error("Sessão expirada. Reconecte o Google Calendar.")
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: tokenData.refresh_token,
      }),
    })
    const refreshed = await res.json()
    if (refreshed.error) throw new Error("Erro ao renovar acesso ao Google Calendar")
    accessToken = refreshed.access_token
    await admin.from("google_calendar_tokens").update({
      access_token: accessToken,
      expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
    }).eq("member_id", memberId)
  }

  const timeMin = new Date().toISOString()
  const timeMax = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
  const calId = encodeURIComponent(tokenData.calendar_id ?? "primary")

  const eventsRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calId}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=250`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  const eventsData = await eventsRes.json()
  if (eventsData.error) throw new Error(`Erro Google Calendar: ${eventsData.error.message}`)

  let synced = 0
  for (const ge of eventsData.items ?? []) {
    if (ge.status === "cancelled") continue
    const startsAt = ge.start?.dateTime ?? (ge.start?.date ? `${ge.start.date}T00:00:00` : null)
    const endsAt = ge.end?.dateTime ?? (ge.end?.date ? `${ge.end.date}T23:59:59` : null)
    if (!startsAt || !endsAt) continue

    await admin.from("events").upsert(
      {
        family_id: familyId,
        member_id: memberId,
        created_by: memberId,
        title: ge.summary || "Evento",
        description: ge.description ?? null,
        starts_at: new Date(startsAt).toISOString(),
        ends_at: new Date(endsAt).toISOString(),
        all_day: !!ge.start?.date,
        category: "outro",
        location: ge.location ?? null,
        synced_from: "google",
        external_id: ge.id,
      },
      { onConflict: "external_id" }
    )
    synced++
  }

  await admin
    .from("google_calendar_tokens")
    .update({ synced_at: new Date().toISOString() })
    .eq("member_id", memberId)

  revalidatePath("/calendario")
  return { synced }
}
