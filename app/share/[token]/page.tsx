import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ShareGameEditor } from "./share-game-editor"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function SharePage({ params }: PageProps) {
  const { token } = await params
  const supabase = await createClient()

  // トークンの有効性を確認
  const { data: tokenData, error } = await supabase
    .from("game_share_tokens")
    .select(`
      token,
      expires_at,
      game_id,
      games!inner (
        id,
        team_id,
        opponent,
        date
      )
    `)
    .eq("token", token)
    .gt("expires_at", new Date().toISOString())
    .single()

  if (error || !tokenData) {
    notFound()
  }

  const game = tokenData.games as { id: string; team_id: string; opponent: string; date: string }

  const { data: players } = await supabase
    .from("players")
    .select("id, name, number")
    .eq("team_id", game.team_id)
    .order("number", { ascending: true, nullsFirst: false })
    .order("name")

  return (
    <ShareGameEditor
      gameId={game.id}
      teamId={game.team_id}
      shareToken={token}
      opponent={game.opponent}
      date={game.date}
      players={players ?? []}
    />
  )
}
