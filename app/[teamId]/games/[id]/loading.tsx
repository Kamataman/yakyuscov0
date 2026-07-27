import { SkeletonBlock } from "@/components/skeleton-block"
import { cn } from "@/lib/utils"

/**
 * 試合詳細のローディング表示。
 * force-dynamic かつクエリ本数が多くキャッシュも効かないため、専用スケルトンを用意する。
 */
export default function GameDetailLoading() {
  return (
    <main
      role="status"
      aria-live="polite"
      aria-label="読み込み中"
      className="min-h-screen bg-background"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 md:p-6">
        {/* 試合情報ヘッダー */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <SkeletonBlock className="h-4 w-32" />
            <SkeletonBlock className="mt-2 h-7 w-52" />
          </div>
          <SkeletonBlock className="h-10 w-24 shrink-0" />
        </div>

        {/* スコアボード(実画面と同じく横スクロール領域に収め、ページ全体を横に広げない) */}
        <div className="overflow-hidden border border-border p-3">
          {Array.from({ length: 2 }).map((_, row) => (
            <div key={row} className={cn("flex gap-2", row > 0 && "mt-2")}>
              <SkeletonBlock className="h-6 w-20 shrink-0" />
              {Array.from({ length: 9 }).map((_, i) => (
                <SkeletonBlock key={i} className="h-6 w-8 shrink-0" />
              ))}
              <SkeletonBlock className="h-6 w-12 shrink-0" />
            </div>
          ))}
        </div>

        {/* 打撃成績 */}
        <div>
          <SkeletonBlock className="h-5 w-24" />
          <div className="mt-3 divide-y divide-border overflow-hidden border border-border">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <SkeletonBlock className="h-6 w-6 shrink-0 rounded-full" />
                <SkeletonBlock className="h-5 w-24 shrink-0" />
                <SkeletonBlock className="h-5 min-w-0 flex-1" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
