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
}

const INNINGS = [1, 2, 3, 4, 5, 6, 7, 8, 9]

export function BattingGrid({ 
  results, 
  onCellClick, 
  lineupSlots, 
  onPlayerClick,
  onAddBattingOrder
}: BattingGridProps) {
  const maxBattingOrder = Math.max(lineupSlots.length, 9)
  const battingOrders = Array.from({ length: maxBattingOrder }, (_, i) => i + 1)

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
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse">
          <thead>
            <tr className="bg-slate-800 text-white">
              <th className="w-10 px-2 py-3 text-center text-xs font-semibold">
                打順
              </th>
              <th className="w-10 px-2 py-3 text-center text-xs font-semibold">
                守
              </th>
              <th className="w-24 px-2 py-3 text-center text-xs font-semibold">
                選手名
              </th>
              {INNINGS.map((inning) => (
                <th
                  key={inning}
                  className="w-12 px-1 py-3 text-center text-xs font-semibold"
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
                  <td className="bg-slate-50 px-2 py-2 text-center">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-sm font-bold text-white">
                      {order}
                    </span>
                  </td>
                  <td className="bg-slate-50 px-1 py-1 text-center">
                    <span className={cn(
                      "inline-flex h-7 w-7 items-center justify-center rounded text-xs font-bold",
                      position ? "bg-emerald-100 text-emerald-700" : "text-slate-300"
                    )}>
                      {position || "-"}
                    </span>
                  </td>
                  <td className="px-1 py-1">
                    <button
                      onClick={() => onPlayerClick(order)}
                      className={cn(
                        "w-full h-10 px-2 text-sm rounded-lg text-left transition-all",
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
                  {INNINGS.map((inning) => {
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
                <td colSpan={3} className="p-2">
                  <button
                    onClick={onAddBattingOrder}
                    className="w-full h-10 flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    打順を追加
                  </button>
                </td>
                <td colSpan={9}></td>
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
