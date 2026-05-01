"use client"

import { useState, useEffect, useRef } from "react"
import { Copy, Check, Share2 } from "lucide-react"
import { cn } from "@/lib/utils"

type DemoStep = 0 | 1 | 2

interface DemoScore {
  our: number
  opponent: number
}

const DEMO_TARGET: DemoScore[] = [
  { our: 2, opponent: 0 },
  { our: 0, opponent: 1 },
  { our: 1, opponent: 3 },
  { our: 0, opponent: 0 },
  { our: 0, opponent: 0 },
]

const INITIAL_SCORES: DemoScore[] = Array.from({ length: 5 }, () => ({ our: 0, opponent: 0 }))

const SEQUENCE: { team: "our" | "opponent"; inning: number }[] = [
  { team: "our", inning: 0 },
  { team: "opponent", inning: 1 },
  { team: "our", inning: 2 },
  { team: "opponent", inning: 2 },
]

const STEP_CAPTIONS = [
  "① URLをコピーしてLINEで送る",
  "② チームメンバーがリンクを開く",
  "③ アカウント不要でリアルタイム入力",
]

function MiniScoreTable({
  scores,
  animatingCell,
}: {
  scores: DemoScore[]
  animatingCell: { team: "our" | "opponent"; inning: number } | null
}) {
  const innings = [1, 2, 3, 4, 5]
  const ourTotal = scores.reduce((s, r) => s + r.our, 0)
  const oppTotal = scores.reduce((s, r) => s + r.opponent, 0)

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50 text-slate-500">
            <th className="w-14 px-2 py-1.5 text-left text-xs font-semibold"></th>
            {innings.map((n) => (
              <th key={n} className="w-8 px-0.5 py-1.5 text-center text-xs font-semibold">
                {n}
              </th>
            ))}
            <th className="w-10 px-1 py-1.5 text-center text-xs font-semibold bg-slate-100">計</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-slate-200">
            <td className="sticky left-0 bg-blue-50 px-2 py-1.5 text-xs font-semibold text-blue-800 whitespace-nowrap">
              自チーム
            </td>
            {innings.map((_, i) => {
              const val = scores[i]?.our ?? 0
              const isAnimating = animatingCell?.team === "our" && animatingCell?.inning === i
              return (
                <td key={i} className="px-0.5 py-1">
                  <div
                    className={cn(
                      "flex h-8 w-full items-center justify-center rounded-lg text-sm font-bold transition-colors",
                      val > 0 ? "bg-blue-50 text-blue-700" : "text-slate-300",
                      isAnimating && "animate-score-pop",
                    )}
                  >
                    {val}
                  </div>
                </td>
              )
            })}
            <td className="bg-blue-100 px-1 py-1.5 text-center">
              <span className="text-base font-bold text-blue-800">{ourTotal}</span>
            </td>
          </tr>
          <tr>
            <td className="sticky left-0 bg-red-50 px-2 py-1.5 text-xs font-semibold text-red-800 whitespace-nowrap">
              相手
            </td>
            {innings.map((_, i) => {
              const val = scores[i]?.opponent ?? 0
              const isAnimating = animatingCell?.team === "opponent" && animatingCell?.inning === i
              return (
                <td key={i} className="px-0.5 py-1">
                  <div
                    className={cn(
                      "flex h-8 w-full items-center justify-center rounded-lg text-sm font-bold transition-colors",
                      val > 0 ? "bg-red-50 text-red-700" : "text-slate-300",
                      isAnimating && "animate-score-pop",
                    )}
                  >
                    {val}
                  </div>
                </td>
              )
            })}
            <td className="bg-red-100 px-1 py-1.5 text-center">
              <span className="text-base font-bold text-red-800">{oppTotal}</span>
            </td>
          </tr>
        </tbody>
      </table>
      <div className="border-t border-slate-100 bg-slate-50 py-1 text-center text-xs text-slate-400">
        タップで+1 / 長押しで-1
      </div>
    </div>
  )
}

export function ScoreSharingDemo() {
  const [step, setStep] = useState<DemoStep>(0)
  const [scores, setScores] = useState<DemoScore[]>(INITIAL_SCORES)
  const [animatingCell, setAnimatingCell] = useState<{ team: "our" | "opponent"; inning: number } | null>(null)
  const [urlCopied, setUrlCopied] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  const stepTimerRef = useRef<NodeJS.Timeout | null>(null)
  const sequenceTimersRef = useRef<NodeJS.Timeout[]>([])

  const clearAllTimers = () => {
    if (stepTimerRef.current) clearTimeout(stepTimerRef.current)
    sequenceTimersRef.current.forEach(clearTimeout)
    sequenceTimersRef.current = []
  }

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (mq.matches) {
      setReducedMotion(true)
      setStep(2)
      setScores(DEMO_TARGET)
    }
  }, [])

  useEffect(() => {
    if (reducedMotion) return

    clearAllTimers()

    if (step === 0) {
      setUrlCopied(false)
      stepTimerRef.current = setTimeout(() => {
        setStep(1)
        setUrlCopied(true)
      }, 2500)
    } else if (step === 1) {
      stepTimerRef.current = setTimeout(() => {
        setStep(2)
      }, 1400)
    } else if (step === 2) {
      let delay = 300
      SEQUENCE.forEach(({ team, inning }, idx) => {
        const t1 = setTimeout(() => {
          setAnimatingCell({ team, inning })
          setScores((prev) => {
            const next = prev.map((s, i) =>
              i === inning ? { ...s, [team]: DEMO_TARGET[i][team] } : s
            )
            return next
          })
          const t2 = setTimeout(() => setAnimatingCell(null), 320)
          sequenceTimersRef.current.push(t2)
        }, delay)
        sequenceTimersRef.current.push(t1)
        delay += 900
        if (idx === SEQUENCE.length - 1) {
          const reset = setTimeout(() => {
            setStep(0)
            setScores(INITIAL_SCORES)
          }, delay + 1200)
          sequenceTimersRef.current.push(reset)
        }
      })
    }

    return clearAllTimers
  }, [step, reducedMotion])

  return (
    <section
      className="mx-auto max-w-6xl px-4 py-16"
      aria-label="スコア共有機能のデモ"
    >
      <div className="text-center mb-10">
        <div className="mb-3 inline-flex rounded-xl bg-emerald-500/20 p-3">
          <Share2 className="h-8 w-8 text-emerald-400" />
        </div>
        <h3 className="text-2xl font-bold text-white">URLを送るだけ、みんなで入力</h3>
        <p className="mt-3 text-slate-400 max-w-xl mx-auto">
          試合中にURLを共有するだけ。チームメンバーはアカウント登録なしで、
          スコアを一緒にリアルタイム入力できます。
        </p>
      </div>

      <div className="flex flex-col items-center gap-8 md:flex-row md:items-start md:justify-center">
        {/* フォンフレーム */}
        <div
          className="animate-in fade-in slide-in-from-bottom-4 duration-700 mx-auto w-[300px] shrink-0 rounded-[40px] bg-slate-900 p-3 shadow-2xl ring-1 ring-white/10"
          aria-hidden="true"
        >
          {/* ノッチ */}
          <div className="mb-2 flex items-center justify-center">
            <div className="h-1.5 w-16 rounded-full bg-slate-700" />
          </div>

          {/* スクリーン */}
          <div className="rounded-[28px] bg-slate-100 overflow-hidden">
            {/* アプリヘッダー */}
            <div className="bg-white px-4 py-3 border-b border-slate-200 flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-blue-500" />
              <span className="text-sm font-bold text-slate-800">やきゅスコ</span>
              <span className="ml-auto text-xs text-slate-400">
                {step === 0 ? "管理者" : "共有リンクで参加"}
              </span>
            </div>

            <div className="p-3 space-y-3">
              {/* スコアテーブル */}
              <div className="relative">
                <MiniScoreTable scores={scores} animatingCell={animatingCell} />
                {/* アバターバブル */}
                {step === 2 && animatingCell && (
                  <div className="absolute -top-2 -right-2 flex items-center gap-1">
                    <div className="relative flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
                      山
                      <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-50" />
                    </div>
                    <div className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-xs text-white whitespace-nowrap">
                      入力中…
                    </div>
                  </div>
                )}
              </div>

              {/* 共有URLセクション（Step 0, 1） */}
              <div
                className={cn(
                  "space-y-2 transition-opacity duration-500",
                  step === 2 ? "opacity-0 pointer-events-none h-0 overflow-hidden" : "opacity-100",
                )}
              >
                <div className="text-xs text-slate-500 font-medium">共有URL</div>
                <div className="flex gap-1.5">
                  <div
                    className={cn(
                      "flex-1 rounded-lg border px-2 py-1.5 font-mono text-xs text-slate-600 bg-white truncate transition-all duration-300",
                      urlCopied ? "border-emerald-300 ring-1 ring-emerald-200" : "border-slate-300",
                    )}
                  >
                    yakyu-sco.app/share/a8f2…
                  </div>
                  <button
                    className={cn(
                      "shrink-0 flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-300",
                      urlCopied
                        ? "border-emerald-300 bg-emerald-50 text-emerald-600"
                        : "border-slate-300 bg-white text-slate-500",
                    )}
                    aria-label="URLをコピー"
                    tabIndex={-1}
                  >
                    {urlCopied ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>

                {/* LINEボタン */}
                <div
                  className={cn(
                    "transition-all duration-500",
                    step === 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 pointer-events-none",
                  )}
                >
                  <div className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#06C755] py-2 text-xs font-bold text-[#06C755] bg-[#06C755]/5">
                    <span className="text-base leading-none">⬤</span>
                    LINEで共有
                  </div>
                </div>
              </div>

              {/* Step 2: 参加者バッジ */}
              <div
                className={cn(
                  "transition-opacity duration-500",
                  step === 2 ? "opacity-100" : "opacity-0 h-0 overflow-hidden",
                )}
              >
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
                    山
                  </div>
                  <span className="text-xs text-emerald-700">山田さんが参加中</span>
                  <div className="ml-auto flex gap-1">
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-400" style={{ animationDelay: "0ms" }} />
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-400" style={{ animationDelay: "150ms" }} />
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-400" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ホームインジケーター */}
          <div className="mt-2 flex justify-center">
            <div className="h-1 w-20 rounded-full bg-slate-700" />
          </div>
        </div>

        {/* ステップ説明（デスクトップ横並び） */}
        <div className="hidden md:flex flex-col gap-4 justify-center pt-16 max-w-xs">
          {STEP_CAPTIONS.map((caption, i) => (
            <div
              key={i}
              className={cn(
                "flex items-start gap-3 rounded-xl p-3 transition-all duration-500",
                step === i
                  ? "bg-slate-700/60 text-white"
                  : "text-slate-500",
              )}
            >
              <div
                className={cn(
                  "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors",
                  step === i ? "bg-blue-500 text-white" : "bg-slate-700 text-slate-400",
                )}
              >
                {i + 1}
              </div>
              <span className="text-sm leading-snug">{caption.slice(2)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ステップキャプション（モバイル） */}
      <div className="mt-6 text-center md:hidden">
        <p className="text-sm text-slate-300 font-medium">{STEP_CAPTIONS[step]}</p>
      </div>

      {/* プログレスドット */}
      <div className="mt-5 flex items-center justify-center gap-2" aria-hidden="true">
        {([0, 1, 2] as DemoStep[]).map((i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              step === i ? "w-5 bg-blue-400" : "w-2 bg-slate-600",
            )}
          />
        ))}
      </div>
    </section>
  )
}
