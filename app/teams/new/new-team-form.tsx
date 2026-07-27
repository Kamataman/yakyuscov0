"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import { createTeam } from "./actions"

export function NewTeamForm() {
  const router = useRouter()
  const [teamId, setTeamId] = useState("")
  const [teamName, setTeamName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isNavigating, startNavigation] = useTransition()
  const [error, setError] = useState("")

  // router.push は遷移完了を待たないため、finally で isSubmitting を戻すと
  // 遷移中だけボタンが通常表示に戻ってしまう。transition の pending で覆う。
  const isBusy = isSubmitting || isNavigating

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!teamId.trim()) {
      setError("チームIDを入力してください")
      return
    }
    if (!/^[a-z0-9-]+$/.test(teamId)) {
      setError("チームIDは英小文字、数字、ハイフンのみ使用できます")
      return
    }
    if (!teamName.trim()) {
      setError("チーム名を入力してください")
      return
    }

    setIsSubmitting(true)
    try {
      const createdTeamId = await createTeam(teamId, teamName)
      startNavigation(() => {
        router.push(`/${createdTeamId}`)
        router.refresh()
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "作成に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-4 py-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          トップページに戻る
        </Link>

        <div className="border border-border p-6 md:p-8">
          <h1 className="mb-6 text-2xl font-bold text-foreground">新しいチームを作る</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                チームID
              </label>
              <input
                type="text"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value.toLowerCase())}
                placeholder="my-team"
                className="w-full border border-input px-4 py-3 text-sm focus:border-turf focus:outline-none focus:ring-1 focus:ring-turf"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                URLに使用されます（例: /my-team）。英小文字、数字、ハイフンのみ使用可能
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                チーム名
              </label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="○○ベースボールクラブ"
                className="w-full border border-input px-4 py-3 text-sm focus:border-turf focus:outline-none focus:ring-1 focus:ring-turf"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                ヘッダーに表示されるチーム名です
              </p>
            </div>

            {error && (
              <div className="bg-stitch/10 border border-stitch/40 p-3 text-sm text-stitch">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isBusy}
              className="flex w-full items-center justify-center gap-2 bg-turf px-4 py-3 text-sm font-bold text-turf-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isBusy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  作成中...
                </>
              ) : (
                "チームを作成"
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
