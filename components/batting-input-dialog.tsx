"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { BattingResult, HitResult, HitDirection, CellPosition, RunnerState, StolenBase } from "@/lib/batting-types"

interface BattingInputDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  position: CellPosition | null
  existingResult?: BattingResult
  onSave: (result: BattingResult) => void
  onDelete: () => void
}

const HIT_RESULTS: { label: string; value: HitResult; category: "hit" | "walk" | "out" | "other" }[] = [
  // 安打
  { label: "安打", value: "単打", category: "hit" },
  { label: "二塁打", value: "二塁打", category: "hit" },
  { label: "三塁打", value: "三塁打", category: "hit" },
  { label: "本塁打", value: "本塁打", category: "hit" },
  // 四死球
  { label: "四球", value: "四球", category: "walk" },
  { label: "死球", value: "死球", category: "walk" },
  // 凡退
  { label: "三振", value: "三振", category: "out" },
  { label: "ゴロ", value: "ゴロ", category: "out" },
  { label: "フライ", value: "フライ", category: "out" },
  { label: "ライナー", value: "ライナー", category: "out" },
  // その他
  { label: "併殺", value: "併殺打", category: "other" },
  { label: "犠打", value: "犠打", category: "other" },
  { label: "犠飛", value: "犠飛", category: "other" },
  { label: "エラー", value: "エラー", category: "other" },
  { label: "野選", value: "野選", category: "other" },
]

const CATEGORIES = [
  { key: "hit" as const, label: "安打", color: "bg-emerald-500" },
  { key: "walk" as const, label: "四死球", color: "bg-blue-500" },
  { key: "out" as const, label: "凡退", color: "bg-slate-500" },
  { key: "other" as const, label: "その他", color: "bg-violet-500" },
]

export function BattingInputDialog({
  open,
  onOpenChange,
  position,
  existingResult,
  onSave,
  onDelete,
}: BattingInputDialogProps) {
  const [hitResult, setHitResult] = useState<HitResult | null>(null)
  const [direction, setDirection] = useState<HitDirection | undefined>(undefined)
  const [rbiCount, setRbiCount] = useState<number>(0)
  const [scored, setScored] = useState<boolean>(false)
  const [runners, setRunners] = useState<RunnerState>({ first: false, second: false, third: false })
  const [stolenBases, setStolenBases] = useState<StolenBase>({ second: false, third: false, home: false })

  useEffect(() => {
    if (existingResult) {
      setHitResult(existingResult.hitResult)
      setDirection(existingResult.direction)
      setRbiCount(existingResult.rbiCount)
      setScored(existingResult.scored || false)
      setRunners(existingResult.runners || { first: false, second: false, third: false })
      setStolenBases(existingResult.stolenBases || { second: false, third: false, home: false })
    } else {
      setHitResult(null)
      setDirection(undefined)
      setRbiCount(0)
      setScored(false)
      setRunners({ first: false, second: false, third: false })
      setStolenBases({ second: false, third: false, home: false })
    }
  }, [existingResult, open])

  const handleSave = () => {
    if (!hitResult) return
    onSave({
      hitResult,
      direction,
      rbiCount,
      scored,
      runners,
      stolenBases,
    })
  }

  // 打撃結果が未選択、または四球・死球・三振以外の場合は打球方向を入力可能
  const needsDirection = !hitResult || !["四球", "死球", "三振"].includes(hitResult)

  const handleHitResultClick = (value: HitResult) => {
    setHitResult(value)
    // 四球、死球、三振は打球方向不要なのでクリア
    if (["四球", "死球", "三振"].includes(value)) {
      setDirection(undefined)
    }
  }

  const toggleRunner = (base: keyof RunnerState) => {
    setRunners(prev => ({ ...prev, [base]: !prev[base] }))
  }

  const toggleStolenBase = (base: keyof StolenBase) => {
    setStolenBases(prev => ({ ...prev, [base]: !prev[base] }))
  }

  const handleFieldClick = (pos: HitDirection) => {
    if (needsDirection) {
      setDirection(prev => prev === pos ? undefined : pos)
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "hit": return "bg-emerald-500 hover:bg-emerald-600 text-white"
      case "walk": return "bg-blue-500 hover:bg-blue-600 text-white"
      case "out": return "bg-slate-500 hover:bg-slate-600 text-white"
      case "other": return "bg-violet-500 hover:bg-violet-600 text-white"
      default: return "bg-slate-300"
    }
  }

  const getSelectedStyle = (result: typeof HIT_RESULTS[0]) => {
    if (hitResult !== result.value) return ""
    switch (result.category) {
      case "hit": return "ring-4 ring-emerald-300 scale-105 shadow-lg shadow-emerald-500/30"
      case "walk": return "ring-4 ring-blue-300 scale-105 shadow-lg shadow-blue-500/30"
      case "out": return "ring-4 ring-slate-300 scale-105 shadow-lg shadow-slate-500/30"
      case "other": return "ring-4 ring-violet-300 scale-105 shadow-lg shadow-violet-500/30"
      default: return ""
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden max-h-[95vh] rounded-2xl border-0 shadow-2xl flex flex-col">
        {/* 固定ヘッダー */}
        <DialogHeader className="sticky top-0 z-20 px-6 py-4 bg-gradient-to-r from-slate-800 to-slate-900 text-white flex-shrink-0">
          <DialogTitle className="text-center text-xl font-bold tracking-wide">
            {position ? `${position.battingOrder}番打者 / ${position.inning}回${(position.atBatSequence ?? 1) >= 2 ? ` (${position.atBatSequence}打席目)` : ""}` : "打席入力"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-gradient-to-b from-slate-50 to-white">
          
          {/* フィールド - ランナー状況と打球方向を統合 */}
          <div className="relative mx-auto w-full max-w-[320px] aspect-[4/3.5]">
            <svg viewBox="0 0 400 350" className="w-full h-full drop-shadow-lg">
              <defs>
                <linearGradient id="outfieldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgb(34 197 94)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="rgb(22 163 74)" stopOpacity="0.3" />
                </linearGradient>
                <linearGradient id="infieldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgb(180 83 9)" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="rgb(146 64 14)" stopOpacity="0.35" />
                </linearGradient>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2"/>
                </filter>
              </defs>

              {/* 外野 */}
              <path 
                d="M 200 320 L 20 140 A 250 250 0 0 1 380 140 Z" 
                fill="url(#outfieldGrad)" 
                stroke="rgb(34 197 94)" 
                strokeWidth="2"
              />
              
              {/* 内野ダイヤモンド */}
              <polygon 
                points="200,100 300,200 200,300 100,200" 
                fill="url(#infieldGrad)" 
                stroke="rgb(180 83 9)" 
                strokeWidth="2"
              />

              {/* 打球方向エリア - 左 */}
              <path
                d="M 100 200 L 20 140 A 250 250 0 0 1 100 55 L 140 130 Z"
                fill={direction === "左" ? "rgba(59, 130, 246, 0.5)" : "transparent"}
                stroke={direction === "左" ? "rgb(59 130 246)" : "transparent"}
                strokeWidth="3"
                className={cn(
                  "transition-all duration-200",
                  needsDirection ? "cursor-pointer hover:fill-blue-400/30" : "cursor-not-allowed"
                )}
                onClick={() => handleFieldClick("左")}
              />
              <text x="60" y="110" className="fill-slate-700 text-xl font-bold select-none pointer-events-none" textAnchor="middle">左</text>

              {/* 打球方向エリア - 中 */}
              <path
                d="M 140 130 L 100 55 A 250 250 0 0 1 300 55 L 260 130 Z"
                fill={direction === "中" ? "rgba(59, 130, 246, 0.5)" : "transparent"}
                stroke={direction === "中" ? "rgb(59 130 246)" : "transparent"}
                strokeWidth="3"
                className={cn(
                  "transition-all duration-200",
                  needsDirection ? "cursor-pointer hover:fill-blue-400/30" : "cursor-not-allowed"
                )}
                onClick={() => handleFieldClick("中")}
              />
              <text x="200" y="65" className="fill-slate-700 text-xl font-bold select-none pointer-events-none" textAnchor="middle">中</text>

              {/* 打球方向エリア - 右 */}
              <path
                d="M 260 130 L 300 55 A 250 250 0 0 1 380 140 L 300 200 Z"
                fill={direction === "右" ? "rgba(59, 130, 246, 0.5)" : "transparent"}
                stroke={direction === "右" ? "rgb(59 130 246)" : "transparent"}
                strokeWidth="3"
                className={cn(
                  "transition-all duration-200",
                  needsDirection ? "cursor-pointer hover:fill-blue-400/30" : "cursor-not-allowed"
                )}
                onClick={() => handleFieldClick("右")}
              />
              <text x="340" y="110" className="fill-slate-700 text-xl font-bold select-none pointer-events-none" textAnchor="middle">右</text>

              {/* 内野エリア - 遊 */}
              <circle
                cx="145" cy="155" r="22"
                fill={direction === "遊" ? "rgba(59, 130, 246, 0.6)" : "rgba(255,255,255,0.7)"}
                stroke={direction === "遊" ? "rgb(59 130 246)" : "rgb(148 163 184)"}
                strokeWidth="2"
                filter="url(#shadow)"
                className={cn(
                  "transition-all duration-200",
                  needsDirection ? "cursor-pointer hover:fill-blue-400/40" : "cursor-not-allowed"
                )}
                onClick={() => handleFieldClick("遊")}
              />
              <text x="145" y="160" className="fill-slate-700 text-sm font-bold select-none pointer-events-none" textAnchor="middle">遊</text>

              {/* 内野エリア - 二 */}
              <circle
                cx="255" cy="155" r="22"
                fill={direction === "二" ? "rgba(59, 130, 246, 0.6)" : "rgba(255,255,255,0.7)"}
                stroke={direction === "二" ? "rgb(59 130 246)" : "rgb(148 163 184)"}
                strokeWidth="2"
                filter="url(#shadow)"
                className={cn(
                  "transition-all duration-200",
                  needsDirection ? "cursor-pointer hover:fill-blue-400/40" : "cursor-not-allowed"
                )}
                onClick={() => handleFieldClick("二")}
              />
              <text x="255" y="160" className="fill-slate-700 text-sm font-bold select-none pointer-events-none" textAnchor="middle">二</text>

              {/* 内野エリア - 三 */}
              <circle
                cx="115" cy="210" r="22"
                fill={direction === "三" ? "rgba(59, 130, 246, 0.6)" : "rgba(255,255,255,0.7)"}
                stroke={direction === "三" ? "rgb(59 130 246)" : "rgb(148 163 184)"}
                strokeWidth="2"
                filter="url(#shadow)"
                className={cn(
                  "transition-all duration-200",
                  needsDirection ? "cursor-pointer hover:fill-blue-400/40" : "cursor-not-allowed"
                )}
                onClick={() => handleFieldClick("三")}
              />
              <text x="115" y="215" className="fill-slate-700 text-sm font-bold select-none pointer-events-none" textAnchor="middle">三</text>

              {/* 内野エリア - 一 */}
              <circle
                cx="285" cy="210" r="22"
                fill={direction === "一" ? "rgba(59, 130, 246, 0.6)" : "rgba(255,255,255,0.7)"}
                stroke={direction === "一" ? "rgb(59 130 246)" : "rgb(148 163 184)"}
                strokeWidth="2"
                filter="url(#shadow)"
                className={cn(
                  "transition-all duration-200",
                  needsDirection ? "cursor-pointer hover:fill-blue-400/40" : "cursor-not-allowed"
                )}
                onClick={() => handleFieldClick("一")}
              />
              <text x="285" y="215" className="fill-slate-700 text-sm font-bold select-none pointer-events-none" textAnchor="middle">一</text>

              {/* 投手 */}
              <circle
                cx="200" cy="210" r="18"
                fill={direction === "投" ? "rgba(59, 130, 246, 0.6)" : "rgba(255,255,255,0.8)"}
                stroke={direction === "投" ? "rgb(59 130 246)" : "rgb(148 163 184)"}
                strokeWidth="2"
                filter="url(#shadow)"
                className={cn(
                  "transition-all duration-200",
                  needsDirection ? "cursor-pointer hover:fill-blue-400/40" : "cursor-not-allowed"
                )}
                onClick={() => handleFieldClick("投")}
              />
              <text x="200" y="215" className="fill-slate-600 text-xs font-bold select-none pointer-events-none" textAnchor="middle">投</text>

              {/* 捕手 */}
              <circle
                cx="200" cy="275" r="16"
                fill={direction === "捕" ? "rgba(59, 130, 246, 0.6)" : "rgba(255,255,255,0.8)"}
                stroke={direction === "捕" ? "rgb(59 130 246)" : "rgb(148 163 184)"}
                strokeWidth="2"
                filter="url(#shadow)"
                className={cn(
                  "transition-all duration-200",
                  needsDirection ? "cursor-pointer hover:fill-blue-400/40" : "cursor-not-allowed"
                )}
                onClick={() => handleFieldClick("捕")}
              />
              <text x="200" y="280" className="fill-slate-600 text-xs font-bold select-none pointer-events-none" textAnchor="middle">捕</text>

              {/* ベース - 二塁 */}
              <rect
                x="188" y="88" width="24" height="24"
                transform="rotate(45 200 100)"
                fill={runners.second ? "rgb(251 191 36)" : "white"}
                stroke={runners.second ? "rgb(245 158 11)" : "rgb(148 163 184)"}
                strokeWidth="3"
                filter="url(#shadow)"
                className="cursor-pointer transition-all duration-200 hover:scale-110"
                onClick={() => toggleRunner("second")}
              />

              {/* ベース - 三塁 */}
              <rect
                x="88" y="188" width="24" height="24"
                transform="rotate(45 100 200)"
                fill={runners.third ? "rgb(251 191 36)" : "white"}
                stroke={runners.third ? "rgb(245 158 11)" : "rgb(148 163 184)"}
                strokeWidth="3"
                filter="url(#shadow)"
                className="cursor-pointer transition-all duration-200 hover:scale-110"
                onClick={() => toggleRunner("third")}
              />

              {/* ベース - 一塁 */}
              <rect
                x="288" y="188" width="24" height="24"
                transform="rotate(45 300 200)"
                fill={runners.first ? "rgb(251 191 36)" : "white"}
                stroke={runners.first ? "rgb(245 158 11)" : "rgb(148 163 184)"}
                strokeWidth="3"
                filter="url(#shadow)"
                className="cursor-pointer transition-all duration-200 hover:scale-110"
                onClick={() => toggleRunner("first")}
              />

              {/* ホームベース */}
              <polygon 
                points="200,295 210,305 207,318 193,318 190,305" 
                fill="white" 
                stroke="rgb(100 116 139)" 
                strokeWidth="2" 
                filter="url(#shadow)"
              />
            </svg>

            {/* 凡例 */}
            <div className="absolute -bottom-1 left-0 right-0 flex justify-center gap-6 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-sm bg-amber-400 border border-amber-500" />
                <span>ランナー</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-sm bg-blue-400 border border-blue-500" />
                <span>打球方向</span>
              </div>
            </div>
          </div>

          {/* 打撃結果 */}
          <div className="space-y-3 pt-2">
            <div className="text-sm font-bold text-slate-700">打撃結果</div>
            {CATEGORIES.map((category) => (
              <div key={category.key} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", category.color)} />
                  <span className="text-xs font-medium text-slate-500">{category.label}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {HIT_RESULTS.filter(r => r.category === category.key).map((result) => (
                    <button
                      key={result.value}
                      onClick={() => handleHitResultClick(result.value)}
                      className={cn(
                        "px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-200",
                        getCategoryColor(result.category),
                        getSelectedStyle(result)
                      )}
                    >
                      {result.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 打点 */}
          <div className="space-y-2">
            <div className="text-sm font-bold text-slate-700">打点</div>
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  onClick={() => setRbiCount(n)}
                  className={cn(
                    "flex-1 h-12 rounded-xl font-bold text-lg transition-all duration-200",
                    rbiCount === n
                      ? "bg-slate-800 text-white shadow-lg scale-105"
                      : "bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-400"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* 得点 */}
          <div className="space-y-2">
            <div className="text-sm font-bold text-slate-700">得点</div>
            <button
              onClick={() => setScored(prev => !prev)}
              className={cn(
                "h-12 px-6 rounded-xl font-bold text-sm transition-all duration-200",
                scored
                  ? "bg-rose-500 text-white shadow-lg scale-105"
                  : "bg-white border-2 border-slate-200 text-slate-600 hover:border-rose-400"
              )}
            >
              {scored ? "得点あり" : "得点なし"}
            </button>
          </div>

          {/* 盗塁 */}
          <div className="space-y-2">
            <div className="text-sm font-bold text-slate-700">盗塁</div>
            <div className="flex gap-2">
              {[
                { key: "second" as const, label: "二盗" },
                { key: "third" as const, label: "三盗" },
                { key: "home" as const, label: "本盗" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => toggleStolenBase(key)}
                  className={cn(
                    "flex-1 h-12 rounded-xl font-bold text-sm transition-all duration-200",
                    stolenBases[key]
                      ? "bg-orange-500 text-white shadow-lg scale-105"
                      : "bg-white border-2 border-slate-200 text-slate-600 hover:border-orange-400"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          </div>

        {/* 固定フッター - アクションボタン */}
        <div className="sticky bottom-0 z-20 flex gap-3 p-4 bg-white border-t border-slate-200 flex-shrink-0">
          {existingResult && (
            <Button
              variant="destructive"
              onClick={onDelete}
              className="flex-1 h-12 text-base font-bold rounded-xl"
            >
              削除
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 h-12 text-base rounded-xl border-2"
          >
            キャンセル
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hitResult}
            className="flex-1 h-12 text-base font-bold rounded-xl bg-slate-800 hover:bg-slate-700"
          >
            保存
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
