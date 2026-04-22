import { createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/calendario"

  if (code) {
    const supabase = await createServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      // If redirecting to an invite page, skip the member check — the user
      // will accept the invite and get a member record there.
      if (next.startsWith("/invite/")) {
        return NextResponse.redirect(`${origin}${next}`)
      }

      // Use admin client to bypass RLS when checking for existing membership
      const admin = createAdminClient()
      const { data: member } = await admin
        .from("members")
        .select("family_id")
        .eq("user_id", user!.id)
        .limit(1)
        .maybeSingle()

      if (!member) {
        return NextResponse.redirect(`${origin}/onboarding`)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
