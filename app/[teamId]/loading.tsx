import { SkeletonBlock } from "@/components/skeleton-block"

/**
 * チーム配下ページ共通のローディング表示。
 * ヘッダー・下部タブバーは layout 側に残したまま、本文だけスケルトンに差し替える。
 */
export default function TeamLoading() {
  return (
    <main
      role="status"
      aria-live="polite"
      aria-label="読み込み中"
      className="min-h-screen bg-background"
    >
      <div className="mx-auto max-w-6xl p-4 md:p-6">
        <SkeletonBlock className="h-8 w-48" />
        <SkeletonBlock className="mt-3 h-4 w-full max-w-md" />

        <div className="mt-8 border-b-4 border-border pb-2">
          <SkeletonBlock className="h-6 w-32" />
        </div>

        <div className="divide-y divide-border border-b border-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4 py-4">
              <div className="min-w-0 flex-1">
                <SkeletonBlock className="h-4 w-28" />
                <SkeletonBlock className="mt-2 h-5 w-40" />
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <SkeletonBlock className="h-7 w-9" />
                <SkeletonBlock className="h-7 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
