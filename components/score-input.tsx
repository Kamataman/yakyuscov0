"use client"

import { useRef, useCallback, useState } from "react"
import { cn } from "@/lib/utils"
import { Plus, Minus, ChevronDown } from "lucide-react"
import type { InningScore } from "@/lib/batting-types"

interface ScoreInputProps {
  inningScores: InningScore[]
  onScoresChange: (scores: InningScore[]) => void
  isFirstBatting?: boolean
  onFirstBattingChange?: (isFirst: boolean) => void
  totalInnings?: number
  onTotalInningsChange?: (innings: number) => void
  hasX?: boolean
  xScore?: number | null
  onXChange?: (hasX: boolean, xScore: number | null) => void
  activeInning?: number | null
  onInningFocus?: (inning: number) => void
}

export function ScoreInput({
  inningScores,
  onScoresChange,
  isFirstBatting = true,
  onFirstBattingChange,
  totalInnings = 9,
  onTotalInningsChange,
  hasX = false,
  xScore = null,
  onXChange,
  activeInning,
  onInningFocus,
}: ScoreInputProps) {
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isLongPressRef = useRef(false)
  const [xAccordionOpen, setXAccordionOpen] = useState(false)

  // 後攻チームのキー（✕は常に後攻の最終回に付く）
  const bottomTeam: "our" | "opponent" = isFirstBatting ? "opponent" : "our"

  const getTotalScore = (team: "our" | "opponent") => {
    const base = inningScores.reduce((sum, score, index) => {
      // ✕がある場合、最終回の後攻スコアは x_score で管理するため除外
      if (hasX && index === totalInnings - 1 && team === bottomTeam) return sum
      return sum + (score?.[team] || 0)
    }, 0)
    if (hasX && team === bottomTeam) return base + (xScore ?? 0)
    return base
  }

  const updateScore = useCallback((inning: number, team: "our" | "opponent", value: number) => {
    const newScores = [...inningScores]
    // イニング数が足りない場合は追加
    while (newScores.length < inning) {
      newScores.push({ our: 0, opponent: 0 })
    }
    newScores[inning - 1] = {
      ...newScores[inning - 1],
      [team]: value,
    }
    onScoresChange(newScores)
  }, [inningScores, onScoresChange])

  const handleScoreClick = (inning: number, team: "our" | "opponent") => {
    if (isLongPressRef.current) {
      isLongPressRef.current = false
      return
    }
    onInningFocus?.(inning)
    const currentScore = inningScores[inning - 1]?.[team] || 0
    const newScore = currentScore >= 9 ? 0 : currentScore + 1
    updateScore(inning, team, newScore)
  }

  const handleLongPressStart = useCallback((inning: number, team: "our" | "opponent") => {
    isLongPressRef.current = false
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true
      const currentScore = inningScores[inning - 1]?.[team] || 0
      if (currentScore > 0) {
        updateScore(inning, team, currentScore - 1)
      }
    }, 500)
  }, [inningScores, updateScore])

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
    // 長押し後にiOSが生成する合成 mousedown/click を抑制して二重更新を防ぐ
    if (isLongPressRef.current) {
      e.preventDefault()
    }
  }, [])

  const handleAddInning = () => {
    if (onTotalInningsChange && totalInnings < 15) {
      onTotalInningsChange(totalInnings + 1)
      // 親コンポーネント側でスコア配列も調整する
    }
  }

  const handleRemoveInning = () => {
    if (onTotalInningsChange && totalInnings > 1) {
      onTotalInningsChange(totalInnings - 1)
      // 親コンポーネント側でスコア配列も調整する
    }
  }

  const innings = Array.from({ length: totalInnings }, (_, i) => i + 1)

  return (
    <div className="rounded-xl bg-white shadow-sm border border-slate-200 overflow-hidden">
      {/* 先攻後攻・イニング数設定 */}
      {(onFirstBattingChange || onTotalInningsChange) && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200">
          {onFirstBattingChange && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">打順:</span>
              <div className="flex rounded-lg bg-slate-200 p-1">
                <button
                  onClick={() => onFirstBattingChange(true)}
                  className={cn(
                    "rounded-md px-3 py-1 text-sm font-medium transition-all",
                    isFirstBatting 
                      ? "bg-blue-600 text-white shadow-sm" 
                      : "text-slate-600 hover:text-slate-800"
                  )}
                >
                  先攻
                </button>
                <button
                  onClick={() => onFirstBattingChange(false)}
                  className={cn(
                    "rounded-md px-3 py-1 text-sm font-medium transition-all",
                    !isFirstBatting 
                      ? "bg-red-600 text-white shadow-sm" 
                      : "text-slate-600 hover:text-slate-800"
                  )}
                >
                  後攻
                </button>
              </div>
            </div>
          )}
          {onTotalInningsChange && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">イニング数:</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleRemoveInning}
                  disabled={totalInnings <= 1}
                  className="rounded-lg p-1 text-slate-500 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center font-bold text-slate-800">{totalInnings}</span>
                <button
                  onClick={handleAddInning}
                  disabled={totalInnings >= 15}
                  className="rounded-lg p-1 text-slate-500 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: `${Math.max(400, 80 + totalInnings * 40 + 56)}px` }}>
          <thead>
            <tr className="bg-slate-50 text-slate-600">
              <th className="sticky left-0 z-10 bg-slate-50 w-20 min-w-[80px] px-3 py-2 text-left text-xs font-semibold"></th>
              {innings.map((inning) => (
                <th
                  key={inning}
                  className={cn(
                    "w-10 min-w-[40px] px-1 py-2 text-center text-xs font-semibold transition-colors",
                    inning === activeInning ? "bg-amber-100 text-amber-800" : ""
                  )}
                >
                  {inning}
                </th>
              ))}
              <th className="sticky right-0 z-10 bg-slate-100 w-14 min-w-[56px] px-3 py-2 text-center text-xs font-semibold">
                計
              </th>
            </tr>
          </thead>
          <tbody>
            {/* 先攻チーム */}
            <tr className="border-b border-slate-200">
              <td className={cn(
                "sticky left-0 z-10 w-20 min-w-[80px] px-3 py-2 font-semibold text-sm whitespace-nowrap",
                isFirstBatting ? "bg-blue-50 text-blue-800" : "bg-red-50 text-red-800"
              )}>
                {isFirstBatting ? "自チーム" : "相手"}
              </td>
              {innings.map((inning) => (
                <td key={inning} className={cn("p-1 transition-colors", inning === activeInning && "bg-amber-50")}>
                  <button
                    onClick={() => handleScoreClick(inning, isFirstBatting ? "our" : "opponent")}
                    onMouseDown={() => handleLongPressStart(inning, isFirstBatting ? "our" : "opponent")}
                    onMouseUp={handleLongPressEnd}
                    onMouseLeave={handleLongPressEnd}
                    onTouchStart={() => handleLongPressStart(inning, isFirstBatting ? "our" : "opponent")}
                    onTouchEnd={handleTouchEnd}
                    onTouchCancel={handleTouchEnd}
                    className={cn(
                      "w-full h-10 flex items-center justify-center",
                      "text-lg font-bold rounded-lg transition-all select-none",
                      isFirstBatting ? "hover:bg-blue-100 active:bg-blue-200" : "hover:bg-red-100 active:bg-red-200",
                      (inningScores[inning - 1]?.[isFirstBatting ? "our" : "opponent"] || 0) > 0
                        ? isFirstBatting ? "text-blue-700 bg-blue-50" : "text-red-700 bg-red-50"
                        : "text-slate-300"
                    )}
                  >
                    {inningScores[inning - 1]?.[isFirstBatting ? "our" : "opponent"] ?? 0}
                  </button>
                </td>
              ))}
              <td className={cn(
                "sticky right-0 z-10 w-14 min-w-[56px] px-3 py-2 text-center",
                isFirstBatting ? "bg-blue-100" : "bg-red-100"
              )}>
                <span className={cn(
                  "text-xl font-bold",
                  isFirstBatting ? "text-blue-800" : "text-red-800"
                )}>
                  {getTotalScore(isFirstBatting ? "our" : "opponent")}
                </span>
              </td>
            </tr>
            {/* 後攻チーム */}
            <tr>
              <td className={cn(
                "sticky left-0 z-10 w-20 min-w-[80px] px-3 py-2 font-semibold text-sm whitespace-nowrap",
                !isFirstBatting ? "bg-blue-50 text-blue-800" : "bg-red-50 text-red-800"
              )}>
                {!isFirstBatting ? "自チーム" : "相手"}
              </td>
              {innings.map((inning) => {
                const isLastInningX = hasX && inning === totalInnings
                return (
                  <td key={inning} className={cn("p-1 transition-colors", inning === activeInning && "bg-amber-50")}>
                    {isLastInningX ? (
                      <div className="w-full h-10 flex items-center justify-center text-lg font-bold rounded-lg bg-amber-50 text-amber-700 select-none">
                        {xScore === null ? "✕" : `${xScore}✕`}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleScoreClick(inning, bottomTeam)}
                        onMouseDown={() => handleLongPressStart(inning, bottomTeam)}
                        onMouseUp={handleLongPressEnd}
                        onMouseLeave={handleLongPressEnd}
                        onTouchStart={() => handleLongPressStart(inning, bottomTeam)}
                        onTouchEnd={handleTouchEnd}
                        onTouchCancel={handleTouchEnd}
                        className={cn(
                          "w-full h-10 flex items-center justify-center",
                          "text-lg font-bold rounded-lg transition-all select-none",
                          !isFirstBatting ? "hover:bg-blue-100 active:bg-blue-200" : "hover:bg-red-100 active:bg-red-200",
                          (inningScores[inning - 1]?.[bottomTeam] || 0) > 0
                            ? !isFirstBatting ? "text-blue-700 bg-blue-50" : "text-red-700 bg-red-50"
                            : "text-slate-300"
                        )}
                      >
                        {inningScores[inning - 1]?.[bottomTeam] ?? 0}
                      </button>
                    )}
                  </td>
                )
              })}
              <td className={cn(
                "sticky right-0 z-10 w-14 min-w-[56px] px-3 py-2 text-center",
                !isFirstBatting ? "bg-blue-100" : "bg-red-100"
              )}>
                <span className={cn(
                  "text-xl font-bold",
                  !isFirstBatting ? "text-blue-800" : "text-red-800"
                )}>
                  {getTotalScore(!isFirstBatting ? "our" : "opponent")}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 text-center">
        タップで+1 / 長押しで-1
      </div>

      {/* ✕ゲームコントロール */}
      {onXChange && (
        <div className="border-t border-slate-100">
          <button
            onClick={() => setXAccordionOpen(!xAccordionOpen)}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-500 hover:bg-slate-50"
          >
            <span>最終回</span>
            <span className={cn("font-bold", hasX ? "text-amber-600" : "text-slate-400")}>
              {hasX ? (xScore === null ? "✕" : `${xScore}✕`) : "−"}
            </span>
            <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform", xAccordionOpen && "rotate-180")} />
          </button>

          {xAccordionOpen && (
            <div className="bg-slate-50 px-4 pb-3 space-y-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer py-1">
                <input
                  type="radio"
                  name="x-type"
                  checked={!hasX}
                  onChange={() => onXChange(false, null)}
                  className="accent-slate-600"
                />
                ✕なし
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer py-1">
                <input
                  type="radio"
                  name="x-type"
                  checked={hasX && xScore === null}
                  onChange={() => onXChange(true, null)}
                  className="accent-amber-600"
                />
                裏攻撃なしの✕（後攻が攻撃不要）
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer py-1">
                <input
                  type="radio"
                  name="x-type"
                  checked={hasX && xScore !== null}
                  onChange={() => onXChange(true, xScore !== null ? xScore : 0)}
                  className="accent-amber-600"
                />
                サヨナラ・コールドの✕
              </label>
              {hasX && xScore !== null && (
                <div className="flex items-center gap-2 pl-6">
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={xScore}
                    onChange={(e) => onXChange(true, Math.max(0, Math.min(20, Number(e.target.value))))}
                    className="w-16 rounded border border-slate-300 px-2 py-1 text-sm focus:border-amber-400 focus:outline-none"
                  />
                  <span className="text-sm font-bold text-amber-700">✕</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
