import webpush from "web-push"

let initialized = false

function ensureVapid() {
  if (initialized) return
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  if (!pub || !priv || pub.startsWith("placeholder") || priv.startsWith("placeholder")) return
  webpush.setVapidDetails("mailto:ello@app.com", pub, priv)
  initialized = true
}

export async function sendPushToMember(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  memberId: string,
  payload: { title: string; body: string; url?: string }
) {
  ensureVapid()
  if (!initialized) return 0

  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth_key")
    .eq("member_id", memberId)

  if (!subs?.length) return 0

  const pushPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? "/calendario",
  })

  let sent = 0
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
        pushPayload
      )
      sent++
    } catch (err: any) {
      // Remove expired/invalid subscriptions
      if (err.statusCode === 410 || err.statusCode === 404) {
        await admin.from("push_subscriptions").delete().eq("endpoint", sub.endpoint)
      }
    }
  }
  return sent
}
