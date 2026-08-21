"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown, ChevronUp } from "lucide-react"
import { formatCount, formatDecimal, formatRate, type BattingStats, type PitchingStats } from "@/lib/stats"
import { cn } from "@/lib/utils"

interface PlayerBattingStats {
  playerId: string
  playerName: string
  stats: BattingStats
  isQualified: boolean
}

interface PlayerPitchingStats {
  playerId: string
  playerName: string
  stats: PitchingStats
  isQualified: boolean
}

type BattingSortKey = keyof BattingStats | "playerName"
type PitchingSortKey = keyof PitchingStats | "playerName"
type SortDirection = "asc" | "desc"
type StatsTab = "batting" | "pitching"

// 率のカラムは規定打席・規定投球回に達しているかどうかを第一ソートキーにする
const RATE_BATTING_KEYS = ["battingAverage", "onBasePercentage", "sluggingPercentage", "ops", "rispAverage"] as const
const RATE_PITCHING_KEYS = ["era", "whip", "strikeoutRate", "walkRate"] as const

type RateBattingKey = (typeof RATE_BATTING_KEYS)[number]
type RatePitchingKey = (typeof RATE_PITCHING_KEYS)[number]

const isRateBattingKey = (key: BattingSortKey): key is RateBattingKey =>
  (RATE_BATTING_KEYS as readonly string[]).includes(key)
const isRatePitchingKey = (key: PitchingSortKey): key is RatePitchingKey =>
  (RATE_PITCHING_KEYS as readonly string[]).includes(key)

// 防御率・WHIP・BB/9 は値が小さいほど好成績なので、既定のソート方向を昇順にする
const LOWER_IS_BETTER_PITCHING_KEYS: PitchingSortKey[] = ["era", "whip", "walkRate"]

const defaultPitchingSortDirection = (key: PitchingSortKey): SortDirection =>
  key === "playerName" || LOWER_IS_BETTER_PITCHING_KEYS.includes(key) ? "asc" : "desc"

const BATTING_COLUMNS: Array<{
  key: keyof BattingStats
  label: string
  shortLabel: string
  format: (value: number | null) => string
  primary?: boolean
}> = [
  { key: "games", label: "試合", shortLabel: "試", format: formatCount, primary: true },
  { key: "plateAppearances", label: "打席", shortLabel: "席", format: formatCount },
  { key: "atBats", label: "打数", shortLabel: "数", format: formatCount, primary: true },
  { key: "hits", label: "安打", shortLabel: "安", format: formatCount, primary: true },
  { key: "doubles", label: "二塁打", shortLabel: "二", format: formatCount },
  { key: "triples", label: "三塁打", shortLabel: "三", format: formatCount },
  { key: "homeRuns", label: "本塁打", shortLabel: "本", format: formatCount },
  { key: "rbi", label: "打点", shortLabel: "点", format: formatCount, primary: true },
  { key: "runs", label: "得点", shortLabel: "得", format: formatCount },
  { key: "walks", label: "四球", shortLabel: "四", format: formatCount },
  { key: "strikeouts", label: "三振", shortLabel: "振", format: formatCount },
  { key: "stolenBases", label: "盗塁", shortLabel: "盗", format: formatCount },
  { key: "battingAverage", label: "打率", shortLabel: "率", format: formatRate, primary: true },
  { key: "onBasePercentage", label: "出塁率", shortLabel: "出", format: formatRate, primary: true },
  { key: "sluggingPercentage", label: "長打率", shortLabel: "長", format: formatRate },
  { key: "rispAverage", label: "得点圏打率", shortLabel: "圏", format: formatRate },
  { key: "ops", label: "OPS", shortLabel: "OPS", format: formatRate, primary: true },
]

const PITCHING_COLUMNS: Array<{
  key: keyof PitchingStats
  label: string
  shortLabel: string
  format: (value: number | null) => string
  primary?: boolean
}> = [
  { key: "games", label: "登板", shortLabel: "登", format: formatCount, primary: true },
  { key: "wins", label: "勝", shortLabel: "勝", format: formatCount, primary: true },
  { key: "losses", label: "敗", shortLabel: "敗", format: formatCount, primary: true },
  { key: "saves", label: "S", shortLabel: "S", format: formatCount },
  { key: "holds", label: "H", shortLabel: "H", format: formatCount },
  { key: "totalOuts", label: "投球回", shortLabel: "回", format: (v) => {
    if (v === null) return "-"
    const whole = Math.floor(v / 3)
    const rem = v % 3
    return rem === 0 ? `${whole}` : `${whole} ${rem}/3`
  }, primary: true },
  { key: "battersFaced", label: "打者", shortLabel: "打者", format: formatCount },
  { key: "hits", label: "被安打", shortLabel: "被安", format: formatCount },
  { key: "runs", label: "失点", shortLabel: "失", format: formatCount },
  { key: "earnedRuns", label: "自責", shortLabel: "自", format: formatCount, primary: true },
  { key: "strikeouts", label: "奪三振", shortLabel: "K", format: formatCount, primary: true },
  { key: "walks", label: "四球", shortLabel: "四", format: formatCount },
  { key: "homeRuns", label: "被本", shortLabel: "被本", format: formatCount },
  { key: "era", label: "防御率", shortLabel: "防", format: formatDecimal, primary: true },
  { key: "whip", label: "WHIP", shortLabel: "WHIP", format: formatDecimal, primary: true },
  { key: "strikeoutRate", label: "K/9", shortLabel: "K/9", format: formatDecimal },
  { key: "walkRate", label: "BB/9", shortLabel: "BB/9", format: formatDecimal },
]

interface StatsClientProps {
  battingStats: PlayerBattingStats[]
  pitchingStats: PlayerPitchingStats[]
  isAdmin: boolean
  teamId: string
  qualifiedPlateAppearances: number
  qualifiedInningsPitched: number
}

export function StatsClient({ battingStats, pitchingStats, isAdmin, teamId, qualifiedPlateAppearances, qualifiedInningsPitched }: StatsClientProps) {
  const [activeTab, setActiveTab] = useState<StatsTab>("batting")
  const [battingSortKey, setBattingSortKey] = useState<BattingSortKey>("battingAverage")
  const [pitchingSortKey, setPitchingSortKey] = useState<PitchingSortKey>("era")
  const [battingSortDirection, setBattingSortDirection] = useState<SortDirection>("desc")
  const [pitchingSortDirection, setPitchingSortDirection] = useState<SortDirection>(defaultPitchingSortDirection("era"))
  const [showAllColumns, setShowAllColumns] = useState(false)

  const handleBattingSort = (key: BattingSortKey) => {
    if (battingSortKey === key) {
      setBattingSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setBattingSortKey(key)
      setBattingSortDirection(key === "playerName" ? "asc" : "desc")
    }
  }

  const handlePitchingSort = (key: PitchingSortKey) => {
    if (pitchingSortKey === key) {
      setPitchingSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setPitchingSortKey(key)
      setPitchingSortDirection(defaultPitchingSortDirection(key))
    }
  }

  const sortedBattingStats = [...battingStats].sort((a, b) => {
    if (isRateBattingKey(battingSortKey)) {
      // 分母0で率を算出できない選手は、昇順ソートで先頭に来ないよう常に最後尾へ送る
      const aHasRate = a.stats[battingSortKey] !== null
      const bHasRate = b.stats[battingSortKey] !== null
      if (aHasRate !== bHasRate) {
        return aHasRate ? -1 : 1
      }
      if (a.isQualified !== b.isQualified) {
        return a.isQualified ? -1 : 1
      }
    }
    const aValue: number | string = battingSortKey === "playerName" ? a.playerName : (a.stats[battingSortKey] ?? 0)
    const bValue: number | string = battingSortKey === "playerName" ? b.playerName : (b.stats[battingSortKey] ?? 0)
    if (typeof aValue === "string" && typeof bValue === "string") {
      return battingSortDirection === "asc" ? aValue.localeCompare(bValue, "ja") : bValue.localeCompare(aValue, "ja")
    }
    return battingSortDirection === "asc" ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number)
  })

  const sortedPitchingStats = [...pitchingStats].sort((a, b) => {
    if (isRatePitchingKey(pitchingSortKey)) {
      // 分母0（投球回0）で率を算出できない投手は、昇順ソートで先頭に来ないよう常に最後尾へ送る
      const aHasRate = a.stats[pitchingSortKey] !== null
      const bHasRate = b.stats[pitchingSortKey] !== null
      if (aHasRate !== bHasRate) {
        return aHasRate ? -1 : 1
      }
      if (a.isQualified !== b.isQualified) {
        return a.isQualified ? -1 : 1
      }
    }
    const aValue: number | string = pitchingSortKey === "playerName" ? a.playerName : (a.stats[pitchingSortKey] ?? 0)
    const bValue: number | string = pitchingSortKey === "playerName" ? b.playerName : (b.stats[pitchingSortKey] ?? 0)
    if (typeof aValue === "string" && typeof bValue === "string") {
      return pitchingSortDirection === "asc" ? aValue.localeCompare(bValue, "ja") : bValue.localeCompare(aValue, "ja")
    }
    return pitchingSortDirection === "asc" ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number)
  })

  const visibleBattingColumns = showAllColumns ? BATTING_COLUMNS : BATTING_COLUMNS.filter((col) => col.primary)
  const visiblePitchingColumns = showAllColumns ? PITCHING_COLUMNS : PITCHING_COLUMNS.filter((col) => col.primary)

  const qualifiedPlateAppearancesLabel = `${Math.ceil(qualifiedPlateAppearances)}打席`
  const qualifiedInningsOuts = Math.round(qualifiedInningsPitched * 3)
  const qualifiedInningsWhole = Math.floor(qualifiedInningsOuts / 3)
  const qualifiedInningsRem = qualifiedInningsOuts % 3
  const qualifiedInningsPitchedLabel = qualifiedInningsRem === 0 ? `${qualifiedInningsWhole}回` : `${qualifiedInningsWhole} ${qualifiedInningsRem}/3回`

  const SortIcon = ({ active, direction }: { active: boolean; direction: SortDirection }) => {
    if (!active) return null
    return direction === "asc" ? <ChevronUp className="inline h-3 w-3" /> : <ChevronDown className="inline h-3 w-3" />
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl p-4 md:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex border border-border p-1">
            <button
              onClick={() => setActiveTab("batting")}
              className={cn("px-4 py-2 text-sm font-medium transition-colors", activeTab === "batting" ? "bg-turf text-turf-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              打撃成績
            </button>
            <button
              onClick={() => setActiveTab("pitching")}
              className={cn("px-4 py-2 text-sm font-medium transition-colors", activeTab === "pitching" ? "bg-turf text-turf-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              投手成績
            </button>
          </div>
          <button
            onClick={() => setShowAllColumns(!showAllColumns)}
            className="border border-border px-3 py-2 text-sm font-medium text-foreground/70 hover:bg-muted"
          >
            {showAllColumns ? "主要項目のみ" : "全項目表示"}
          </button>
        </div>

        <p className="mb-2 text-xs text-muted-foreground">
          {activeTab === "batting"
            ? `規定打席: ${qualifiedPlateAppearancesLabel}以上（未到達選手は網掛け表示）`
            : `規定投球回: ${qualifiedInningsPitchedLabel}以上（未到達選手は網掛け表示）`}
        </p>

        {activeTab === "batting" ? (
          battingStats.length === 0 ? (
            <div className="border border-border p-8 text-center">
              <p className="text-muted-foreground">まだ打撃成績データがありません</p>
              {isAdmin && (
                <Link href={`/${teamId}/games/new`} className="mt-4 inline-block bg-turf px-4 py-2 text-sm font-bold text-turf-foreground hover:bg-turf/90">
                  試合を記録する
                </Link>
              )}
            </div>
          ) : (
            <div className="border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted">
                      <th className="sticky left-0 z-10 bg-muted px-3 py-3 text-left cursor-pointer hover:bg-muted-foreground/10 whitespace-nowrap" onClick={() => handleBattingSort("playerName")}>
                        <span className="flex items-center gap-1">選手名<SortIcon active={battingSortKey === "playerName"} direction={battingSortDirection} /></span>
                      </th>
                      {visibleBattingColumns.map((col) => (
                        <th key={col.key} className="px-2 py-3 text-center cursor-pointer hover:bg-muted-foreground/10 vertical-text" onClick={() => handleBattingSort(col.key)} title={col.label}>
                          {col.label}<SortIcon active={battingSortKey === col.key} direction={battingSortDirection} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="[writing-mode:horizontal-tb]">
                    {sortedBattingStats.map((player, index) => (
                      <tr
                        key={player.playerId}
                        className={cn(
                          "border-b border-border",
                          player.isQualified ? "hover:bg-muted/50" : "bg-muted hover:bg-muted-foreground/10",
                          index === 0 && battingSortKey === "battingAverage" && "bg-turf/10"
                        )}
                      >
                        <td className={cn("sticky left-0 z-10 px-3 py-3 font-medium whitespace-nowrap", player.isQualified ? "bg-background" : "bg-muted")}>{player.playerName}</td>
                        {visibleBattingColumns.map((col) => (
                          <td key={col.key} className={cn("px-2 py-3 text-center", isRateBattingKey(col.key) && "font-display")}>
                            {col.format(player.stats[col.key])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-border bg-muted px-4 py-3 text-xs text-muted-foreground">
                <p>表示選手数: {battingStats.length}名 | ソート項目をクリックで並び替え</p>
              </div>
            </div>
          )
        ) : (
          pitchingStats.length === 0 ? (
            <div className="border border-border p-8 text-center">
              <p className="text-muted-foreground">まだ投手成績データがありません</p>
              {isAdmin && (
                <Link href={`/${teamId}/games/new`} className="mt-4 inline-block bg-turf px-4 py-2 text-sm font-bold text-turf-foreground hover:bg-turf/90">
                  試合を記録する
                </Link>
              )}
            </div>
          ) : (
            <div className="border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted">
                      <th className="sticky left-0 z-10 bg-muted px-3 py-3 text-left cursor-pointer hover:bg-muted-foreground/10 whitespace-nowrap" onClick={() => handlePitchingSort("playerName")}>
                        <span className="flex items-center gap-1">投手名<SortIcon active={pitchingSortKey === "playerName"} direction={pitchingSortDirection} /></span>
                      </th>
                      {visiblePitchingColumns.map((col) => (
                        <th key={col.key} className="px-2 py-3 text-center cursor-pointer hover:bg-muted-foreground/10 vertical-text" onClick={() => handlePitchingSort(col.key)} title={col.label}>
                          {col.label}<SortIcon active={pitchingSortKey === col.key} direction={pitchingSortDirection} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="[writing-mode:horizontal-tb]">
                    {sortedPitchingStats.map((player, index) => (
                      <tr
                        key={player.playerId}
                        className={cn(
                          "border-b border-border",
                          player.isQualified ? "hover:bg-muted/50" : "bg-muted hover:bg-muted-foreground/10",
                          index === 0 && pitchingSortKey === "era" && pitchingSortDirection === "asc" && "bg-turf/10"
                        )}
                      >
                        <td className={cn("sticky left-0 z-10 px-3 py-3 font-medium whitespace-nowrap", player.isQualified ? "bg-background" : "bg-muted")}>{player.playerName}</td>
                        {visiblePitchingColumns.map((col) => (
                          <td key={col.key} className={cn("px-2 py-3 text-center", isRatePitchingKey(col.key) && "font-display")}>
                            {col.format(player.stats[col.key])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-border bg-muted px-4 py-3 text-xs text-muted-foreground">
                <p>表示投手数: {pitchingStats.length}名 | ソート項目をクリックで並び替え</p>
              </div>
            </div>
          )
        )}

        <div className="mt-4 border border-border p-4">
          <h3 className="mb-2 text-sm font-bold text-foreground">指標の説明</h3>
          {activeTab === "batting" ? (
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground md:grid-cols-3 lg:grid-cols-4">
              <div><span className="font-medium text-foreground">打率</span>: 安打 / 打数</div>
              <div><span className="font-medium text-foreground">出塁率</span>: (安打+四球+死球) / (打数+四球+死球+犠飛)</div>
              <div><span className="font-medium text-foreground">長打率</span>: 塁打 / 打数</div>
              <div><span className="font-medium text-foreground">得点圏打率</span>: 二塁または三塁に走者がいる打席での 安打 / 打数</div>
              <div><span className="font-medium text-foreground">OPS</span>: 出塁率 + 長打率</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground md:grid-cols-3 lg:grid-cols-4">
              <div><span className="font-medium text-foreground">防御率</span>: 自責点 x 9 / 投球回</div>
              <div><span className="font-medium text-foreground">WHIP</span>: (被安打+四球) / 投球回</div>
              <div><span className="font-medium text-foreground">K/9</span>: 奪三振 x 9 / 投球回</div>
              <div><span className="font-medium text-foreground">BB/9</span>: 四球 x 9 / 投球回</div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
