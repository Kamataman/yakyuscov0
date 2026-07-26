"use server"

import { createServiceClient } from "@/lib/supabase/service"

export async function acceptInvite(token: string, password: string) {
  if (password.length < 8) {
    throw new Error("パスワードは8文字以上で入力してください")
  }

  const db = createServiceClient()

  const { data: invite } = await db
    .from("team_invites")
    .select("id, team_id, email, role, expires_at, accepted_at")
    .eq("token", token)
    .maybeSingle()

  if (!invite) throw new Error("招待リンクが見つかりませんでした")
  if (invite.accepted_at) throw new Error("このリンクは既に使用されています")
  if (new Date(invite.expires_at) < new Date()) {
    throw new Error("このリンクの有効期限が切れています")
  }

  const { data: existingProfile } = await db
    .from("profiles")
    .select("id")
    .eq("email", invite.email)
    .maybeSingle()

  let userId: string

  if (existingProfile) {
    userId = existingProfile.id
  } else {
    const { data: created, error: createError } = await db.auth.admin.createUser({
      email: invite.email,
      password,
      email_confirm: true,
    })

    if (createError || !created.user) {
      throw new Error(createError?.message || "ユーザー作成に失敗しました")
    }

    userId = created.user.id
  }

  const { error: memberInsertError } = await db.from("team_members").insert({
    team_id: invite.team_id,
    user_id: userId,
    role: invite.role,
  })

  if (memberInsertError && memberInsertError.code !== "23505") {
    throw new Error(memberInsertError.message)
  }

  await db.from("team_invites").update({ accepted_at: new Date().toISOString() }).eq("id", invite.id)

  return { teamId: invite.team_id, email: invite.email }
}
