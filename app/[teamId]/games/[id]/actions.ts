"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { requireTeamAdmin } from "@/lib/auth"

export async function deleteGame(teamId: string, gameId: string) {
  const session = await requireTeamAdmin(teamId)
  if (!session) throw new Error("管理者権限が必要です")

  const supabase = await createClient()

  const { data: game } = await supabase
    .from("games")
    .select("team_id")
    .eq("id", gameId)
    .single()

  if (!game || game.team_id !== teamId) throw new Error("アクセスできません")

  const { error } = await supabase.from("games").delete().eq("id", gameId)
  if (error) throw new Error(error.message)

  redirect(`/${teamId}/games`)
}
