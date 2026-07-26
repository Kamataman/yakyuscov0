"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import { createTeam } from "./actions"

export function NewTeamForm() {
  const router = useRouter()
  const [teamId, setTeamId] = useState("")
  const [teamName, setTeamName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

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
      router.push(`/${createdTeamId}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "作成に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200">
      <div className="mx-auto max-w-lg px-4 py-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          トップページに戻る
        </Link>

        <div className="rounded-2xl bg-white p-6 shadow-lg md:p-8">
          <h1 className="mb-6 text-2xl font-bold text-slate-800">新しいチームを作る</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                チームID
              </label>
              <input
                type="text"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value.toLowerCase())}
                placeholder="my-team"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-slate-500">
                URLに使用されます（例: /my-team）。英小文字、数字、ハイフンのみ使用可能
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                チーム名
              </label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="○○ベースボールクラブ"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-slate-500">
                ヘッダーに表示されるチーム名です
              </p>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? (
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
