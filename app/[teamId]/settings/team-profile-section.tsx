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
    <section className="mb-6 border border-border p-6">
      <h2 className="text-base font-bold text-foreground">チーム基本情報</h2>

      {error && (
        <p className="mt-3 bg-stitch/10 border border-stitch/40 px-4 py-3 text-sm text-stitch">{error}</p>
      )}
      {message && (
        <p className="mt-3 bg-turf/10 border border-turf/40 px-4 py-3 text-sm text-turf">{message}</p>
      )}

      <div className="mt-4">
        <label className="mb-1.5 block text-sm font-medium text-foreground">チーム名</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-input px-4 py-3 text-sm focus:border-turf focus:outline-none focus:ring-1 focus:ring-turf"
        />
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block text-sm font-medium text-foreground">チーム紹介文</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="チームの紹介文を入力してください"
          className="w-full border border-input px-4 py-3 text-sm focus:border-turf focus:outline-none focus:ring-1 focus:ring-turf"
        />
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={!isDirty || isSaving}
        className="mt-4 inline-flex items-center gap-2 bg-turf px-4 py-2 text-sm font-bold text-turf-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
        保存
      </button>
    </section>
  )
}
