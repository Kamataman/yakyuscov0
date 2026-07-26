"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { updateTeamProfile } from "./actions"

interface Props {
  teamId: string
  initialName: string
  initialDescription: string
}

export function TeamProfileSection({ teamId, initialName, initialDescription }: Props) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const isDirty = name !== initialName || description !== initialDescription

  const handleSave = async () => {
    setError(null)
    setMessage(null)

    if (!name.trim()) {
      setError("チーム名を入力してください")
      return
    }

    setIsSaving(true)
    try {
      await updateTeamProfile(teamId, name, description)
      setMessage("チーム情報を保存しました")
      router.refresh()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "保存に失敗しました")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="mb-6 rounded-2xl bg-white p-6 shadow-md">
      <h2 className="text-base font-bold text-slate-800">チーム基本情報</h2>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}
      {message && (
        <p className="mt-3 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>
      )}

      <div className="mt-4">
        <label className="mb-1.5 block text-sm font-medium text-slate-700">チーム名</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block text-sm font-medium text-slate-700">チーム紹介文</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="チームの紹介文を入力してください"
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={!isDirty || isSaving}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
        保存
      </button>
    </section>
  )
}
