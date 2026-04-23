"use server"

import { createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

const ASAAS_BASE = process.env.ASAAS_SANDBOX === "true"
  ? "https://sandbox.asaas.com/api/v3"
  : "https://api.asaas.com/v3"

function asaasHeaders() {
  return {
    "access_token": process.env.ASAAS_API_KEY!,
    "Content-Type": "application/json",
  }
}

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

export async function createAsaasCheckout(
  familyId: string,
  plan: "monthly" | "yearly"
): Promise<{ checkoutUrl: string }> {
  const user = await getAuthUser()
  const admin = createAdminClient()

  const { data: family } = await admin
    .from("families")
    .select("asaas_customer_id, name")
    .eq("id", familyId)
    .single()
  if (!family) throw new Error("Família não encontrada")

  let customerId: string = (family as any).asaas_customer_id

  // Create ASAAS customer if not exists
  if (!customerId) {
    const res = await fetch(`${ASAAS_BASE}/customers`, {
      method: "POST",
      headers: asaasHeaders(),
      body: JSON.stringify({
        name: family.name,
        email: user.email,
        externalReference: familyId,
      }),
    })
    const data = await res.json()
    if (data.errors?.length) throw new Error(`ASAAS: ${data.errors[0].description}`)
    customerId = data.id
    await admin
      .from("families")
      .update({ asaas_customer_id: customerId })
      .eq("id", familyId)
  }

  const value = plan === "monthly" ? 24.0 : 229.0
  const cycle = plan === "monthly" ? "MONTHLY" : "YEARLY"
  const description = plan === "monthly"
    ? "Ello Plano Família — Mensal"
    : "Ello Plano Família — Anual (20% off)"

  // Next due date = tomorrow
  const nextDue = new Date()
  nextDue.setDate(nextDue.getDate() + 1)
  const nextDueDate = nextDue.toISOString().split("T")[0]

  const subRes = await fetch(`${ASAAS_BASE}/subscriptions`, {
    method: "POST",
    headers: asaasHeaders(),
    body: JSON.stringify({
      customer: customerId,
      billingType: "UNDEFINED",
      value,
      nextDueDate,
      cycle,
      description,
      externalReference: `${familyId}:${plan}`,
    }),
  })
  const subData = await subRes.json()
  if (subData.errors?.length) throw new Error(`ASAAS: ${subData.errors[0].description}`)

  await admin
    .from("families")
    .update({ asaas_subscription_id: subData.id })
    .eq("id", familyId)

  // Get first payment invoice URL
  const pmtRes = await fetch(`${ASAAS_BASE}/payments?subscription=${subData.id}&limit=1`, {
    headers: asaasHeaders(),
  })
  const pmtData = await pmtRes.json()
  const firstPayment = pmtData.data?.[0]

  const checkoutUrl: string = firstPayment?.invoiceUrl
    || (firstPayment?.id ? `https://www.asaas.com/c/${firstPayment.id}` : "https://www.asaas.com")

  return { checkoutUrl }
}

export async function cancelAsaasSubscription(familyId: string) {
  await getAuthUser()
  const admin = createAdminClient()

  const { data: family } = await admin
    .from("families")
    .select("asaas_subscription_id")
    .eq("id", familyId)
    .single()

  if ((family as any)?.asaas_subscription_id) {
    await fetch(`${ASAAS_BASE}/subscriptions/${(family as any).asaas_subscription_id}/cancel`, {
      method: "POST",
      headers: asaasHeaders(),
    })
  }

  await admin
    .from("families")
    .update({ subscription_status: "cancelled", asaas_subscription_id: null })
    .eq("id", familyId)

  revalidatePath("/config")
  revalidatePath("/familia")
}
