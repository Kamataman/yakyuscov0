"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function ConfirmHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const supabase = createClient()

    async function exchange() {
      const code = searchParams.get("code")
      const token_hash = searchParams.get("token_hash")
      const type = searchParams.get("type")

      let user = null
      let err = null

      if (code) {
        // PKCEフロー: ブラウザのCookieにあるverifierを使って交換
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        user = data?.user
        err = error
      } else if (token_hash && type) {
        // OTPフロー
        const { data, error } = await supabase.auth.verifyOtp({
          type: type as "signup" | "recovery" | "email",
          token_hash,
        })
        user = data?.user
        err = error
      }

      if (err || !user) {
        router.replace("/auth/confirmed?error=1")
        return
      }

      const teamId = user.user_metadata?.team_id as string | undefined
      router.replace(teamId ? `/auth/confirmed?teamId=${teamId}` : "/auth/confirmed")
    }

    exchange()
  }, [searchParams, router])

  return <p className="text-slate-600">認証処理中...</p>
}
