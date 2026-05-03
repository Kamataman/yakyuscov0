import { redirect } from "next/navigation"
import { requireTeamAdmin } from "@/lib/auth"
import { GameEditor } from "@/components/game-editor"

interface Props {
  params: Promise<{ teamId: string; id: string }>
}

export default async function GameEditPage({ params }: Props) {
  const { teamId, id: gameId } = await params

  const adminSession = await requireTeamAdmin(teamId)
  if (!adminSession) {
    redirect(`/${teamId}/login`)
  }

  return (
    <GameEditor
      gameId={gameId}
      teamId={teamId}
      isAdmin={true}
    />
  )
}
