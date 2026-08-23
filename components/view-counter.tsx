"use client"

import { useEffect, useRef, useState } from "react"
import { Eye } from "lucide-react"

interface ViewCounterProps {
  teamId: string
  gameId: string
  /** サーバー側で保持している加算前の閲覧数 */
  initialCount: number
}

/**
 * 試合ページの閲覧数を表示し、マウント時に加算する。
 *
 * 加算をクライアント起点にすることでページ描画をブロックせず、JSを実行しない
 * クローラのアクセスも自然に除外できる。重複判定（30分・IPハッシュ）は
 * POST /api/views 側で行う。
 */
export function ViewCounter({ teamId, gameId, initialCount }: ViewCounterProps) {
  const [count, setCount] = useState(initialCount)
  // 開発時のStrictModeによる二重実行で無駄なリクエストを出さないためのガード
  // （実効的な重複防止はサーバー側のIPハッシュ）
  const hasSent = useRef(false)

  useEffect(() => {
    if (hasSent.current) return
    hasSent.current = true

    const sendView = async () => {
      try {
        const response = await fetch("/api/views", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamId, targetType: "game", targetId: gameId }),
        })
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null
          throw new Error(body?.error ?? "閲覧数を記録できませんでした")
        }
        const result = (await response.json()) as { count?: number; counted: boolean }
        if (typeof result.count === "number") {
          setCount(result.count)
        }
      } catch (error) {
        // 受動的な表示のため、失敗しても加算前の件数を出したままにする
        console.error("閲覧数の記録に失敗しました", error)
      }
    }

    void sendView()
  }, [teamId, gameId])

  return (
    <div className="flex items-center gap-1.5 text-muted-foreground" title="閲覧数">
      <Eye aria-hidden className="h-4 w-4" />
      <span className="font-display text-sm font-bold">{count}</span>
      <span className="sr-only">回閲覧されました</span>
    </div>
  )
}
