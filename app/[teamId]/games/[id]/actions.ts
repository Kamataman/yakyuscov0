"use server"

import { redirect } from "next/navigation"
import { createServiceClient } from "@/lib/supabase/service"
import { requireTeamAdmin } from "@/lib/auth"
import { deleteReactionsForTarget } from "@/lib/reactions"

export async function deleteGame(teamId: string, gameId: string) {
  const session = await requireTeamAdmin(teamId)
  if (!session) throw new Error("管理者権限が必要です")

  const supabase = createServiceClient()

  const { data: game } = await supabase
    .from("games")
    .select("team_id")
    .eq("id", gameId)
    .single()

  if (!game || game.team_id !== teamId) throw new Error("アクセスできません")

  // reactions は games へのFKを持たないため、先に明示的に削除する
  await deleteReactionsForTarget("game", gameId)

  const { error } = await supabase.from("games").delete().eq("id", gameId)
  if (error) throw new Error(error.message)

  redirect(`/${teamId}/games`)
}
