"use server"

import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

export async function createTeam(teamId: string, teamName: string): Promise<string> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("ログインが必要です")
  }

  if (!/^[a-z0-9-]+$/.test(teamId)) {
    throw new Error("チームIDは英小文字、数字、ハイフンのみ使用できます")
  }
  if (!teamName.trim()) {
    throw new Error("チーム名を入力してください")
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

  const { error: teamInsertError } = await db.from("teams").insert({
    id: teamId,
    name: teamName,
    user_id: user.id,
    admin_email: user.email,
  })

  if (teamInsertError) {
    throw new Error(teamInsertError.message)
  }

  const { error: memberInsertError } = await db.from("team_members").insert({
    team_id: teamId,
    user_id: user.id,
    role: "owner",
  })

  if (memberInsertError) {
    await db.from("teams").delete().eq("id", teamId)
    throw new Error(memberInsertError.message)
  }

  return teamId
}
