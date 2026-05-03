import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { requireTeamAdmin } from "@/lib/auth"

interface Props {
  params: Promise<{ teamId: string }>
}

export default async function NewGamePage({ params }: Props) {
  const { teamId } = await params

  const adminSession = await requireTeamAdmin(teamId)
  if (!adminSession) {
    redirect(`/${teamId}/login`)
  }

  const supabase = await createClient()
  const today = new Date().toISOString().split("T")[0]

  const { data: game, error } = await supabase
    .from("games")
    .insert({
      team_id: teamId,
      date: today,
      opponent: "",
      is_first_batting: true,
      total_innings: 9,
    })
    .select("id")
    .single()

  if (error || !game) {
    redirect(`/${teamId}/games`)
  }

  await supabase.from("inning_scores").insert(
    Array.from({ length: 9 }, (_, i) => ({
      game_id: game.id,
      inning: i + 1,
      our_score: 0,
      opponent_score: 0,
    }))
  )

  redirect(`/${teamId}/games/${game.id}/edit`)
}
