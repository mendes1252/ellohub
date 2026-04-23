"use server"

import { createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"

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

export async function subscribeToPush(memberId: string, subscription: {
  endpoint: string
  keys: { p256dh: string; auth: string }
}) {
  await getAuthUser()
  const admin = createAdminClient()
  await admin.from("push_subscriptions").upsert(
    {
      member_id: memberId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth_key: subscription.keys.auth,
    },
    { onConflict: "endpoint" }
  )
}

export async function unsubscribeFromPush(endpoint: string) {
  await getAuthUser()
  const admin = createAdminClient()
  await admin.from("push_subscriptions").delete().eq("endpoint", endpoint)
}

export async function hasPushSubscription(memberId: string): Promise<boolean> {
  await getAuthUser()
  const admin = createAdminClient()
  const { data } = await admin
    .from("push_subscriptions")
    .select("id")
    .eq("member_id", memberId)
    .limit(1)
    .maybeSingle()
  return !!data
}
