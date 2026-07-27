"use server"

import { createServiceClient } from "@/lib/supabase/service"
import { SITE_URL } from "@/lib/constants"
import { sendRegistrationConfirmEmail } from "@/lib/email"

export interface RegisterTeamParams {
  teamId: string
  teamName: string
  email: string
  password: string
}

export async function registerTeam(params: RegisterTeamParams): Promise<void> {
  const teamId = params.teamId.trim()
  const teamName = params.teamName.trim()
  const email = params.email.trim().toLowerCase()
  const password = params.password

  if (!/^[a-z0-9-]+$/.test(teamId)) {
    throw new Error("チームIDは英小文字、数字、ハイフンのみ使用できます")
  }
  if (!teamName) {
    throw new Error("チーム名を入力してください")
  }
  if (!email) {
    throw new Error("メールアドレスを入力してください")
  }
  if (password.length < 8) {
    throw new Error("パスワードは8文字以上で入力してください")
  }

  const db = createServiceClient()

  const { data: existingTeam } = await db
    .from("teams")
    .select("id")
    .eq("id", teamId)
    .maybeSingle()

  if (existingTeam) {
    throw new Error("このチームIDはすでに使用されています")
  }

  const { data, error } = await db.auth.admin.generateLink({
    type: "signup",
    email,
    password,
    options: {
      data: { teamId, teamName },
    },
  })

  if (error) {
    if (error.message.includes("already been registered") || error.message.includes("already registered")) {
      throw new Error("このメールアドレスはすでに登録されています")
    }
    throw new Error(error.message || "登録に失敗しました")
  }

  const hashedToken = data.properties?.hashed_token
  if (!hashedToken) {
    throw new Error("確認リンクの発行に失敗しました")
  }

  await sendRegistrationConfirmEmail({
    to: email,
    teamName,
    confirmUrl: `${SITE_URL}/auth/callback?token_hash=${hashedToken}&type=signup`,
  })
}
