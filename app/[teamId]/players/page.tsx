import { createClient } from "@/lib/supabase/server"
import { requireTeamAdmin } from "@/lib/auth"
import { sortPlayersByNumber } from "@/lib/sort-utils"
import { PlayersClient } from "./players-client"

interface Props {
  params: Promise<{ teamId: string }>
}

export default async function PlayersPage({ params }: Props) {
  const { teamId } = await params
  const supabase = await createClient()

  const [playersResult, adminSession] = await Promise.all([
    supabase
      .from("players")
      .select("id, name, number")
      .eq("team_id", teamId)
      .order("number", { ascending: true, nullsFirst: false })
      .order("name"),
    requireTeamAdmin(teamId),
  ])

  const players = sortPlayersByNumber(playersResult.data ?? []) as { id: string; name: string; number?: string }[]

  return (
    <PlayersClient
      initialPlayers={players}
      isAdmin={!!adminSession}
      teamId={teamId}
    />
  )
}
