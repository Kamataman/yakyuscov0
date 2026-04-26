"use client"

import { cn } from "@/lib/utils"
import { Plus } from "lucide-react"
import type { BattingResult, LineupSlot } from "@/lib/batting-types"
import { getResultSummary, isHit, isOnBase } from "@/lib/batting-types"

interface BattingGridProps {
  results: Record<string, BattingResult>
  onCellClick: (position: { battingOrder: number; inning: number }) => void
  lineupSlots: LineupSlot[]
  onPlayerClick: (order: number) => void
  onAddBattingOrder?: () => void
  totalInnings?: number
}

export function BattingGrid({ 
  results, 
  onCellClick, 
  lineupSlots, 
  onPlayerClick,
  onAddBattingOrder,
  totalInnings = 9
}: BattingGridProps) {
  const maxBattingOrder = Math.max(lineupSlots.length, 9)
  const battingOrders = Array.from({ length: maxBattingOrder }, (_, i) => i + 1)
  const innings = Array.from({ length: totalInnings }, (_, i) => i + 1)

  const getResult = (battingOrder: number, inning: number): BattingResult | undefined => {
    return results[`${battingOrder}-${inning}`]
  }

  const getCellStyle = (result: BattingResult | undefined) => {
    if (!result) return ""
    
    if (isHit(result.hitResult)) {
      return "bg-emerald-100 text-emerald-700"
    }
    if (isOnBase(result.hitResult)) {
      return "bg-blue-100 text-blue-700"
    }
    return "bg-slate-100 text-slate-600"
  }

  const getSlotDisplay = (order: number) => {
    const slot = lineupSlots.find((s) => s.order === order)
    if (!slot || slot.entries.length === 0) {
      return { name: "", position: "", hasSubstitute: false }
    }
    
    const firstEntry = slot.entries[0]
    const hasSubstitute = slot.entries.length > 1
    
    return {
      name: firstEntry.playerName,
      position: firstEntry.position || "",
      hasSubstitute,
    }
  }

  return (
    <div className="rounded-xl bg-white shadow-sm border border-slate-200 overflow-hidden">
      <h2 className="px-4 py-3 text-sm font-bold text-slate-600 border-b border-slate-200 bg-slate-50">打撃成績</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: `${Math.max(500, 136 + totalInnings * 48)}px` }}>
          <thead>
            <tr className="bg-slate-800 text-white">
              <th className="sticky left-0 z-20 bg-slate-800 w-10 min-w-[40px] px-2 py-3 text-center text-xs font-semibold border-r border-slate-700">
                打順
              </th>
              <th className="sticky left-10 z-20 bg-slate-800 w-10 min-w-[40px] px-2 py-3 text-center text-xs font-semibold border-r border-slate-700">
                守
              </th>
              <th className="sticky left-20 z-20 bg-slate-800 w-24 min-w-[96px] px-2 py-3 text-center text-xs font-semibold border-r border-slate-700">
                選手名
              </th>
              {innings.map((inning) => (
                <th
                  key={inning}
                  className="w-12 min-w-[48px] px-1 py-3 text-center text-xs font-semibold"
                >
                  {inning}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {battingOrders.map((order) => {
              const { name, position, hasSubstitute } = getSlotDisplay(order)
              return (
                <tr key={order} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100">
                  <td className="sticky left-0 z-10 bg-slate-50 w-10 min-w-[40px] px-2 py-2 text-center border-r border-slate-200">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-sm font-bold text-white">
                      {order}
                    </span>
                  </td>
                  <td className="sticky left-10 z-10 bg-slate-50 w-10 min-w-[40px] px-1 py-1 text-center border-r border-slate-200">
                    <span className={cn(
                      "inline-flex h-7 w-7 items-center justify-center rounded text-xs font-bold",
                      position ? "bg-emerald-100 text-emerald-700" : "text-slate-300"
                    )}>
                      {position || "-"}
                    </span>
                  </td>
                  <td className="sticky left-20 z-10 bg-white w-24 min-w-[96px] px-1 py-1 border-r border-slate-200">
                    <button
                      onClick={() => onPlayerClick(order)}
                      className={cn(
                        "w-full h-10 px-2 text-sm rounded-lg text-left transition-all truncate",
                        "hover:bg-blue-50 hover:ring-2 hover:ring-blue-200",
                        "focus:outline-none focus:ring-2 focus:ring-blue-400",
                        hasSubstitute && "border-l-4 border-amber-400"
                      )}
                    >
                      {name || <span className="text-slate-300">タップして入力</span>}
                      {hasSubstitute && (
                        <span className="ml-1 text-xs text-amber-600">+</span>
                      )}
                    </button>
                  </td>
                  {innings.map((inning) => {
                    const result = getResult(order, inning)
                    return (
                      <td key={inning} className="p-1">
                        <button
                          onClick={() => onCellClick({ battingOrder: order, inning })}
                          className={cn(
                            "flex h-10 w-full items-center justify-center text-xs font-bold rounded-lg transition-all",
                            "hover:ring-2 hover:ring-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400",
                            result ? getCellStyle(result) : "text-slate-300 hover:bg-slate-50"
                          )}
                          aria-label={`${order}番打者 ${inning}回の打席`}
                        >
                          {result ? getResultSummary(result) : "-"}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
            {/* 打順追加ボタン */}
            {onAddBattingOrder && (
              <tr className="border-t border-slate-200">
                <td colSpan={3} className="sticky left-0 z-10 bg-white p-2">
                  <button
                    onClick={onAddBattingOrder}
                    className="w-full h-10 flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    打順を追加
                  </button>
                </td>
                <td colSpan={totalInnings}></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 凡例 */}
      <div className="flex flex-wrap gap-6 border-t border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="h-3 w-6 rounded bg-emerald-100" />
          <span className="text-slate-500">ヒット</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="h-3 w-6 rounded bg-blue-100" />
          <span className="text-slate-500">出塁</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="h-3 w-6 rounded bg-slate-100" />
          <span className="text-slate-500">凡退</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="h-3 w-1 rounded bg-amber-400" />
          <span className="text-slate-500">途中交代あり</span>
        </div>
      </div>
    </div>
  )
}
