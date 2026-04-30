"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { formatRate, type BattingStats, type PitchingStats } from "@/lib/stats"
import { cn } from "@/lib/utils"

interface PlayerBattingStats {
  playerId: string
  playerName: string
  stats: BattingStats
}

interface PlayerPitchingStats {
  playerId: string
  playerName: string
  stats: PitchingStats
}

type BattingSortKey = keyof BattingStats | "playerName"
type PitchingSortKey = keyof PitchingStats | "playerName"
type SortDirection = "asc" | "desc"
type StatsTab = "batting" | "pitching"

// 打撃成績の表示項目
const BATTING_COLUMNS: Array<{
  key: keyof BattingStats
  label: string
  shortLabel: string
  format: (value: number) => string
  primary?: boolean
}> = [
  { key: "games", label: "試合", shortLabel: "試", format: (v) => v.toString(), primary: true },
  { key: "plateAppearances", label: "打席", shortLabel: "席", format: (v) => v.toString() },
  { key: "atBats", label: "打数", shortLabel: "数", format: (v) => v.toString(), primary: true },
  { key: "hits", label: "安打", shortLabel: "安", format: (v) => v.toString(), primary: true },
  { key: "doubles", label: "二塁打", shortLabel: "二", format: (v) => v.toString() },
  { key: "triples", label: "三塁打", shortLabel: "三", format: (v) => v.toString() },
  { key: "homeRuns", label: "本塁打", shortLabel: "本", format: (v) => v.toString() },
  { key: "rbi", label: "打点", shortLabel: "点", format: (v) => v.toString(), primary: true },
  { key: "runs", label: "得点", shortLabel: "得", format: (v) => v.toString() },
  { key: "walks", label: "四球", shortLabel: "四", format: (v) => v.toString() },
  { key: "strikeouts", label: "三振", shortLabel: "振", format: (v) => v.toString() },
  { key: "stolenBases", label: "盗塁", shortLabel: "盗", format: (v) => v.toString() },
  { key: "battingAverage", label: "打率", shortLabel: "率", format: (v) => formatRate(v), primary: true },
  { key: "onBasePercentage", label: "出塁率", shortLabel: "出", format: (v) => formatRate(v), primary: true },
  { key: "sluggingPercentage", label: "長打率", shortLabel: "長", format: (v) => formatRate(v) },
  { key: "ops", label: "OPS", shortLabel: "OPS", format: (v) => formatRate(v), primary: true },
]

// 投手成績の表示項目
const PITCHING_COLUMNS: Array<{
  key: keyof PitchingStats
  label: string
  shortLabel: string
  format: (value: number) => string
  primary?: boolean
}> = [
  { key: "games", label: "登板", shortLabel: "登", format: (v) => v.toString(), primary: true },
  { key: "wins", label: "勝", shortLabel: "勝", format: (v) => v.toString(), primary: true },
  { key: "losses", label: "敗", shortLabel: "敗", format: (v) => v.toString(), primary: true },
  { key: "saves", label: "S", shortLabel: "S", format: (v) => v.toString() },
  { key: "holds", label: "H", shortLabel: "H", format: (v) => v.toString() },
  { key: "totalOuts", label: "投球回", shortLabel: "回", format: (v) => {
    const whole = Math.floor(v / 3)
    const rem = v % 3
    return rem === 0 ? `${whole}` : `${whole} ${rem}/3`
  }, primary: true },
  { key: "hits", label: "被安打", shortLabel: "被安", format: (v) => v.toString() },
  { key: "runs", label: "失点", shortLabel: "失", format: (v) => v.toString() },
  { key: "earnedRuns", label: "自責", shortLabel: "自", format: (v) => v.toString(), primary: true },
  { key: "strikeouts", label: "奪三振", shortLabel: "K", format: (v) => v.toString(), primary: true },
  { key: "walks", label: "四球", shortLabel: "四", format: (v) => v.toString() },
  { key: "homeRuns", label: "被本", shortLabel: "被本", format: (v) => v.toString() },
  { key: "era", label: "防御率", shortLabel: "防", format: (v) => v.toFixed(2), primary: true },
  { key: "whip", label: "WHIP", shortLabel: "WHIP", format: (v) => v.toFixed(2), primary: true },
  { key: "strikeoutRate", label: "K/9", shortLabel: "K/9", format: (v) => v.toFixed(2) },
  { key: "walkRate", label: "BB/9", shortLabel: "BB/9", format: (v) => v.toFixed(2) },
]

export default function StatsPage() {
  const params = useParams()
  const teamId = params.teamId as string
  
  const [battingStats, setBattingStats] = useState<PlayerBattingStats[]>([])
  const [pitchingStats, setPitchingStats] = useState<PlayerPitchingStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeTab, setActiveTab] = useState<StatsTab>("batting")
  const [battingSortKey, setBattingSortKey] = useState<BattingSortKey>("battingAverage")
  const [pitchingSortKey, setPitchingSortKey] = useState<PitchingSortKey>("era")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [showAllColumns, setShowAllColumns] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`/api/stats?teamId=${teamId}`).then(res => res.json()),
      fetch(`/api/auth/status?teamId=${teamId}`).then(res => res.json()),
    ])
      .then(([statsData, authData]) => {
        if (statsData.batting) setBattingStats(statsData.batting)
        if (statsData.pitching) setPitchingStats(statsData.pitching)
        setIsAdmin(authData.isAdmin === true)
        setIsLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setIsLoading(false)
      })
  }, [teamId])

  const handleBattingSort = (key: BattingSortKey) => {
    if (battingSortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setBattingSortKey(key)
      setSortDirection(key === "playerName" ? "asc" : "desc")
    }
  }

  const handlePitchingSort = (key: PitchingSortKey) => {
    if (pitchingSortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setPitchingSortKey(key)
      setSortDirection(key === "era" || key === "whip" || key === "walkRate" ? "asc" : "desc")
    }
  }

  const sortedBattingStats = [...battingStats].sort((a, b) => {
    let aValue: number | string
    let bValue: number | string

    if (battingSortKey === "playerName") {
      aValue = a.playerName
      bValue = b.playerName
    } else {
      aValue = a.stats[battingSortKey] || 0
      bValue = b.stats[battingSortKey] || 0
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc" 
        ? aValue.localeCompare(bValue, "ja")
        : bValue.localeCompare(aValue, "ja")
    }

    return sortDirection === "asc" 
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number)
  })

  const sortedPitchingStats = [...pitchingStats].sort((a, b) => {
    let aValue: number | string
    let bValue: number | string

    if (pitchingSortKey === "playerName") {
      aValue = a.playerName
      bValue = b.playerName
    } else {
      aValue = a.stats[pitchingSortKey] || 0
      bValue = b.stats[pitchingSortKey] || 0
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc" 
        ? aValue.localeCompare(bValue, "ja")
        : bValue.localeCompare(aValue, "ja")
    }

    return sortDirection === "asc" 
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number)
  })

  const visibleBattingColumns = showAllColumns 
    ? BATTING_COLUMNS 
    : BATTING_COLUMNS.filter(col => col.primary)

  const visiblePitchingColumns = showAllColumns 
    ? PITCHING_COLUMNS 
    : PITCHING_COLUMNS.filter(col => col.primary)

  const SortIcon = ({ active }: { active: boolean }) => {
    if (!active) return null
    return sortDirection === "asc" 
      ? <ChevronUp className="inline h-3 w-3" />
      : <ChevronDown className="inline h-3 w-3" />
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200">
      <div className="mx-auto max-w-6xl p-4 md:p-6">
        {/* タブとオプション */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex rounded-lg bg-slate-200 p-1">
            <button
              onClick={() => setActiveTab("batting")}
              className={cn(
                "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                activeTab === "batting" 
                  ? "bg-white text-slate-900 shadow-sm" 
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              打撃成績
            </button>
            <button
              onClick={() => setActiveTab("pitching")}
              className={cn(
                "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                activeTab === "pitching" 
                  ? "bg-white text-slate-900 shadow-sm" 
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              投手成績
            </button>
          </div>
          <button
            onClick={() => setShowAllColumns(!showAllColumns)}
            className="rounded-lg bg-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300"
          >
            {showAllColumns ? "主要項目のみ" : "全項目表示"}
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : activeTab === "batting" ? (
          battingStats.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
              <p className="text-slate-500">まだ打撃成績データがありません</p>
              {isAdmin && (
                <Link
                  href={`/${teamId}/games/new`}
                  className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
                >
                  試合を記録する
                </Link>
              )}
            </div>
          ) : (
            <div className="rounded-2xl bg-white shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th 
                        className="sticky left-0 z-10 bg-slate-50 px-3 py-3 text-left cursor-pointer hover:bg-slate-100"
                        onClick={() => handleBattingSort("playerName")}
                      >
                        <span className="flex items-center gap-1">
                          選手名
                          <SortIcon active={battingSortKey === "playerName"} />
                        </span>
                      </th>
                      {visibleBattingColumns.map((col) => (
                        <th
                          key={col.key}
                          className="px-2 py-3 text-center cursor-pointer hover:bg-slate-100 whitespace-nowrap"
                          onClick={() => handleBattingSort(col.key)}
                          title={col.label}
                        >
                          <span className="flex items-center justify-center gap-1">
                            <span className="hidden sm:inline">{col.label}</span>
                            <span className="sm:hidden">{col.shortLabel}</span>
                            <SortIcon active={battingSortKey === col.key} />
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedBattingStats.map((player, index) => (
                      <tr 
                        key={player.playerId} 
                        className={cn(
                          "border-b hover:bg-slate-50",
                          index === 0 && battingSortKey === "battingAverage" && "bg-yellow-50"
                        )}
                      >
                        <td className="sticky left-0 z-10 bg-white px-3 py-3 font-medium">
                          {player.playerName}
                        </td>
                        {visibleBattingColumns.map((col) => (
                          <td 
                            key={col.key} 
                            className={cn(
                              "px-2 py-3 text-center",
                              ["battingAverage", "onBasePercentage", "sluggingPercentage", "ops"].includes(col.key) 
                                && "font-mono"
                            )}
                          >
                            {col.format(player.stats[col.key])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t bg-slate-50 px-4 py-3 text-xs text-slate-500">
                <p>表示選手数: {battingStats.length}名 | ソート項目をクリックで並び替え</p>
              </div>
            </div>
          )
        ) : (
          pitchingStats.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
              <p className="text-slate-500">まだ投手成績データがありません</p>
              {isAdmin && (
                <Link
                  href={`/${teamId}/games/new`}
                  className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
                >
                  試合を記録する
                </Link>
              )}
            </div>
          ) : (
            <div className="rounded-2xl bg-white shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th 
                        className="sticky left-0 z-10 bg-slate-50 px-3 py-3 text-left cursor-pointer hover:bg-slate-100"
                        onClick={() => handlePitchingSort("playerName")}
                      >
                        <span className="flex items-center gap-1">
                          投手名
                          <SortIcon active={pitchingSortKey === "playerName"} />
                        </span>
                      </th>
                      {visiblePitchingColumns.map((col) => (
                        <th
                          key={col.key}
                          className="px-2 py-3 text-center cursor-pointer hover:bg-slate-100 whitespace-nowrap"
                          onClick={() => handlePitchingSort(col.key)}
                          title={col.label}
                        >
                          <span className="flex items-center justify-center gap-1">
                            <span className="hidden sm:inline">{col.label}</span>
                            <span className="sm:hidden">{col.shortLabel}</span>
                            <SortIcon active={pitchingSortKey === col.key} />
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPitchingStats.map((player, index) => (
                      <tr 
                        key={player.playerId} 
                        className={cn(
                          "border-b hover:bg-slate-50",
                          index === 0 && pitchingSortKey === "era" && sortDirection === "asc" && "bg-yellow-50"
                        )}
                      >
                        <td className="sticky left-0 z-10 bg-white px-3 py-3 font-medium">
                          {player.playerName}
                        </td>
                        {visiblePitchingColumns.map((col) => (
                          <td 
                            key={col.key} 
                            className={cn(
                              "px-2 py-3 text-center",
                              ["era", "whip", "strikeoutRate", "walkRate"].includes(col.key) 
                                && "font-mono"
                            )}
                          >
                            {col.format(player.stats[col.key])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t bg-slate-50 px-4 py-3 text-xs text-slate-500">
                <p>表示投手数: {pitchingStats.length}名 | ソート項目をクリックで並び替え</p>
              </div>
            </div>
          )
        )}

        {/* 凡例 */}
        <div className="mt-4 rounded-2xl bg-white p-4 shadow-lg">
          <h3 className="mb-2 text-sm font-bold text-slate-600">指標の説明</h3>
          {activeTab === "batting" ? (
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 md:grid-cols-3 lg:grid-cols-4">
              <div><span className="font-medium">打率</span>: 安打 / 打数</div>
              <div><span className="font-medium">出塁率</span>: (安打+四球+死球) / (打数+四球+死球+犠飛)</div>
              <div><span className="font-medium">長打率</span>: 塁打 / 打数</div>
              <div><span className="font-medium">OPS</span>: 出塁率 + 長打率</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 md:grid-cols-3 lg:grid-cols-4">
              <div><span className="font-medium">防御率</span>: 自責点 x 9 / 投球回</div>
              <div><span className="font-medium">WHIP</span>: (被安打+四球) / 投球回</div>
              <div><span className="font-medium">K/9</span>: 奪三振 x 9 / 投球回</div>
              <div><span className="font-medium">BB/9</span>: 四球 x 9 / 投球回</div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
