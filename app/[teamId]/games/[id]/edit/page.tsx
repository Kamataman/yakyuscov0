"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { GameEditor } from "@/components/game-editor"

export default function GameEditPage() {
  const params = useParams()
  const router = useRouter()
  const teamId = params.teamId as string
  const gameId = params.id as string

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    // 認証状態を確認
    fetch(`/api/auth/status?teamId=${teamId}`)
      .then((res) => res.json())
      .then((data) => {
        setIsAdmin(data.isAdmin === true)
      })
      .catch(() => {
        setIsAdmin(false)
      })
  }, [teamId])

  const handleBack = () => {
    router.push(`/${teamId}/games/${gameId}`)
  }

  // 認証状態確認中
  if (isAdmin === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <GameEditor
      gameId={gameId}
      teamId={teamId}
      isAdmin={isAdmin}
      onBack={handleBack}
    />
  )
}
