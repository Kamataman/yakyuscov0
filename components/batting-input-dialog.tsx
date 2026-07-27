"use client"

import { useState, useEffect } from "react"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog"
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
  { label: "振逃", value: "振り逃げ", category: "other" },
  { label: "野選", value: "野選", category: "other" },
]

const CATEGORIES = [
  { key: "hit" as const, label: "安打", color: "bg-turf" },
  { key: "walk" as const, label: "四死球", color: "bg-foreground" },
  { key: "out" as const, label: "凡退", color: "bg-muted-foreground/40" },
  { key: "other" as const, label: "その他", color: "bg-stitch" },
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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

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
  const needsDirection = !hitResult || !["四球", "死球", "三振", "振り逃げ"].includes(hitResult)

  const handleHitResultClick = (value: HitResult) => {
    setHitResult(value)
    // 四球、死球、三振は打球方向不要なのでクリア
    if (["四球", "死球", "三振", "振り逃げ"].includes(value)) {
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
      case "hit": return "bg-turf hover:bg-turf/90 text-turf-foreground"
      case "walk": return "bg-foreground hover:bg-foreground/90 text-background"
      case "out": return "bg-muted hover:bg-muted/80 text-foreground font-bold"
      case "other": return "bg-stitch hover:bg-stitch/90 text-stitch-foreground"
      default: return "bg-muted"
    }
  }

  const getSelectedStyle = (result: typeof HIT_RESULTS[0]) => {
    if (hitResult !== result.value) return ""
    return "ring-2 ring-offset-2 ring-foreground"
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="gap-0 p-0 max-h-[92vh]">
        {/* 固定ヘッダー */}
        <DrawerHeader className="px-6 py-4 bg-foreground text-background flex-shrink-0">
          <DrawerTitle className="text-center text-xl font-bold tracking-wide text-background">
            {position ? `${position.battingOrder}番打者 / ${position.inning}回${(position.atBatSequence ?? 1) >= 2 ? ` (${position.atBatSequence}打席目)` : ""}` : "打席入力"}
          </DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-background">

          {/* フィールド - ランナー状況と打球方向を統合 */}
          <div className="relative mx-auto w-full max-w-[320px] aspect-[4/3.5]">
            <svg viewBox="0 0 400 350" className="w-full h-full drop-shadow-lg">
              <defs>
                <linearGradient id="outfieldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="oklch(0.48 0.1 148)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="oklch(0.48 0.1 148)" stopOpacity="0.2" />
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
                stroke="oklch(0.48 0.1 148)"
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
                fill={direction === "左" ? "oklch(0.48 0.1 148 / 0.5)" : "transparent"}
                stroke={direction === "左" ? "oklch(0.48 0.1 148)" : "transparent"}
                strokeWidth="3"
                className={cn(
                  "transition-all duration-200",
                  needsDirection ? "cursor-pointer hover:fill-turf/30" : "cursor-not-allowed"
                )}
                onClick={() => handleFieldClick("左")}
              />
              <text x="60" y="110" className="fill-foreground text-xl font-bold select-none pointer-events-none" textAnchor="middle">左</text>

              {/* 打球方向エリア - 中 */}
              <path
                d="M 140 130 L 100 55 A 250 250 0 0 1 300 55 L 260 130 Z"
                fill={direction === "中" ? "oklch(0.48 0.1 148 / 0.5)" : "transparent"}
                stroke={direction === "中" ? "oklch(0.48 0.1 148)" : "transparent"}
                strokeWidth="3"
                className={cn(
                  "transition-all duration-200",
                  needsDirection ? "cursor-pointer hover:fill-turf/30" : "cursor-not-allowed"
                )}
                onClick={() => handleFieldClick("中")}
              />
              <text x="200" y="65" className="fill-foreground text-xl font-bold select-none pointer-events-none" textAnchor="middle">中</text>

              {/* 打球方向エリア - 右 */}
              <path
                d="M 260 130 L 300 55 A 250 250 0 0 1 380 140 L 300 200 Z"
                fill={direction === "右" ? "oklch(0.48 0.1 148 / 0.5)" : "transparent"}
                stroke={direction === "右" ? "oklch(0.48 0.1 148)" : "transparent"}
                strokeWidth="3"
                className={cn(
                  "transition-all duration-200",
                  needsDirection ? "cursor-pointer hover:fill-turf/30" : "cursor-not-allowed"
                )}
                onClick={() => handleFieldClick("右")}
              />
              <text x="340" y="110" className="fill-foreground text-xl font-bold select-none pointer-events-none" textAnchor="middle">右</text>

              {/* 内野エリア - 遊 */}
              <circle
                cx="145" cy="155" r="22"
                fill={direction === "遊" ? "oklch(0.48 0.1 148 / 0.6)" : "rgba(255,255,255,0.7)"}
                stroke={direction === "遊" ? "oklch(0.48 0.1 148)" : "rgb(148 163 184)"}
                strokeWidth="2"
                filter="url(#shadow)"
                className={cn(
                  "transition-all duration-200",
                  needsDirection ? "cursor-pointer hover:fill-turf/40" : "cursor-not-allowed"
                )}
                onClick={() => handleFieldClick("遊")}
              />
              <text x="145" y="160" className="fill-foreground text-sm font-bold select-none pointer-events-none" textAnchor="middle">遊</text>

              {/* 内野エリア - 二 */}
              <circle
                cx="255" cy="155" r="22"
                fill={direction === "二" ? "oklch(0.48 0.1 148 / 0.6)" : "rgba(255,255,255,0.7)"}
                stroke={direction === "二" ? "oklch(0.48 0.1 148)" : "rgb(148 163 184)"}
                strokeWidth="2"
                filter="url(#shadow)"
                className={cn(
                  "transition-all duration-200",
                  needsDirection ? "cursor-pointer hover:fill-turf/40" : "cursor-not-allowed"
                )}
                onClick={() => handleFieldClick("二")}
              />
              <text x="255" y="160" className="fill-foreground text-sm font-bold select-none pointer-events-none" textAnchor="middle">二</text>

              {/* 内野エリア - 三 */}
              <circle
                cx="115" cy="210" r="22"
                fill={direction === "三" ? "oklch(0.48 0.1 148 / 0.6)" : "rgba(255,255,255,0.7)"}
                stroke={direction === "三" ? "oklch(0.48 0.1 148)" : "rgb(148 163 184)"}
                strokeWidth="2"
                filter="url(#shadow)"
                className={cn(
                  "transition-all duration-200",
                  needsDirection ? "cursor-pointer hover:fill-turf/40" : "cursor-not-allowed"
                )}
                onClick={() => handleFieldClick("三")}
              />
              <text x="115" y="215" className="fill-foreground text-sm font-bold select-none pointer-events-none" textAnchor="middle">三</text>

              {/* 内野エリア - 一 */}
              <circle
                cx="285" cy="210" r="22"
                fill={direction === "一" ? "oklch(0.48 0.1 148 / 0.6)" : "rgba(255,255,255,0.7)"}
                stroke={direction === "一" ? "oklch(0.48 0.1 148)" : "rgb(148 163 184)"}
                strokeWidth="2"
                filter="url(#shadow)"
                className={cn(
                  "transition-all duration-200",
                  needsDirection ? "cursor-pointer hover:fill-turf/40" : "cursor-not-allowed"
                )}
                onClick={() => handleFieldClick("一")}
              />
              <text x="285" y="215" className="fill-foreground text-sm font-bold select-none pointer-events-none" textAnchor="middle">一</text>

              {/* 投手 */}
              <circle
                cx="200" cy="210" r="18"
                fill={direction === "投" ? "oklch(0.48 0.1 148 / 0.6)" : "rgba(255,255,255,0.8)"}
                stroke={direction === "投" ? "oklch(0.48 0.1 148)" : "rgb(148 163 184)"}
                strokeWidth="2"
                filter="url(#shadow)"
                className={cn(
                  "transition-all duration-200",
                  needsDirection ? "cursor-pointer hover:fill-turf/40" : "cursor-not-allowed"
                )}
                onClick={() => handleFieldClick("投")}
              />
              <text x="200" y="215" className="fill-muted-foreground text-xs font-bold select-none pointer-events-none" textAnchor="middle">投</text>

              {/* 捕手 */}
              <circle
                cx="200" cy="275" r="16"
                fill={direction === "捕" ? "oklch(0.48 0.1 148 / 0.6)" : "rgba(255,255,255,0.8)"}
                stroke={direction === "捕" ? "oklch(0.48 0.1 148)" : "rgb(148 163 184)"}
                strokeWidth="2"
                filter="url(#shadow)"
                className={cn(
                  "transition-all duration-200",
                  needsDirection ? "cursor-pointer hover:fill-turf/40" : "cursor-not-allowed"
                )}
                onClick={() => handleFieldClick("捕")}
              />
              <text x="200" y="280" className="fill-muted-foreground text-xs font-bold select-none pointer-events-none" textAnchor="middle">捕</text>

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
            <div className="absolute -bottom-1 left-0 right-0 flex justify-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 bg-amber-400 border border-amber-500" />
                <span>ランナー</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 bg-turf border border-turf" />
                <span>打球方向</span>
              </div>
            </div>
          </div>

          {/* 打撃結果 */}
          <div className="space-y-3 pt-2">
            <div className="text-sm font-bold text-foreground">打撃結果</div>
            {CATEGORIES.map((category) => (
              <div key={category.key} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2", category.color)} />
                  <span className="text-xs font-medium text-muted-foreground">{category.label}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {HIT_RESULTS.filter(r => r.category === category.key).map((result) => (
                    <button
                      key={result.value}
                      onClick={() => handleHitResultClick(result.value)}
                      className={cn(
                        "px-4 py-2.5 font-bold text-sm transition-all duration-200 active:opacity-75",
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
            <div className="text-sm font-bold text-foreground">打点</div>
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  onClick={() => setRbiCount(n)}
                  className={cn(
                    "flex-1 h-12 font-bold text-lg transition-all duration-200 active:opacity-75",
                    rbiCount === n
                      ? "bg-foreground text-background"
                      : "bg-background border border-border text-foreground/70 hover:border-foreground/40"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* 得点 */}
          <div className="space-y-2">
            <div className="text-sm font-bold text-foreground">得点</div>
            <button
              onClick={() => setScored(prev => !prev)}
              className={cn(
                "h-12 px-6 font-bold text-sm transition-all duration-200 active:opacity-75",
                scored
                  ? "bg-stitch text-stitch-foreground"
                  : "bg-background border border-border text-foreground/70 hover:border-stitch/50"
              )}
            >
              {scored ? "得点あり" : "得点なし"}
            </button>
          </div>

          {/* 盗塁 */}
          <div className="space-y-2">
            <div className="text-sm font-bold text-foreground">盗塁</div>
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
                    "flex-1 h-12 font-bold text-sm transition-all duration-200 active:opacity-75",
                    stolenBases[key]
                      ? "bg-turf text-turf-foreground"
                      : "bg-background border border-border text-foreground/70 hover:border-turf/50"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          </div>

        {/* 固定フッター - アクションボタン */}
        <div className="sticky bottom-0 z-20 flex gap-3 p-4 bg-background border-t border-border flex-shrink-0">
          {existingResult && (
            <>
              <Button
                variant="destructive"
                onClick={() => setDeleteConfirmOpen(true)}
                className="flex-1 h-12 text-base font-bold"
              >
                削除
              </Button>
              <ConfirmDeleteDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                title="打席結果を削除しますか？"
                description="この打席の記録が削除されます。"
                onConfirm={() => { setDeleteConfirmOpen(false); onDelete() }}
              />
            </>
          )}
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 h-12 text-base border-2"
          >
            キャンセル
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hitResult}
            className="flex-1 h-12 text-base font-bold bg-turf hover:bg-turf/90 text-turf-foreground"
          >
            保存
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
