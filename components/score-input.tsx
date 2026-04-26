"use client"

import { useRef, useCallback } from "react"
import { cn } from "@/lib/utils"
import type { InningScore } from "@/lib/batting-types"

interface ScoreInputProps {
  inningScores: InningScore[]
  onScoresChange: (scores: InningScore[]) => void
}

const INNINGS = [1, 2, 3, 4, 5, 6, 7, 8, 9]

export function ScoreInput({ inningScores, onScoresChange }: ScoreInputProps) {
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isLongPressRef = useRef(false)

  const getTotalScore = (team: "our" | "opponent") => {
    return inningScores.reduce((sum, score) => sum + (score?.[team] || 0), 0)
  }

  const updateScore = useCallback((inning: number, team: "our" | "opponent", value: number) => {
    const newScores = [...inningScores]
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

  return (
    <div className="rounded-xl bg-white shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] border-collapse">
          <thead>
            <tr className="bg-slate-800 text-white">
              <th className="w-20 px-3 py-2 text-left text-xs font-semibold"></th>
              {INNINGS.map((inning) => (
                <th
                  key={inning}
                  className="w-10 px-2 py-2 text-center text-xs font-semibold"
                >
                  {inning}
                </th>
              ))}
              <th className="w-14 px-3 py-2 text-center text-xs font-semibold bg-slate-700 sticky right-0">
                計
              </th>
            </tr>
          </thead>
          <tbody>
            {/* 自チーム */}
            <tr className="border-b border-slate-200">
              <td className="px-3 py-2 bg-blue-50 font-semibold text-blue-800 text-sm">
                自チーム
              </td>
              {INNINGS.map((inning) => (
                <td key={inning} className="p-1">
                  <button
                    onClick={() => handleScoreClick(inning, "our")}
                    onMouseDown={() => handleLongPressStart(inning, "our")}
                    onMouseUp={handleLongPressEnd}
                    onMouseLeave={handleLongPressEnd}
                    onTouchStart={() => handleLongPressStart(inning, "our")}
                    onTouchEnd={handleLongPressEnd}
                    className={cn(
                      "w-full h-10 flex items-center justify-center",
                      "text-lg font-bold rounded-lg transition-all select-none",
                      "hover:bg-blue-100 active:bg-blue-200",
                      inningScores[inning - 1]?.our > 0
                        ? "text-blue-700 bg-blue-50"
                        : "text-slate-300"
                    )}
                  >
                    {inningScores[inning - 1]?.our ?? 0}
                  </button>
                </td>
              ))}
              <td className="px-3 py-2 bg-blue-100 text-center sticky right-0">
                <span className="text-xl font-bold text-blue-800">
                  {getTotalScore("our")}
                </span>
              </td>
            </tr>
            {/* 相手チーム */}
            <tr>
              <td className="px-3 py-2 bg-red-50 font-semibold text-red-800 text-sm">
                相手
              </td>
              {INNINGS.map((inning) => (
                <td key={inning} className="p-1">
                  <button
                    onClick={() => handleScoreClick(inning, "opponent")}
                    onMouseDown={() => handleLongPressStart(inning, "opponent")}
                    onMouseUp={handleLongPressEnd}
                    onMouseLeave={handleLongPressEnd}
                    onTouchStart={() => handleLongPressStart(inning, "opponent")}
                    onTouchEnd={handleLongPressEnd}
                    className={cn(
                      "w-full h-10 flex items-center justify-center",
                      "text-lg font-bold rounded-lg transition-all select-none",
                      "hover:bg-red-100 active:bg-red-200",
                      inningScores[inning - 1]?.opponent > 0
                        ? "text-red-700 bg-red-50"
                        : "text-slate-300"
                    )}
                  >
                    {inningScores[inning - 1]?.opponent ?? 0}
                  </button>
                </td>
              ))}
              <td className="px-3 py-2 bg-red-100 text-center sticky right-0">
                <span className="text-xl font-bold text-red-800">
                  {getTotalScore("opponent")}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 text-center">
        タップで+1 / 長押しで-1
      </div>
    </div>
  )
}
