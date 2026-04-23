import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { sendPushToMember } from "@/lib/push"

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  const { data: families } = await admin.from("families").select("id")
  if (!families) return NextResponse.json({ sent: 0 })

  let sent = 0

  for (const family of families) {
    const { data: events } = await admin
      .from("events")
      .select("title, starts_at, member:members!events_member_id_fkey(display_name)")
      .eq("family_id", family.id)
      .gte("starts_at", today.toISOString())
      .lt("starts_at", tomorrow.toISOString())
      .order("starts_at")

    if (!events || events.length === 0) continue

    const { data: members } = await admin
      .from("members")
      .select("id")
      .eq("family_id", family.id)
      .not("user_id", "is", null)

    if (!members) continue

    const lines = events.slice(0, 4).map((e: any) => {
      const time = format(new Date(e.starts_at), "HH:mm", { locale: ptBR })
      return `• ${time} ${e.title}`
    })
    const body = lines.join("\n")
    const title = `${events.length} evento${events.length > 1 ? "s" : ""} hoje`

    for (const member of members) {
      // Save notification record
      await admin.from("notifications").insert({
        member_id: member.id,
        family_id: family.id,
        type: "morning_summary",
        title,
        message: body,
        data: { event_count: events.length },
      })

      // Send real push notification
      await sendPushToMember(admin, member.id, { title, body, url: "/calendario" })
      sent++
    }
  }

  return NextResponse.json({ sent })
}
