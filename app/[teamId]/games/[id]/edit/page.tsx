import { redirect } from "next/navigation"
import { requireTeamAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { GameEditor } from "@/components/game-editor"

interface Props {
  params: Promise<{ teamId: string; id: string }>
}

export default async function GameEditPage({ params }: Props) {
  const { teamId, id: gameId } = await params

  const [adminSession, supabase] = await Promise.all([
    requireTeamAdmin(teamId),
    createClient(),
  ])

  if (!adminSession) {
    redirect(`/${teamId}/login`)
  }

  const { data: players } = await supabase
    .from("players")
    .select("id, name, number")
    .eq("team_id", teamId)
    .order("number", { ascending: true, nullsFirst: false })
    .order("name")

  return (
    <GameEditor
      gameId={gameId}
      teamId={teamId}
      isAdmin={true}
      players={players ?? []}
    />
  )
}
