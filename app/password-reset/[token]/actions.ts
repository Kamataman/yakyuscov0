"use server"

import { createServiceClient } from "@/lib/supabase/service"

export async function resetPassword(token: string, password: string) {
  if (password.length < 8) {
    throw new Error("パスワードは8文字以上で入力してください")
  }

  const db = createServiceClient()

  const { data: resetToken } = await db
    .from("password_reset_tokens")
    .select("id, user_id, expires_at, used_at")
    .eq("token", token)
    .maybeSingle()

  if (!resetToken) throw new Error("リンクが見つかりませんでした")
  if (resetToken.used_at) throw new Error("このリンクは既に使用されています")
  if (new Date(resetToken.expires_at) < new Date()) {
    throw new Error("このリンクの有効期限が切れています")
  }

  const { data: updated, error: updateError } = await db.auth.admin.updateUserById(
    resetToken.user_id,
    { password }
  )

  if (updateError || !updated.user) {
    throw new Error(updateError?.message || "パスワードの更新に失敗しました")
  }

  await db
    .from("password_reset_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", resetToken.id)

  return { email: updated.user.email as string }
}
