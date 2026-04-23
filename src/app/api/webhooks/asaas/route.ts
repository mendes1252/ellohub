import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ASAAS events that confirm payment
const CONFIRMED_EVENTS = new Set([
  "PAYMENT_CONFIRMED",
  "PAYMENT_RECEIVED",
  "PAYMENT_APPROVED_BY_RISK_ANALYSIS",
])

// ASAAS events that indicate problems
const OVERDUE_EVENTS = new Set(["PAYMENT_OVERDUE"])

const CANCELLED_EVENTS = new Set([
  "SUBSCRIPTION_CANCELLED",
  "PAYMENT_DELETED",
  "PAYMENT_REFUNDED",
  "PAYMENT_CHARGEBACK_REQUESTED",
])

export async function POST(request: NextRequest) {
  // Validate token if configured
  const token = request.headers.get("asaas-access-token")
  if (process.env.ASAAS_WEBHOOK_TOKEN && token !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const event: string = body.event
  const payment = body.payment

  if (!payment?.externalReference) {
    return NextResponse.json({ ok: true })
  }

  // externalReference format: "familyId:plan"
  const familyId = payment.externalReference.split(":")[0]
  if (!familyId) return NextResponse.json({ ok: true })

  if (CONFIRMED_EVENTS.has(event)) {
    await admin
      .from("families")
      .update({ subscription_status: "active", trial_ends_at: null })
      .eq("id", familyId)
  } else if (OVERDUE_EVENTS.has(event)) {
    await admin
      .from("families")
      .update({ subscription_status: "past_due" })
      .eq("id", familyId)
  } else if (CANCELLED_EVENTS.has(event)) {
    await admin
      .from("families")
      .update({ subscription_status: "cancelled", asaas_subscription_id: null })
      .eq("id", familyId)
  }

  return NextResponse.json({ ok: true })
}
