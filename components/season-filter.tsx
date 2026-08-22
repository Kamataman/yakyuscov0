import Link from "next/link"
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
 * 年度が1つしかないチームでは通算と同じ内容になるため表示しない。
 */
export function SeasonFilter({ seasons, current, basePath, className }: SeasonFilterProps) {
  if (seasons.length <= 1) return null

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
              "shrink-0 whitespace-nowrap px-4 py-2 text-sm font-bold transition-colors",
              isActive ? "bg-turf text-turf-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option === SEASON_ALL ? (
              "通算"
            ) : (
              <>
                <span className="font-display">{option}</span>年
              </>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
