import { type EmailOtpType } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null

  if (token_hash && type) {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash })

    if (!error && data.user) {
      const teamId = data.user.user_metadata?.team_id as string | undefined
      const url = new URL("/auth/confirmed", origin)
      if (teamId) url.searchParams.set("teamId", teamId)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.redirect(new URL("/auth/confirmed?error=1", origin))
}
