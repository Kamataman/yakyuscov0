"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Loader2, RefreshCw, Sparkles, Trash2 } from "lucide-react"
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog"
import { AI_REVIEW_MAX_REGENERATE_COUNT } from "@/lib/constants"

interface AiReviewSectionProps {
  gameId: string
  isAdmin: boolean
  aiReview: string | null
  aiReviewError: string | null
  regenerateCount: number
  canGenerate: boolean
  aiFeatureEnabled: boolean
}

async function requestAiReview(gameId: string, method: "POST" | "DELETE"): Promise<string | null> {
  const response = await fetch(`/api/games/${gameId}/ai-review`, { method })
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.error ?? "処理に失敗しました")
  }
  return data
}

export function AiReviewSection({
  gameId,
  isAdmin,
  aiReview,
  aiReviewError,
  regenerateCount,
  canGenerate,
  aiFeatureEnabled,
}: AiReviewSectionProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  // 直近の操作結果（このタブに残っていた場合の即時表示用）。離脱していた場合はaiReviewError（DB保存分）で代替する
  const [localError, setLocalError] = useState<string | null>(null)

  if (!aiReview && (!isAdmin || !aiFeatureEnabled)) return null

  const handleGenerate = () => {
    setLocalError(null)
    startTransition(async () => {
      try {
        await requestAiReview(gameId, "POST")
      } catch (err) {
        setLocalError(err instanceof Error ? err.message : "生成に失敗しました")
      }
      router.refresh()
    })
  }

  const handleDelete = () => {
    setDeleteDialogOpen(false)
    setLocalError(null)
    startTransition(async () => {
      try {
        await requestAiReview(gameId, "DELETE")
      } catch (err) {
        setLocalError(err instanceof Error ? err.message : "削除に失敗しました")
      }
      router.refresh()
    })
  }

  const remainingCount = AI_REVIEW_MAX_REGENERATE_COUNT - regenerateCount
  const displayError = localError ?? aiReviewError

  return (
    <div>
      <h2 className="mb-3 text-sm font-bold text-foreground border-b-2 border-foreground pb-1">試合戦評</h2>
      <div className="border border-border p-4">
        {aiReview ? (
          <>
            <p className="whitespace-pre-wrap text-sm text-foreground">{aiReview}</p>
            <p className="mt-3 text-right text-xs text-muted-foreground">この文章はAIが自動生成したものです。</p>
            {displayError && (
              <p className="mt-3 flex items-start gap-1.5 text-xs text-stitch">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 translate-y-0.5" />
                前回の再生成に失敗しました: {displayError}
              </p>
            )}
            {isAdmin && (
              <div className="mt-4 flex flex-wrap gap-2">
                {aiFeatureEnabled && (
                  <button
                    onClick={handleGenerate}
                    disabled={isPending || remainingCount <= 0}
                    className="flex items-center gap-2 border border-turf px-4 py-2 text-sm font-bold text-turf transition-colors hover:bg-turf hover:text-turf-foreground disabled:opacity-50"
                  >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    再生成（残り{Math.max(0, remainingCount)}回）
                  </button>
                )}
                <button
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={isPending}
                  className="flex items-center gap-2 border border-stitch px-4 py-2 text-sm font-bold text-stitch transition-colors hover:bg-stitch hover:text-stitch-foreground disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  削除
                </button>
              </div>
            )}
          </>
        ) : (
          <div>
            <button
              onClick={handleGenerate}
              disabled={isPending || !canGenerate}
              className="flex items-center gap-2 bg-turf px-4 py-2 text-sm font-bold text-turf-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              AIで作成
            </button>
            {displayError ? (
              <p className="mt-2 flex items-start gap-1.5 text-xs text-stitch">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 translate-y-0.5" />
                生成に失敗しました: {displayError}
              </p>
            ) : (
              !canGenerate && <p className="mt-2 text-xs text-muted-foreground">試合内容を充実させてください</p>
            )}
          </div>
        )}
      </div>
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="試合戦評を削除しますか？"
        description="この操作は取り消せません。再生成の回数はリセットされません。"
        onConfirm={handleDelete}
        isPending={isPending}
      />
    </div>
  )
}
