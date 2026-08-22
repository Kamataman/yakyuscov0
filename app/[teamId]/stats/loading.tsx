import { SkeletonBlock } from "@/components/skeleton-block"

/**
 * 個人成績のローディング表示。
 * 全試合の打席・投球データを集計するため描画までに時間がかかる。
 */
export default function StatsLoading() {
  return (
    <main
      role="status"
      aria-live="polite"
      aria-label="読み込み中"
      className="min-h-screen bg-background"
    >
      <div className="mx-auto max-w-6xl p-4 md:p-6">
        <SkeletonBlock className="mb-4 h-12 w-64" />

        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <SkeletonBlock className="h-12 w-56" />
          <SkeletonBlock className="h-10 w-28" />
        </div>

        <SkeletonBlock className="mb-2 h-4 w-64" />

        {/* 実画面と同じく横スクロール領域に収め、ページ全体を横に広げない */}
        <div className="overflow-hidden border border-border">
          <div className="flex gap-3 border-b border-border bg-muted p-3">
            <SkeletonBlock className="h-5 w-24 shrink-0" />
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-5 w-12 shrink-0" />
            ))}
          </div>
          {Array.from({ length: 8 }).map((_, row) => (
            <div key={row} className="flex gap-3 border-b border-border p-3 last:border-b-0">
              <SkeletonBlock className="h-5 w-24 shrink-0" />
              {Array.from({ length: 6 }).map((_, col) => (
                <SkeletonBlock key={col} className="h-5 w-12 shrink-0" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
