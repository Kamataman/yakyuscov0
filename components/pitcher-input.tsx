"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { PitcherResult, PitcherInningStats, Player } from "@/lib/batting-types"
import { Plus, Trash2, Trophy, ThumbsDown, Shield, Star, Minus } from "lucide-react"
import { sortPlayersByNumber } from "@/lib/sort-utils"

interface PitcherInputProps {
  pitchers: PitcherResult[]
  onPitchersChange: (pitchers: PitcherResult[]) => void
  registeredPlayers?: Player[]
  totalInnings?: number
  activeInning?: number | null
  onInningFocus?: (inning: number) => void
}

export function formatInnings(outs: number, isMidInningExit: boolean): string {
  const whole = Math.floor(outs / 3)
  const rem = outs % 3
  if (rem === 0 && isMidInningExit) return `${whole} 0/3`
  if (rem === 0) return `${whole}`
  return `${whole} ${rem}/3`
}

function nextInnings(outs: number, isMidInningExit: boolean): [number, boolean] {
  if (!isMidInningExit && outs % 3 === 0 && outs < 27) return [outs, true]
  if (isMidInningExit) return [outs + 1, false]
  return [outs + 1, false]
}

function prevInnings(outs: number, isMidInningExit: boolean): [number, boolean] {
  if (isMidInningExit) return [outs, false]
  if (outs === 0) return [0, false]
  const newOuts = outs - 1
  if (newOuts % 3 === 0) return [newOuts, true]
  return [newOuts, false]
}

type InputMode = "inning" | "aggregate"

const EMPTY_PITCHER: PitcherResult = {
  playerId: "",
  playerName: "",
  outsPitched: 0,
  isMidInningExit: false,
  hits: 0,
  runs: 0,
  earnedRuns: 0,
  strikeouts: 0,
  walks: 0,
  hitByPitch: 0,
  homeRuns: 0,
  battersFaced: 0,
  isHelper: false,
  inningStats: [],
}

const EMPTY_INNING_STATS: PitcherInningStats = {
  inning: 0,
  outs: 3,
  runs: 0,
  hits: 0,
  strikeouts: 0,
  earnedRuns: 0,
  walks: 0,
  hitByPitch: 0,
  homeRuns: 0,
  battersFaced: 0,
}

const OUTS_OPTIONS = [
  { outs: 0, label: "0/3" },
  { outs: 1, label: "1/3" },
  { outs: 2, label: "2/3" },
  { outs: 3, label: "1回" },
] as const

function sumInningStats(inningStats: PitcherInningStats[]): Pick<PitcherResult, "hits" | "runs" | "earnedRuns" | "strikeouts" | "walks" | "hitByPitch" | "homeRuns" | "battersFaced" | "outsPitched" | "isMidInningExit"> {
  const totals = inningStats.reduce(
    (acc, s) => ({
      hits: acc.hits + s.hits,
      runs: acc.runs + s.runs,
      earnedRuns: acc.earnedRuns + s.earnedRuns,
      strikeouts: acc.strikeouts + s.strikeouts,
      walks: acc.walks + s.walks,
      hitByPitch: acc.hitByPitch + s.hitByPitch,
      homeRuns: acc.homeRuns + s.homeRuns,
      battersFaced: acc.battersFaced + s.battersFaced,
      outsPitched: acc.outsPitched + (s.outs ?? 3),
    }),
    { hits: 0, runs: 0, earnedRuns: 0, strikeouts: 0, walks: 0, hitByPitch: 0, homeRuns: 0, battersFaced: 0, outsPitched: 0 }
  )
  const lastInning = inningStats[inningStats.length - 1]
  return { ...totals, isMidInningExit: lastInning ? (lastInning.outs ?? 3) < 3 : false }
}

export function PitcherInput({
  pitchers,
  onPitchersChange,
  registeredPlayers = [],
  totalInnings = 9,
  activeInning,
  onInningFocus,
}: PitcherInputProps) {
  const [inputMode, setInputMode] = useState<InputMode>("inning")
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; targetMode: InputMode }>({ open: false, targetMode: "aggregate" })

  // プレーヤーデータに基づいてモードを初期化
  useEffect(() => {
    const hasInningData = pitchers.some(p => (p.inningStats?.length ?? 0) > 0)
    const hasAggregateData = pitchers.some(p => p.hits > 0 || p.runs > 0 || p.strikeouts > 0)
    if (!hasInningData && hasAggregateData) {
      setInputMode("aggregate")
    } else {
      setInputMode("inning")
    }
  }, []) // 初回のみ

  // 集約モード用の編集ダイアログ
  const [isAggDialogOpen, setIsAggDialogOpen] = useState(false)
  const [aggEditingIndex, setAggEditingIndex] = useState<number | null>(null)
  const [aggForm, setAggForm] = useState<PitcherResult>(EMPTY_PITCHER)

  // イニングモード用のプレーヤー編集ダイアログ
  const [isPlayerDialogOpen, setIsPlayerDialogOpen] = useState(false)
  const [playerEditingIndex, setPlayerEditingIndex] = useState<number | null>(null)
  const [playerForm, setPlayerForm] = useState<PitcherResult>(EMPTY_PITCHER)

  // イニングモード用のイニング統計ダイアログ
  const [isInningDialogOpen, setIsInningDialogOpen] = useState(false)
  const [inningDialogPitcherIndex, setInningDialogPitcherIndex] = useState<number>(0)
  const [inningDialogInning, setInningDialogInning] = useState<number>(1)
  const [inningForm, setInningForm] = useState<PitcherInningStats>(EMPTY_INNING_STATS)

  const handleModeToggle = (newMode: InputMode) => {
    if (newMode === inputMode) return

    if (newMode === "aggregate") {
      const hasInningData = pitchers.some(p => (p.inningStats?.length ?? 0) > 0)
      if (hasInningData) {
        setConfirmDialog({ open: true, targetMode: "aggregate" })
        return
      }
    } else {
      const hasAggregateData = pitchers.some(p => p.hits > 0 || p.runs > 0 || p.strikeouts > 0 || p.earnedRuns > 0 || p.walks > 0 || p.hitByPitch > 0 || p.homeRuns > 0 || (p.battersFaced ?? 0) > 0)
      if (hasAggregateData) {
        setConfirmDialog({ open: true, targetMode: "inning" })
        return
      }
    }
    setInputMode(newMode)
  }

  const handleConfirmModeSwitch = () => {
    const targetMode = confirmDialog.targetMode
    setConfirmDialog({ open: false, targetMode: "aggregate" })

    if (targetMode === "aggregate") {
      // イニング → 集約: inningStats の合計 → aggregate フィールドに、inningStats をクリア
      const updated = pitchers.map(p => {
        const stats = sumInningStats(p.inningStats ?? [])
        return { ...p, ...stats, inningStats: [] }
      })
      onPitchersChange(updated)
    } else {
      // 集約 → イニング: aggregate フィールド → inning=1 のデータに変換、aggregate フィールドをリセット
      const updated = pitchers.map(p => ({
        ...p,
        outsPitched: 0,
        isMidInningExit: false,
        hits: 0,
        runs: 0,
        earnedRuns: 0,
        strikeouts: 0,
        walks: 0,
        hitByPitch: 0,
        homeRuns: 0,
        battersFaced: 0,
        inningStats: [
          {
            inning: 1,
            outs: 3,
            runs: p.runs,
            hits: p.hits,
            strikeouts: p.strikeouts,
            earnedRuns: p.earnedRuns,
            walks: p.walks,
            hitByPitch: p.hitByPitch,
            homeRuns: p.homeRuns,
            battersFaced: p.battersFaced ?? 0,
          },
        ],
      }))
      onPitchersChange(updated)
    }
    setInputMode(targetMode)
  }

  // ── 集約モード用ハンドラ ──
  const handleAggAdd = () => {
    setAggEditingIndex(null)
    setAggForm({ ...EMPTY_PITCHER })
    setIsAggDialogOpen(true)
  }

  const handleAggEdit = (index: number) => {
    setAggEditingIndex(index)
    setAggForm(pitchers[index])
    setIsAggDialogOpen(true)
  }

  const handleAggDelete = (index: number) => {
    onPitchersChange(pitchers.filter((_, i) => i !== index))
  }

  const handleAggSave = () => {
    if (!aggForm.playerName.trim()) return
    if (aggEditingIndex !== null) {
      const updated = [...pitchers]
      updated[aggEditingIndex] = aggForm
      onPitchersChange(updated)
    } else {
      onPitchersChange([...pitchers, { ...aggForm, playerId: aggForm.playerId || "" }])
    }
    setIsAggDialogOpen(false)
  }

  // ── イニングモード用ハンドラ ──
  const handleInningAddPitcher = () => {
    setPlayerEditingIndex(null)
    setPlayerForm({ ...EMPTY_PITCHER, inningStats: [] })
    setIsPlayerDialogOpen(true)
  }

  const handleInningEditPlayer = (index: number) => {
    setPlayerEditingIndex(index)
    setPlayerForm(pitchers[index])
    setIsPlayerDialogOpen(true)
  }

  const handleInningDeletePitcher = (index: number) => {
    onPitchersChange(pitchers.filter((_, i) => i !== index))
  }

  const handlePlayerSave = () => {
    if (!playerForm.playerName.trim()) return
    if (playerEditingIndex !== null) {
      const updated = [...pitchers]
      updated[playerEditingIndex] = { ...updated[playerEditingIndex], ...playerForm }
      onPitchersChange(updated)
    } else {
      onPitchersChange([...pitchers, { ...playerForm, playerId: playerForm.playerId || "", inningStats: [] }])
    }
    setIsPlayerDialogOpen(false)
  }

  const handleInningCellClick = (pitcherIndex: number, inning: number) => {
    onInningFocus?.(inning)
    setInningDialogPitcherIndex(pitcherIndex)
    setInningDialogInning(inning)
    const existing = pitchers[pitcherIndex].inningStats?.find(s => s.inning === inning)
    setInningForm(existing ? { ...existing } : { ...EMPTY_INNING_STATS, inning })
    setIsInningDialogOpen(true)
  }

  const handleInningStatsSave = () => {
    const updated = [...pitchers]
    const pitcher = { ...updated[inningDialogPitcherIndex] }
    const stats = pitcher.inningStats ? [...pitcher.inningStats] : []
    const existingIdx = stats.findIndex(s => s.inning === inningDialogInning)
    const newStat = { ...inningForm, inning: inningDialogInning }
    if (existingIdx >= 0) {
      stats[existingIdx] = newStat
    } else {
      stats.push(newStat)
      stats.sort((a, b) => a.inning - b.inning)
    }
    pitcher.inningStats = stats
    // outsPitched / isMidInningExit をイニングデータから再計算
    const agg = sumInningStats(stats)
    pitcher.outsPitched = agg.outsPitched
    pitcher.isMidInningExit = agg.isMidInningExit
    updated[inningDialogPitcherIndex] = pitcher
    onPitchersChange(updated)
    setIsInningDialogOpen(false)
  }

  const handleInningStatsDelete = () => {
    const updated = [...pitchers]
    const pitcher = { ...updated[inningDialogPitcherIndex] }
    const stats = (pitcher.inningStats ?? []).filter(s => s.inning !== inningDialogInning)
    pitcher.inningStats = stats
    const agg = sumInningStats(stats)
    pitcher.outsPitched = agg.outsPitched
    pitcher.isMidInningExit = agg.isMidInningExit
    updated[inningDialogPitcherIndex] = pitcher
    onPitchersChange(updated)
    setIsInningDialogOpen(false)
  }

  // ── 共通UIパーツ ──
  const StatButton = ({
    label,
    value,
    onChange,
    min = 0,
    max = 99,
  }: {
    label: string
    value: number
    onChange: (v: number) => void
    min?: number
    max?: number
  }) => (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm font-medium text-slate-600 min-w-[60px]">{label}</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-9 h-9 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold transition-colors flex items-center justify-center"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="w-10 text-center font-bold text-lg text-slate-800">{value}</span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-9 h-9 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold transition-colors flex items-center justify-center"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  )

  const DecisionButton = ({
    label,
    icon: Icon,
    active,
    onClick,
    color,
  }: {
    label: string
    icon: typeof Trophy
    active?: boolean
    onClick: () => void
    color: string
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all",
        active
          ? `${color} text-white shadow-lg scale-105`
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  )

  const PlayerNameSection = ({
    form,
    setForm,
  }: {
    form: PitcherResult
    setForm: (f: PitcherResult) => void
  }) => (
    <div>
      <label className="text-sm font-semibold text-slate-700 mb-2 block">選手名</label>
      {!form.isHelper && (
        registeredPlayers.length > 0 ? (
          <select
            value={form.playerId}
            onChange={(e) => {
              const player = registeredPlayers.find(p => p.id === e.target.value)
              if (player) {
                setForm({ ...form, playerId: player.id, playerName: player.name, isHelper: false })
              }
            }}
            className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all text-slate-800"
          >
            <option value="">選手を選択</option>
            {sortPlayersByNumber(registeredPlayers).map((player) => (
              <option key={player.id} value={player.id}>
                {player.number ? `${player.number} ` : ""}{player.name}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={form.playerName}
            onChange={(e) => setForm({ ...form, playerName: e.target.value })}
            placeholder="選手名を入力"
            className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
          />
        )
      )}
      <button
        onClick={() => {
          if (form.isHelper) {
            setForm({ ...form, playerId: "", playerName: "", isHelper: false })
          } else {
            setForm({ ...form, playerId: "", playerName: "助っ人", isHelper: true })
          }
        }}
        className={cn(
          "mt-2 text-xs px-3 py-1.5 rounded-lg transition-all",
          form.isHelper
            ? "bg-purple-50 text-purple-600 border border-purple-300 font-medium"
            : "text-slate-400 border border-dashed border-slate-300 hover:border-slate-400 hover:text-slate-500"
        )}
      >
        {form.isHelper ? "✓ 助っ人" : "助っ人として登録"}
      </button>
    </div>
  )

  const InningsSection = ({
    form,
    setForm,
  }: {
    form: PitcherResult
    setForm: (f: PitcherResult) => void
  }) => (
    <div className="flex justify-center py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-600 min-w-[60px]">投球回</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              const [o, m] = prevInnings(form.outsPitched, form.isMidInningExit)
              setForm({ ...form, outsPitched: o, isMidInningExit: m })
            }}
            className="w-9 h-9 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold transition-colors flex items-center justify-center"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-14 text-center font-bold text-lg text-slate-800">
            {formatInnings(form.outsPitched, form.isMidInningExit)}
          </span>
          <button
            onClick={() => {
              const [o, m] = nextInnings(form.outsPitched, form.isMidInningExit)
              setForm({ ...form, outsPitched: o, isMidInningExit: m })
            }}
            className="w-9 h-9 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold transition-colors flex items-center justify-center"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )

  const AwardSection = ({
    form,
    setForm,
  }: {
    form: PitcherResult
    setForm: (f: PitcherResult) => void
  }) => (
    <div>
      <label className="text-sm font-semibold text-slate-700 mb-3 block">勝敗・セーブ</label>
      <div className="grid grid-cols-2 gap-3">
        <DecisionButton label="勝利" icon={Trophy} active={form.award === "win"} onClick={() => setForm({ ...form, award: form.award === "win" ? null : "win" })} color="bg-amber-500" />
        <DecisionButton label="敗戦" icon={ThumbsDown} active={form.award === "lose"} onClick={() => setForm({ ...form, award: form.award === "lose" ? null : "lose" })} color="bg-slate-500" />
        <DecisionButton label="セーブ" icon={Shield} active={form.award === "save"} onClick={() => setForm({ ...form, award: form.award === "save" ? null : "save" })} color="bg-blue-500" />
        <DecisionButton label="ホールド" icon={Star} active={form.award === "hold"} onClick={() => setForm({ ...form, award: form.award === "hold" ? null : "hold" })} color="bg-emerald-500" />
      </div>
    </div>
  )

  // ── イニングモード テーブル ──
  const inningColumns = Array.from({ length: totalInnings }, (_, i) => i + 1)
  const STAT_ROWS = ["失点", "安打", "三振"] as const

  const getInningValue = (pitcher: PitcherResult, inning: number, stat: typeof STAT_ROWS[number]): number | null => {
    const s = pitcher.inningStats?.find(x => x.inning === inning)
    if (!s) return null
    if (stat === "失点") return s.runs
    if (stat === "安打") return s.hits
    return s.strikeouts
  }

  const renderInningTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="px-2 py-2 text-center font-medium w-8">#</th>
            <th className="px-2 py-2 text-left font-medium min-w-[4rem] max-w-[5rem]">投手</th>
            <th className="px-2 py-2 text-center font-medium w-10">項目</th>
            {inningColumns.map(n => (
              <th key={n} className={cn("px-1 py-2 text-center font-medium w-8 transition-colors", n === activeInning && "bg-amber-100 text-amber-800")}>{n}</th>
            ))}
            <th className="w-8"></th>
          </tr>
        </thead>
        <tbody>
          {pitchers.map((pitcher, pIdx) => (
            STAT_ROWS.map((stat, sIdx) => (
              <tr key={`${pIdx}-${stat}`} className={cn("border-t border-slate-100", sIdx === 0 && pIdx > 0 && "border-t-2 border-slate-200")}>
                {sIdx === 0 && (
                  <>
                    <td rowSpan={3} className="px-2 py-1 text-center text-slate-500 align-middle">
                      {pIdx + 1}
                    </td>
                    <td
                      rowSpan={3}
                      className="px-2 py-1 align-middle min-w-[4rem] max-w-[5rem] cursor-pointer hover:bg-blue-50 transition-colors"
                      onClick={() => handleInningEditPlayer(pIdx)}
                    >
                      <div className="flex items-center gap-1 flex-wrap">
                        {pitcher.award === "win"  && <span className="text-xs text-amber-500 font-bold">勝</span>}
                        {pitcher.award === "lose" && <span className="text-xs text-slate-500 font-bold">敗</span>}
                        {pitcher.award === "save" && <span className="text-xs text-blue-500 font-bold">S</span>}
                        {pitcher.award === "hold" && <span className="text-xs text-emerald-500 font-bold">H</span>}
                        <span className="font-medium text-slate-800">{pitcher.playerName || <span className="text-slate-400">名前を設定</span>}</span>
                        {pitcher.isHelper && <span className="text-xs px-1 rounded bg-purple-100 text-purple-600">助っ人</span>}
                      </div>
                    </td>
                  </>
                )}
                <td className="px-2 py-1 text-center text-xs text-slate-500 whitespace-nowrap">{stat}</td>
                {inningColumns.map(inning => {
                  const val = getInningValue(pitcher, inning, stat)
                  return (
                    <td
                      key={inning}
                      className={cn(
                        "px-1 py-1 text-center cursor-pointer hover:bg-blue-50 transition-colors rounded",
                        inning === activeInning && "bg-amber-50"
                      )}
                      onClick={() => handleInningCellClick(pIdx, inning)}
                    >
                      {val !== null ? (
                        <span className={cn("font-medium", val > 0 && stat === "失点" && "text-red-600")}>{val}</span>
                      ) : (
                        <span className="text-slate-200">-</span>
                      )}
                    </td>
                  )
                })}
                {sIdx === 0 && (
                  <td rowSpan={3} className="px-1 py-1 text-center align-middle">
                    <button
                      onClick={() => handleInningDeletePitcher(pIdx)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))
          ))}
        </tbody>
      </table>
      <div className="px-4 py-2">
        <button
          onClick={handleInningAddPitcher}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 py-1"
        >
          <Plus className="w-4 h-4" />
          投手を追加
        </button>
      </div>
    </div>
  )

  // ── 集約モード テーブル（既存） ──
  const renderAggregateTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="px-2 py-2 text-center font-medium"></th>
            <th className="px-3 py-2 text-left font-medium">投手</th>
            <th className="px-2 py-2 text-center font-medium">回</th>
            <th className="px-2 py-2 text-center font-medium">打者</th>
            <th className="px-2 py-2 text-center font-medium">被安</th>
            <th className="px-2 py-2 text-center font-medium">被本</th>
            <th className="px-2 py-2 text-center font-medium">三振</th>
            <th className="px-2 py-2 text-center font-medium">四球</th>
            <th className="px-2 py-2 text-center font-medium">死球</th>
            <th className="px-2 py-2 text-center font-medium">失点</th>
            <th className="px-2 py-2 text-center font-medium">自責</th>
            <th className="px-2 py-2 text-center font-medium"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {pitchers.map((pitcher, index) => (
            <tr
              key={index}
              className="hover:bg-slate-50 cursor-pointer transition-colors"
              onClick={() => handleAggEdit(index)}
            >
              <td className="px-2 py-2 text-center">
                {pitcher.award === "win"  && <span className="text-amber-500 font-bold">勝</span>}
                {pitcher.award === "lose" && <span className="text-slate-500 font-bold">敗</span>}
                {pitcher.award === "save" && <span className="text-blue-500 font-bold">S</span>}
                {pitcher.award === "hold" && <span className="text-emerald-500 font-bold">H</span>}
              </td>
              <td className="px-2 py-2 font-medium text-slate-800 min-w-[4rem] max-w-[5rem]">
                <div className="flex items-center gap-1 flex-wrap">
                  <span>{pitcher.playerName}</span>
                  {pitcher.isHelper && <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-600 font-medium">助っ人</span>}
                </div>
              </td>
              <td className="px-2 py-2 text-center">{formatInnings(pitcher.outsPitched, pitcher.isMidInningExit)}</td>
              <td className="px-2 py-2 text-center">{pitcher.battersFaced ?? 0}</td>
              <td className="px-2 py-2 text-center">{pitcher.hits}</td>
              <td className="px-2 py-2 text-center">{pitcher.homeRuns}</td>
              <td className="px-2 py-2 text-center">{pitcher.strikeouts}</td>
              <td className="px-2 py-2 text-center">{pitcher.walks}</td>
              <td className="px-2 py-2 text-center">{pitcher.hitByPitch}</td>
              <td className="px-2 py-2 text-center">{pitcher.runs}</td>
              <td className="px-2 py-2 text-center">{pitcher.earnedRuns}</td>
              <td className="px-2 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => handleAggDelete(index)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* ヘッダ */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
        <h2 className="font-bold text-slate-700">投手成績</h2>
        <div className="flex items-center gap-2">
          {/* モードトグル */}
          <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs font-medium">
            <button
              onClick={() => handleModeToggle("inning")}
              className={cn(
                "px-3 py-1.5 transition-colors",
                inputMode === "inning"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50"
              )}
            >
              イニングごと
            </button>
            <button
              onClick={() => handleModeToggle("aggregate")}
              className={cn(
                "px-3 py-1.5 transition-colors",
                inputMode === "aggregate"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50"
              )}
            >
              試合集約
            </button>
          </div>
          {inputMode === "aggregate" && (
            <Button size="sm" variant="outline" onClick={handleAggAdd} className="gap-1">
              <Plus className="w-4 h-4" />
              追加
            </Button>
          )}
        </div>
      </div>

      {/* テーブル */}
      {pitchers.length === 0 && inputMode === "aggregate" ? (
        <div className="p-8 text-center text-slate-400">投手を追加してください</div>
      ) : inputMode === "inning" ? (
        renderInningTable()
      ) : (
        renderAggregateTable()
      )}

      {/* ── 確認ダイアログ ── */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog(prev => ({ ...prev, open: false }))}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-800">入力モードの切り替え</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 py-2">
            {confirmDialog.targetMode === "aggregate"
              ? "イニングごとのデータは集約されますがよろしいですか？"
              : "入力されたデータは1回の記録とします"}
          </p>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}>
              キャンセル
            </Button>
            <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleConfirmModeSwitch}>
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── 集約モード: 投手編集ダイアログ ── */}
      <Dialog open={isAggDialogOpen} onOpenChange={setIsAggDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90svh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800">
              {aggEditingIndex !== null ? "投手成績を編集" : "投手を追加"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <PlayerNameSection form={aggForm} setForm={setAggForm} />
            <InningsSection form={aggForm} setForm={setAggForm} />
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="grid grid-cols-1 gap-y-3 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-4">
                <StatButton label="打者" value={aggForm.battersFaced ?? 0} onChange={(v) => setAggForm({ ...aggForm, battersFaced: v })} />
                <StatButton label="失点" value={aggForm.runs} onChange={(v) => setAggForm({ ...aggForm, runs: v })} />
                <StatButton label="被安打" value={aggForm.hits} onChange={(v) => setAggForm({ ...aggForm, hits: v })} />
                <StatButton label="奪三振" value={aggForm.strikeouts} onChange={(v) => setAggForm({ ...aggForm, strikeouts: v })} />
                <StatButton label="四球" value={aggForm.walks} onChange={(v) => setAggForm({ ...aggForm, walks: v })} />
                <StatButton label="死球" value={aggForm.hitByPitch} onChange={(v) => setAggForm({ ...aggForm, hitByPitch: v })} />
                <StatButton label="自責点" value={aggForm.earnedRuns} onChange={(v) => setAggForm({ ...aggForm, earnedRuns: v })} />
                <StatButton label="被本塁打" value={aggForm.homeRuns} onChange={(v) => setAggForm({ ...aggForm, homeRuns: v })} />
              </div>
            </div>
            <AwardSection form={aggForm} setForm={setAggForm} />
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setIsAggDialogOpen(false)}>キャンセル</Button>
              <Button className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold" onClick={handleAggSave} disabled={!aggForm.playerName.trim()}>保存</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── イニングモード: 選手編集ダイアログ ── */}
      <Dialog open={isPlayerDialogOpen} onOpenChange={setIsPlayerDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90svh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800">
              {playerEditingIndex !== null ? "投手を編集" : "投手を追加"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <PlayerNameSection form={playerForm} setForm={setPlayerForm} />
            <AwardSection form={playerForm} setForm={setPlayerForm} />
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setIsPlayerDialogOpen(false)}>キャンセル</Button>
              <Button className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold" onClick={handlePlayerSave} disabled={!playerForm.playerName.trim() && !playerForm.isHelper}>保存</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── イニングモード: イニング統計ダイアログ ── */}
      <Dialog open={isInningDialogOpen} onOpenChange={setIsInningDialogOpen}>
        <DialogContent className="max-w-sm max-h-[90svh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800">
              {pitchers[inningDialogPitcherIndex]?.playerName} — {inningDialogInning}回
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* 投球回 */}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">投球回</label>
              <div className="flex gap-2">
                {OUTS_OPTIONS.map(opt => (
                  <button
                    key={opt.outs}
                    onClick={() => setInningForm({ ...inningForm, outs: opt.outs })}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all border",
                      inningForm.outs === opt.outs
                        ? "bg-blue-600 text-white border-blue-600 shadow"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {/* スタッツ */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              <StatButton label="打者数" value={inningForm.battersFaced} onChange={(v) => setInningForm({ ...inningForm, battersFaced: v })} />
              <StatButton label="失点" value={inningForm.runs} onChange={(v) => setInningForm({ ...inningForm, runs: v })} />
              <StatButton label="安打" value={inningForm.hits} onChange={(v) => setInningForm({ ...inningForm, hits: v })} />
              <StatButton label="三振" value={inningForm.strikeouts} onChange={(v) => setInningForm({ ...inningForm, strikeouts: v })} />
              <StatButton label="四球" value={inningForm.walks} onChange={(v) => setInningForm({ ...inningForm, walks: v })} />
              <StatButton label="死球" value={inningForm.hitByPitch} onChange={(v) => setInningForm({ ...inningForm, hitByPitch: v })} />
              <StatButton label="自責点" value={inningForm.earnedRuns} onChange={(v) => setInningForm({ ...inningForm, earnedRuns: v })} />
              <StatButton label="被本塁打" value={inningForm.homeRuns} onChange={(v) => setInningForm({ ...inningForm, homeRuns: v })} />
            </div>
            {pitchers[inningDialogPitcherIndex]?.inningStats?.some(s => s.inning === inningDialogInning) && (
              <Button
                variant="outline"
                className="w-full h-10 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                onClick={handleInningStatsDelete}
              >
                このイニングのデータを削除
              </Button>
            )}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setIsInningDialogOpen(false)}>キャンセル</Button>
              <Button className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold" onClick={handleInningStatsSave}>保存</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
