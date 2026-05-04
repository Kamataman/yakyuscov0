"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import type { PitcherInningStats } from "@/lib/batting-types"

interface PitcherRow {
  id: string
  pitcher_award: string | null
  player_name: string
  innings_outs: number
  is_mid_inning_exit: boolean
  batters_faced?: number
  hits: number
  home_runs: number
  strikeouts: number
  walks: number
  hit_by_pitch: number
  runs: number
  earned_runs: number
  inningStats: PitcherInningStats[]
}

interface Props {
  pitchers: PitcherRow[]
  totalInnings: number
}

function formatInnings(outs: number, isMidInningExit: boolean): string {
  const whole = Math.floor(outs / 3)
  const rem = outs % 3
  if (rem === 0 && isMidInningExit) return `${whole} 0/3`
  if (rem === 0) return `${whole}`
  return `${whole} ${rem}/3`
}

function sumInningStats(stats: PitcherInningStats[]) {
  const totals = stats.reduce(
    (acc, s) => ({
      hits: acc.hits + s.hits,
      runs: acc.runs + s.runs,
      earnedRuns: acc.earnedRuns + s.earnedRuns,
      strikeouts: acc.strikeouts + s.strikeouts,
      walks: acc.walks + s.walks,
      hitByPitch: acc.hitByPitch + s.hitByPitch,
      homeRuns: acc.homeRuns + s.homeRuns,
      battersFaced: acc.battersFaced + s.battersFaced,
      totalOuts: acc.totalOuts + (s.outs ?? 3),
    }),
    { hits: 0, runs: 0, earnedRuns: 0, strikeouts: 0, walks: 0, hitByPitch: 0, homeRuns: 0, battersFaced: 0, totalOuts: 0 }
  )
  const lastInning = stats[stats.length - 1]
  return { ...totals, isMidInningExit: lastInning ? (lastInning.outs ?? 3) < 3 : false }
}

const STAT_ROWS = ["失点", "安打", "三振"] as const

export function PitcherResultsSection({ pitchers, totalInnings }: Props) {
  const hasInningData = pitchers.some(p => p.inningStats.length > 0)
  const [viewMode, setViewMode] = useState<"aggregate" | "inning">("aggregate")

  if (pitchers.length === 0) {
    return (
      <div className="rounded-2xl bg-white shadow-lg overflow-hidden">
        <h2 className="px-4 py-3 text-sm font-bold text-slate-600 border-b border-slate-200 bg-slate-50">投手成績</h2>
        <p className="p-4 py-8 text-center text-slate-400">投手成績が登録されていません</p>
      </div>
    )
  }

  const inningColumns = Array.from({ length: totalInnings }, (_, i) => i + 1)

  const getInningValue = (pitcher: PitcherRow, inning: number, stat: typeof STAT_ROWS[number]): number | null => {
    const s = pitcher.inningStats.find(x => x.inning === inning)
    if (!s) return null
    if (stat === "失点") return s.runs
    if (stat === "安打") return s.hits
    return s.strikeouts
  }

  return (
    <div className="rounded-2xl bg-white shadow-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-slate-600">投手成績</h2>
        {hasInningData && (
          <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs font-medium">
            <button
              onClick={() => setViewMode("aggregate")}
              className={cn(
                "px-3 py-1.5 transition-colors",
                viewMode === "aggregate" ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
              )}
            >
              試合合計
            </button>
            <button
              onClick={() => setViewMode("inning")}
              className={cn(
                "px-3 py-1.5 transition-colors",
                viewMode === "inning" ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
              )}
            >
              イニングごと
            </button>
          </div>
        )}
      </div>

      {viewMode === "aggregate" ? (
        <div className="overflow-x-auto">
          <table className="w-full text-center text-sm">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="sticky left-0 z-20 bg-slate-50 w-10 min-w-[40px] px-2 py-2"></th>
                <th className="sticky left-10 z-20 bg-slate-50 min-w-[5rem] px-2 py-2 text-left">投手</th>
                <th className="px-2 py-2 vertical-text">投球回</th>
                <th className="px-2 py-2 vertical-text">打者</th>
                <th className="px-2 py-2 vertical-text">被安</th>
                <th className="px-2 py-2 vertical-text">被本</th>
                <th className="px-2 py-2 vertical-text">三振</th>
                <th className="px-2 py-2 vertical-text">四球</th>
                <th className="px-2 py-2 vertical-text">死球</th>
                <th className="px-2 py-2 vertical-text">失点</th>
                <th className="px-2 py-2 vertical-text">自責</th>
              </tr>
            </thead>
            <tbody className="[writing-mode:horizontal-tb]">
              {pitchers.map((pitcher, index) => {
                const hasInning = pitcher.inningStats.length > 0
                const inningSum = hasInning ? sumInningStats(pitcher.inningStats) : null
                const stats = inningSum ?? {
                  hits: pitcher.hits,
                  runs: pitcher.runs,
                  earnedRuns: pitcher.earned_runs,
                  strikeouts: pitcher.strikeouts,
                  walks: pitcher.walks,
                  hitByPitch: pitcher.hit_by_pitch,
                  homeRuns: pitcher.home_runs,
                  battersFaced: pitcher.batters_faced ?? 0,
                }
                const inningsOuts = inningSum ? inningSum.totalOuts : pitcher.innings_outs
                const isMidInningExit = inningSum ? inningSum.isMidInningExit : pitcher.is_mid_inning_exit
                return (
                  <tr key={index} className="border-b">
                    <td className="sticky left-0 z-10 bg-white w-10 min-w-[40px] px-2 py-2 [text-orientation:upright]">
                      {pitcher.pitcher_award === "win"  && <span className="rounded bg-blue-100 px-1 text-blue-700">勝</span>}
                      {pitcher.pitcher_award === "lose" && <span className="rounded bg-red-100 px-1 text-red-700">敗</span>}
                      {pitcher.pitcher_award === "save" && <span className="rounded bg-green-100 px-1 text-green-700">S</span>}
                      {pitcher.pitcher_award === "hold" && <span className="rounded bg-purple-100 px-1 text-purple-700">H</span>}
                    </td>
                    <td className="sticky left-10 z-10 bg-white min-w-[4rem] max-w-[5rem] px-2 py-2 text-left font-medium">{pitcher.player_name}</td>
                    <td className="px-2 py-2">{formatInnings(inningsOuts, isMidInningExit)}</td>
                    <td className="px-2 py-2">{stats.battersFaced}</td>
                    <td className="px-2 py-2">{stats.hits}</td>
                    <td className="px-2 py-2">{stats.homeRuns}</td>
                    <td className="px-2 py-2">{stats.strikeouts}</td>
                    <td className="px-2 py-2">{stats.walks}</td>
                    <td className="px-2 py-2">{stats.hitByPitch}</td>
                    <td className="px-2 py-2">{stats.runs}</td>
                    <td className="px-2 py-2">{stats.earnedRuns}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-2 py-2 text-center font-medium w-8">#</th>
                <th className="px-2 py-2 text-left font-medium min-w-[4rem] max-w-[5rem]">投手</th>
                <th className="px-2 py-2 text-center font-medium w-10">項目</th>
                {inningColumns.map(n => (
                  <th key={n} className="px-1 py-2 text-center font-medium w-8">{n}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pitchers.map((pitcher, pIdx) =>
                STAT_ROWS.map((stat, sIdx) => (
                  <tr key={`${pIdx}-${stat}`} className={cn("border-t border-slate-100", sIdx === 0 && pIdx > 0 && "border-t-2 border-slate-200")}>
                    {sIdx === 0 && (
                      <>
                        <td rowSpan={3} className="px-2 py-1 text-center text-slate-500 align-middle">{pIdx + 1}</td>
                        <td rowSpan={3} className="px-2 py-1 align-middle min-w-[4rem] max-w-[5rem]">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1">
                              {pitcher.pitcher_award === "win"  && <span className="text-xs text-amber-500 font-bold">勝</span>}
                              {pitcher.pitcher_award === "lose" && <span className="text-xs text-slate-500 font-bold">敗</span>}
                              {pitcher.pitcher_award === "save" && <span className="text-xs text-blue-500 font-bold">S</span>}
                              {pitcher.pitcher_award === "hold" && <span className="text-xs text-emerald-500 font-bold">H</span>}
                              <span className="font-medium text-slate-800">{pitcher.player_name}</span>
                            </div>
                            <span className="text-xs text-slate-400">{formatInnings(pitcher.innings_outs, pitcher.is_mid_inning_exit)}</span>
                          </div>
                        </td>
                      </>
                    )}
                    <td className="px-2 py-1 text-center text-xs text-slate-500 whitespace-nowrap">{stat}</td>
                    {inningColumns.map(inning => {
                      const val = getInningValue(pitcher, inning, stat)
                      return (
                        <td key={inning} className="px-1 py-1 text-center">
                          {val !== null ? (
                            <span className={cn("font-medium", val > 0 && stat === "失点" && "text-red-600")}>{val}</span>
                          ) : (
                            <span className="text-slate-200">-</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
