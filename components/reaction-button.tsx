"use client"

import { useEffect, useState } from "react"
import { Loader2, ThumbsUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface ReactionButtonProps {
  teamId: string
  targetType: "game"
  targetId: string
  kind: "nice_game"
  /** アイコンのみのボタンのため、スクリーンリーダー・ツールチップ用の名前として使う */
  label: string
  /** サーバー側で集計した初期件数 */
  initialCount: number
}

/** 押下済みの見た目を再訪時に復元するためのキー（実効的な重複防止はサーバー側のIPハッシュで行う） */
function storageKey(targetType: string, targetId: string, kind: string): string {
  return `reaction:${targetType}:${targetId}:${kind}`
}

export function ReactionButton({
  teamId,
  targetType,
  targetId,
  kind,
  label,
  initialCount,
}: ReactionButtonProps) {
  const [count, setCount] = useState(initialCount)
  const [reacted, setReacted] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      if (localStorage.getItem(storageKey(targetType, targetId, kind))) {
        setReacted(true)
      }
    } catch {
      // プライベートモード等で localStorage が使えなくても機能自体は成立するため無視する
    }
  }, [targetType, targetId, kind])

  const handleClick = async () => {
    if (reacted || isSending) return

    // 楽観的更新。失敗時は元に戻す
    setCount((prev) => prev + 1)
    setReacted(true)
    setIsSending(true)
    setError(null)

    try {
      const response = await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, targetType, targetId, kind }),
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error ?? "リアクションを送れませんでした")
      }

      const state = (await response.json()) as { count: number; alreadyReacted: boolean }
      setCount(state.count)
      setReacted(state.alreadyReacted)
      try {
        localStorage.setItem(storageKey(targetType, targetId, kind), "1")
      } catch {
        // 保存できなくても押下自体は成立しているため無視する
      }
    } catch (e) {
      setCount((prev) => Math.max(0, prev - 1))
      setReacted(false)
      setError(e instanceof Error ? e.message : "リアクションを送れませんでした")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={reacted || isSending}
        aria-pressed={reacted}
        aria-label={label}
        title={label}
        className={cn(
          "flex items-center gap-1.5 border px-2.5 py-1 transition-colors",
          reacted
            ? "border-turf bg-turf-tint text-turf"
            : "border-border text-muted-foreground hover:border-turf hover:text-turf active:scale-[0.98]"
        )}
      >
        {isSending ? (
          <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
        ) : (
          <ThumbsUp aria-hidden className="h-4 w-4" />
        )}
        <span className="font-display text-sm font-bold">{count}</span>
      </button>
      {error && <p className="text-sm text-stitch">{error}</p>}
    </div>
  )
}
