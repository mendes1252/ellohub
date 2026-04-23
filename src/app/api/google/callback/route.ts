import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const memberId = searchParams.get("state")
  const error = searchParams.get("error")

  if (error || !code || !memberId) {
    return NextResponse.redirect(`${origin}/config?google_error=1`)
  }

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? origin
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${base}/api/google/callback`,
      grant_type: "authorization_code",
    }),
  })

  const tokenData = await tokenRes.json()
  if (tokenData.error) {
    return NextResponse.redirect(`${origin}/config?google_error=1`)
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  await admin.from("google_calendar_tokens").upsert(
    {
      member_id: memberId,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token ?? null,
      expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      calendar_id: "primary",
    },
    { onConflict: "member_id" }
  )

  return NextResponse.redirect(`${origin}/config?google_connected=1`)
}
