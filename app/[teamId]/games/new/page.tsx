"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function NewGamePage() {
  const params = useParams()
  const router = useRouter()
  const teamId = params.teamId as string
  
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // ページ読み込み時に空の試合を作成してリダイレクト
    const createGame = async () => {
      setIsCreating(true)
      try {
        const response = await fetch("/api/games", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teamId,
            date: new Date().toISOString().split("T")[0],
            opponent: "",
            isFirstBatting: true,
            totalInnings: 9,
            inningScores: Array(9).fill(null).map(() => ({ our: 0, opponent: 0 })),
            lineupSlots: [],
            battingResults: {},
            pitchers: [],
          }),
        })

        if (!response.ok) {
          throw new Error("試合の作成に失敗しました")
        }

        const data = await response.json()
        
        // 作成した試合の編集ページにリダイレクト
        router.replace(`/${teamId}/games/${data.id}/edit`)
      } catch (err) {
        console.error(err)
        setError("試合の作成に失敗しました。もう一度お試しください。")
        setIsCreating(false)
      }
    }

    createGame()
  }, [teamId, router])

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200">
        <div className="mx-auto max-w-md p-8">
          <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
            <div className="mb-4 text-red-500">{error}</div>
            <button
              onClick={() => router.back()}
              className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-300"
            >
              戻る
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200">
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-slate-600">試合を作成中...</p>
        </div>
      </div>
    </main>
  )
}
