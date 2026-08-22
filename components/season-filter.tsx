import Link from "next/link"
import { LinkPendingOverlay } from "@/components/link-pending-overlay"
import { SEASON_ALL, seasonHref, type SeasonFilter as SeasonValue } from "@/lib/season"
import { cn } from "@/lib/utils"

interface SeasonFilterProps {
  /** 試合が存在する年度（新しい順） */
  seasons: number[]
  current: SeasonValue
  /** 年度クエリを付けるページのパス（例: /team-a/games） */
  basePath: string
  className?: string
}

/**
 * 年度の切り替えタブ。
 * 年度が1つだけのチームでは通算と同じ内容になるが、年度という軸があることを
 * 示すためタブは表示する。試合が1件もない場合のみ表示しない。
 * 年度の切り替えは同一ルート内のクエリ遷移で loading.tsx に頼れないため、
 * タップ直後の active スタイルと遷移待ちのスピナーを各タブに持たせる。
 * スピナーはラベルに重ねて出し、待機中もタブの幅を変えない。
 */
export function SeasonFilter({ seasons, current, basePath, className }: SeasonFilterProps) {
  if (seasons.length === 0) return null

  const options: SeasonValue[] = [...seasons, SEASON_ALL]

  return (
    <nav aria-label="年度の切り替え" className={cn("flex overflow-x-auto border border-border p-1", className)}>
      {options.map((option) => {
        const isActive = option === current
        return (
          <Link
            key={String(option)}
            href={seasonHref(basePath, option)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative shrink-0 whitespace-nowrap px-4 py-2 text-sm font-bold transition-all duration-200",
              isActive
                ? "bg-turf text-turf-foreground active:opacity-75"
                : "text-muted-foreground hover:text-foreground active:bg-turf-tint"
            )}
          >
            <LinkPendingOverlay>
              {option === SEASON_ALL ? (
                "通算"
              ) : (
                <>
                  <span className="font-display">{option}</span>年
                </>
              )}
            </LinkPendingOverlay>
          </Link>
        )
      })}
    </nav>
  )
}
