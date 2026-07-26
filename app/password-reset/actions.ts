"use server"

import { randomBytes } from "crypto"
import { createServiceClient } from "@/lib/supabase/service"
import { SITE_URL } from "@/lib/constants"
import { sendPasswordResetEmail } from "@/lib/email"

const RESET_EXPIRES_IN_MS = 60 * 60 * 1000

export async function requestPasswordReset(email: string) {
  const trimmedEmail = email.trim().toLowerCase()
  if (!trimmedEmail) return

  const db = createServiceClient()

  const { data: profile } = await db
    .from("profiles")
    .select("id")
    .eq("email", trimmedEmail)
    .maybeSingle()

  // メールアドレスが未登録でも、存在有無を明かさないよう成功扱いにする
  if (!profile) return

  const token = randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + RESET_EXPIRES_IN_MS).toISOString()

  const { error } = await db.from("password_reset_tokens").insert({
    user_id: profile.id,
    token,
    expires_at: expiresAt,
  })

  if (error) throw new Error(error.message)

  await sendPasswordResetEmail({
    to: trimmedEmail,
    resetUrl: `${SITE_URL}/password-reset/${token}`,
  })
}
