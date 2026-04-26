"use client"

import { useParams, useRouter } from "next/navigation"
import { GameEditor } from "@/components/game-editor"

export default function GameEditPage() {
  const params = useParams()
  const router = useRouter()
  const teamId = params.teamId as string
  const gameId = params.id as string

  const handleBack = () => {
    router.push(`/${teamId}/games/${gameId}`)
  }

  return (
    <GameEditor
      gameId={gameId}
      teamId={teamId}
      isAdmin={true}
      onBack={handleBack}
    />
  )
}
