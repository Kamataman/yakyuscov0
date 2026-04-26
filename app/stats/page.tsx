"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { formatRate, type BattingStats } from "@/lib/stats"
import { cn } from "@/lib/utils"

interface PlayerStats {
  playerId: string
  playerName: string
  stats: BattingStats
}

type SortKey = keyof BattingStats | "playerName"
type SortDirection = "asc" | "desc"

// 表示する統計項目の定義（今後追加しやすいように）
const STAT_COLUMNS: Array<{
  key: keyof BattingStats
  label: string
  shortLabel: string
  format: (value: number) => string
  description?: string
}> = [
  { key: "games", label: "試合", shortLabel: "試", format: (v) => v.toString() },
  { key: "plateAppearances", label: "打席", shortLabel: "席", format: (v) => v.toString() },
  { key: "atBats", label: "打数", shortLabel: "数", format: (v) => v.toString() },
  { key: "hits", label: "安打", shortLabel: "安", format: (v) => v.toString() },
  { key: "doubles", label: "二塁打", shortLabel: "二", format: (v) => v.toString() },
  { key: "triples", label: "三塁打", shortLabel: "三", format: (v) => v.toString() },
  { key: "homeRuns", label: "本塁打", shortLabel: "本", format: (v) => v.toString() },
  { key: "rbi", label: "打点", shortLabel: "点", format: (v) => v.toString() },
  { key: "walks", label: "四球", shortLabel: "四", format: (v) => v.toString() },
  { key: "strikeouts", label: "三振", shortLabel: "振", format: (v) => v.toString() },
  { key: "stolenBases", label: "盗塁", shortLabel: "盗", format: (v) => v.toString() },
  { key: "battingAverage", label: "打率", shortLabel: "率", format: (v) => formatRate(v) },
  { key: "onBasePercentage", label: "出塁率", shortLabel: "出", format: (v) => formatRate(v) },
  { key: "sluggingPercentage", label: "長打率", shortLabel: "長", format: (v) => formatRate(v) },
  { key: "ops", label: "OPS", shortLabel: "OPS", format: (v) => formatRate(v) },
  // 今後追加する指標例:
  // { key: "isolatedPower", label: "ISO", shortLabel: "ISO", format: (v) => formatRate(v) },
  // { key: "babip", label: "BABIP", shortLabel: "BAB", format: (v) => formatRate(v) },
]

export default function StatsPage() {
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>("battingAverage")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [showAllColumns, setShowAllColumns] = useState(false)

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPlayerStats(data)
        }
        setIsLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setIsLoading(false)
      })
  }, [])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDirection("desc")
    }
  }

  const sortedStats = [...playerStats].sort((a, b) => {
    let aValue: number | string
    let bValue: number | string

    if (sortKey === "playerName") {
      aValue = a.playerName
      bValue = b.playerName
    } else {
      aValue = a.stats[sortKey] || 0
      bValue = b.stats[sortKey] || 0
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

  // 表示するカラム（モバイルでは一部のみ、全部表示モードでは全て）
  const visibleColumns = showAllColumns 
    ? STAT_COLUMNS 
    : STAT_COLUMNS.filter(col => 
        ["games", "atBats", "hits", "rbi", "battingAverage", "onBasePercentage", "ops"].includes(col.key)
      )

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) return null
    return sortDirection === "asc" 
      ? <ChevronUp className="inline h-3 w-3" />
      : <ChevronDown className="inline h-3 w-3" />
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200">
      {/* ヘッダー */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-lg font-bold text-slate-800">個人成績</h1>
          </div>
          <button
            onClick={() => setShowAllColumns(!showAllColumns)}
            className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
          >
            {showAllColumns ? "主要項目のみ" : "全項目表示"}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl p-4 md:p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : playerStats.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
            <p className="text-slate-500">まだ成績データがありません</p>
            <Link
              href="/games/new"
              className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
            >
              試合を記録する
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl bg-white shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th 
                      className="sticky left-0 z-10 bg-slate-50 px-3 py-3 text-left cursor-pointer hover:bg-slate-100"
                      onClick={() => handleSort("playerName")}
                    >
                      <span className="flex items-center gap-1">
                        選手名
                        <SortIcon columnKey="playerName" />
                      </span>
                    </th>
                    {visibleColumns.map((col) => (
                      <th
                        key={col.key}
                        className="px-2 py-3 text-center cursor-pointer hover:bg-slate-100 whitespace-nowrap"
                        onClick={() => handleSort(col.key)}
                        title={col.label}
                      >
                        <span className="flex items-center justify-center gap-1">
                          <span className="hidden sm:inline">{col.label}</span>
                          <span className="sm:hidden">{col.shortLabel}</span>
                          <SortIcon columnKey={col.key} />
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedStats.map((player, index) => (
                    <tr 
                      key={player.playerId} 
                      className={cn(
                        "border-b hover:bg-slate-50",
                        index === 0 && sortKey === "battingAverage" && "bg-yellow-50"
                      )}
                    >
                      <td className="sticky left-0 z-10 bg-white px-3 py-3 font-medium">
                        {player.playerName}
                      </td>
                      {visibleColumns.map((col) => (
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

            {/* 集計情報 */}
            <div className="border-t bg-slate-50 px-4 py-3 text-xs text-slate-500">
              <p>表示選手数: {playerStats.length}名 | ソート項目をクリックで並び替え</p>
            </div>
          </div>
        )}

        {/* 凡例 */}
        <div className="mt-4 rounded-2xl bg-white p-4 shadow-lg">
          <h3 className="mb-2 text-sm font-bold text-slate-600">指標の説明</h3>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 md:grid-cols-3 lg:grid-cols-4">
            <div><span className="font-medium">打率</span>: 安打 / 打数</div>
            <div><span className="font-medium">出塁率</span>: (安打+四球+死球) / (打数+四球+死球+犠飛)</div>
            <div><span className="font-medium">長打率</span>: 塁打 / 打数</div>
            <div><span className="font-medium">OPS</span>: 出塁率 + 長打率</div>
          </div>
        </div>
      </div>
    </main>
  )
}
