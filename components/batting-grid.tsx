"use client"

import { cn } from "@/lib/utils"
import { Minus, Plus } from "lucide-react"
import type { BattingResult, CellPosition, LineupSlot } from "@/lib/batting-types"
import { getResultSummary, isHit, isOnBase } from "@/lib/batting-types"

type AtBatColumn = { inning: number; sequence: number }

interface BattingGridProps {
  results: Record<string, BattingResult>
  onCellClick: (position: CellPosition) => void
  lineupSlots: LineupSlot[]
  onPlayerClick: (order: number) => void
  onAddBattingOrder?: () => void
  totalInnings?: number
  atBatSequences: Record<number, number>
  onAddAtBat: (inning: number) => void
  onRemoveAtBat: (inning: number) => void
  activeInning?: number | null
}

export function BattingGrid({
  results,
  onCellClick,
  lineupSlots,
  onPlayerClick,
  onAddBattingOrder,
  totalInnings = 9,
  atBatSequences,
  onAddAtBat,
  onRemoveAtBat,
  activeInning,
}: BattingGridProps) {
  const maxBattingOrder = Math.max(lineupSlots.length, 9)
  const battingOrders = Array.from({ length: maxBattingOrder }, (_, i) => i + 1)

  const columns: AtBatColumn[] = []
  for (let inning = 1; inning <= totalInnings; inning++) {
    const maxSeq = atBatSequences[inning] ?? 1
    for (let seq = 1; seq <= maxSeq; seq++) {
      columns.push({ inning, sequence: seq })
    }
  }

  const getResult = (battingOrder: number, col: AtBatColumn): BattingResult | undefined => {
    return results[`${battingOrder}-${col.inning}-${col.sequence}`]
  }

  const getCellStyle = (result: BattingResult | undefined) => {
    if (!result) return ""

    if (isHit(result.hitResult)) {
      return "bg-turf/15 text-turf font-bold"
    }
    if (isOnBase(result.hitResult)) {
      return "bg-muted text-foreground"
    }
    return "text-muted-foreground"
  }

  const getSlotDisplay = (order: number) => {
    const slot = lineupSlots.find((s) => s.order === order)
    if (!slot || slot.entries.length === 0) {
      return { name: "", positions: [] as string[], hasSubstitute: false }
    }

    const firstEntry = slot.entries[0]
    const hasSubstitute = slot.entries.length > 1

    return {
      name: firstEntry.playerName,
      positions: firstEntry.positions ?? [],
      hasSubstitute,
    }
  }

  // イニングごとの列インデックスを計算（ヘッダーのボーダー描画用）
  const lastColIndexByInning = new Map<number, number>()
  columns.forEach((col, idx) => {
    lastColIndexByInning.set(col.inning, idx)
  })

  return (
    <div className="border border-border overflow-hidden">
      <h2 className="px-4 py-3 text-sm font-bold text-foreground border-b border-border bg-muted">打撃成績</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: `${Math.max(500, 136 + columns.length * 48 + totalInnings * 28)}px` }}>
          <thead>
            <tr className="bg-muted text-muted-foreground">
              <th className="sticky left-0 z-20 bg-muted w-10 min-w-[40px] px-2 py-3 text-center text-xs font-semibold border-r border-border">
                打順
              </th>
              <th className="sticky left-10 z-20 bg-muted w-10 min-w-[40px] px-2 py-3 text-center text-xs font-semibold border-r border-border">
                守
              </th>
              <th className="sticky left-20 z-20 bg-muted w-24 min-w-[96px] px-2 py-3 text-center text-xs font-semibold border-r border-border">
                選手名
              </th>
              {columns.map((col, idx) => {
                const isLastOfInning = lastColIndexByInning.get(col.inning) === idx
                return (
                  <th
                    key={`${col.inning}-${col.sequence}`}
                    className={cn(
                      "px-1 py-1 text-center text-xs font-semibold transition-colors",
                      col.sequence === 1 ? "w-12 min-w-[48px]" : "w-10 min-w-[40px]",
                      isLastOfInning && "border-r border-border",
                      col.inning === activeInning && "bg-amber-100 text-amber-800"
                    )}
                  >
                    {col.sequence === 1 ? (
                      <div className="flex flex-col items-center gap-0.5">
                        <span>{col.inning}</span>
                        <button
                          onClick={() => onAddAtBat(col.inning)}
                          className="flex h-4 w-4 items-center justify-center text-muted-foreground hover:text-turf hover:bg-turf/10 transition-colors"
                          title={`${col.inning}回に打席を追加`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-muted-foreground text-[10px]">{["②", "③", "④", "⑤"][col.sequence - 2] ?? col.sequence}</span>
                        {isLastOfInning && (
                          <button
                            onClick={() => onRemoveAtBat(col.inning)}
                            className="flex h-4 w-4 items-center justify-center text-muted-foreground hover:text-stitch hover:bg-stitch/10 transition-colors"
                            title={`${col.inning}回の${col.sequence}打席目を削除`}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {battingOrders.map((order) => {
              const { name, positions, hasSubstitute } = getSlotDisplay(order)
              return (
                <tr key={order} className="hover:bg-muted/50 transition-colors border-b border-border">
                  <td className="sticky left-0 z-10 bg-muted w-10 min-w-[40px] px-2 py-2 text-center border-r border-border">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background">
                      {order}
                    </span>
                  </td>
                  <td className="sticky left-10 z-10 bg-muted w-10 min-w-[40px] px-1 py-1 text-center border-r border-border">
                    {positions.length > 0 ? (
                      <span className="inline-flex h-7 items-center gap-0.5 px-1 text-xs font-bold bg-turf/15 text-turf">
                        {positions[0]}
                        {positions.length > 1 && (
                          <span className="text-[10px] text-turf/70">+</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/40 text-xs">-</span>
                    )}
                  </td>
                  <td className="sticky left-20 z-10 bg-background w-24 min-w-[96px] px-1 py-1 border-r border-border">
                    <button
                      onClick={() => onPlayerClick(order)}
                      className={cn(
                        "w-full h-10 px-2 text-sm text-left transition-all truncate",
                        "hover:bg-turf/10 hover:ring-2 hover:ring-turf/30",
                        "focus:outline-none focus:ring-2 focus:ring-turf",
                        hasSubstitute && "border-l-4 border-amber-400"
                      )}
                    >
                      {name || <span className="text-muted-foreground/40">タップして入力</span>}
                      {hasSubstitute && (
                        <span className="ml-1 text-xs text-amber-600">+</span>
                      )}
                    </button>
                  </td>
                  {columns.map((col, idx) => {
                    const result = getResult(order, col)
                    const isLastOfInning = lastColIndexByInning.get(col.inning) === idx
                    return (
                      <td
                        key={`${col.inning}-${col.sequence}`}
                        className={cn(
                          "p-1 transition-colors",
                          isLastOfInning && "border-r border-border",
                          col.inning === activeInning && "bg-amber-50"
                        )}
                      >
                        <button
                          onClick={() => onCellClick({ battingOrder: order, inning: col.inning, atBatSequence: col.sequence })}
                          className={cn(
                            "flex h-10 w-full items-center justify-center text-xs font-bold transition-all",
                            "hover:ring-2 hover:ring-turf/40 focus:outline-none focus:ring-2 focus:ring-turf",
                            result ? getCellStyle(result) : "text-muted-foreground/40 hover:bg-muted"
                          )}
                          aria-label={`${order}番打者 ${col.inning}回${col.sequence > 1 ? ` (${col.sequence}打席目)` : ""}の打席`}
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
              <tr className="border-t border-border">
                <td colSpan={3} className="sticky left-0 z-10 bg-background p-2">
                  <button
                    onClick={onAddBattingOrder}
                    className="w-full h-10 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-turf hover:bg-turf/10 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    打順を追加
                  </button>
                </td>
                <td colSpan={columns.length}></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 凡例 */}
      <div className="flex flex-wrap gap-6 border-t border-border bg-muted px-4 py-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="h-3 w-6 bg-turf/15" />
          <span className="text-muted-foreground">ヒット</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="h-3 w-6 bg-muted-foreground/20" />
          <span className="text-muted-foreground">出塁</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="h-3 w-6 border border-border" />
          <span className="text-muted-foreground">凡退</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="h-3 w-1 bg-amber-400" />
          <span className="text-muted-foreground">途中交代あり</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Plus className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">打席を追加</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Minus className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">打席を削除</span>
        </div>
      </div>
    </div>
  )
}
