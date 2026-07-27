"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { cn } from "@/lib/utils"
import type { PitcherResult, PitcherInningStats, Player } from "@/lib/batting-types"
import { Plus, Trash2, Trophy, ThumbsDown, Shield, Star, Minus, HelpCircle } from "lucide-react"
import { PlayerCombobox } from "@/components/player-combobox"
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog"

interface PitcherInputProps {
  pitchers: PitcherResult[]
  onPitchersChange: (pitchers: PitcherResult[]) => void
  registeredPlayers?: Player[]
  totalInnings?: number
  activeInning?: number | null
  onInningFocus?: (inning: number) => void
  teamId: string
  onPlayerAdded: (player: Player) => void
  isAdmin?: boolean
  shareToken?: string
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
  teamId,
  onPlayerAdded,
  isAdmin = false,
  shareToken,
}: PitcherInputProps) {
  const [inputMode, setInputMode] = useState<InputMode>("inning")
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; targetMode: InputMode }>({ open: false, targetMode: "aggregate" })
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false)

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

  // 削除確認ダイアログ
  const [aggDeleteTarget, setAggDeleteTarget] = useState<number | null>(null)
  const [inningDeleteTarget, setInningDeleteTarget] = useState<number | null>(null)
  const [inningStatsDeleteOpen, setInningStatsDeleteOpen] = useState(false)

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
    setAggDeleteTarget(index)
  }

  const handleAggDeleteConfirm = () => {
    if (aggDeleteTarget === null) return
    onPitchersChange(pitchers.filter((_, i) => i !== aggDeleteTarget))
    setAggDeleteTarget(null)
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
    setInningDeleteTarget(index)
  }

  const handleInningDeleteConfirm = () => {
    if (inningDeleteTarget === null) return
    onPitchersChange(pitchers.filter((_, i) => i !== inningDeleteTarget))
    setInningDeleteTarget(null)
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
    setInningStatsDeleteOpen(true)
  }

  const handleInningStatsDeleteConfirm = () => {
    const updated = [...pitchers]
    const pitcher = { ...updated[inningDialogPitcherIndex] }
    const stats = (pitcher.inningStats ?? []).filter(s => s.inning !== inningDialogInning)
    pitcher.inningStats = stats
    const agg = sumInningStats(stats)
    pitcher.outsPitched = agg.outsPitched
    pitcher.isMidInningExit = agg.isMidInningExit
    updated[inningDialogPitcherIndex] = pitcher
    onPitchersChange(updated)
    setInningStatsDeleteOpen(false)
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
      <span className="text-sm font-medium text-muted-foreground min-w-[60px]">{label}</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-9 h-9 bg-muted hover:bg-muted-foreground/20 text-foreground font-bold transition-colors flex items-center justify-center"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="font-display w-10 text-center font-bold text-lg text-foreground">{value}</span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-9 h-9 bg-muted hover:bg-muted-foreground/20 text-foreground font-bold transition-colors flex items-center justify-center"
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
        "flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-all",
        active
          ? `${color} text-white`
          : "bg-muted text-muted-foreground hover:bg-muted-foreground/20"
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
      <label className="text-sm font-semibold text-foreground mb-2 block">選手名</label>
      {!form.isHelper && (
        <PlayerCombobox
          players={registeredPlayers}
          value={form.playerId}
          onChange={(player) => {
            if (player) {
              setForm({ ...form, playerId: player.id, playerName: player.name, isHelper: false })
            } else {
              setForm({ ...form, playerId: "", playerName: "", isHelper: false })
            }
          }}
          teamId={teamId}
          onPlayerAdded={onPlayerAdded}
          isAdmin={isAdmin}
          shareToken={shareToken}
        />
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
          "mt-2 text-xs px-3 py-1.5 transition-all",
          form.isHelper
            ? "bg-amber-50 text-amber-700 border border-amber-300 font-medium"
            : "text-muted-foreground border border-dashed border-border hover:border-foreground/40 hover:text-foreground"
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
        <span className="text-sm font-medium text-muted-foreground min-w-[60px]">投球回</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              const [o, m] = prevInnings(form.outsPitched, form.isMidInningExit)
              setForm({ ...form, outsPitched: o, isMidInningExit: m })
            }}
            className="w-9 h-9 bg-muted hover:bg-muted-foreground/20 text-foreground font-bold transition-colors flex items-center justify-center"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="font-display w-14 text-center font-bold text-lg text-foreground">
            {formatInnings(form.outsPitched, form.isMidInningExit)}
          </span>
          <button
            onClick={() => {
              const [o, m] = nextInnings(form.outsPitched, form.isMidInningExit)
              setForm({ ...form, outsPitched: o, isMidInningExit: m })
            }}
            className="w-9 h-9 bg-muted hover:bg-muted-foreground/20 text-foreground font-bold transition-colors flex items-center justify-center"
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
      <label className="text-sm font-semibold text-foreground mb-3 block">勝敗・セーブ</label>
      <div className="grid grid-cols-2 gap-3">
        <DecisionButton label="勝利" icon={Trophy} active={form.award === "win"} onClick={() => setForm({ ...form, award: form.award === "win" ? null : "win" })} color="bg-turf" />
        <DecisionButton label="敗戦" icon={ThumbsDown} active={form.award === "lose"} onClick={() => setForm({ ...form, award: form.award === "lose" ? null : "lose" })} color="bg-stitch" />
        <DecisionButton label="セーブ" icon={Shield} active={form.award === "save"} onClick={() => setForm({ ...form, award: form.award === "save" ? null : "save" })} color="bg-foreground" />
        <DecisionButton label="ホールド" icon={Star} active={form.award === "hold"} onClick={() => setForm({ ...form, award: form.award === "hold" ? null : "hold" })} color="bg-muted-foreground" />
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
        <thead className="bg-muted text-muted-foreground">
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
              <tr key={`${pIdx}-${stat}`} className={cn("border-t border-border", sIdx === 0 && pIdx > 0 && "border-t-2")}>
                {sIdx === 0 && (
                  <>
                    <td rowSpan={3} className="px-2 py-1 text-center text-muted-foreground align-middle">
                      {pIdx + 1}
                    </td>
                    <td
                      rowSpan={3}
                      className="px-2 py-1 align-middle min-w-[4rem] max-w-[5rem] cursor-pointer hover:bg-turf/10 transition-colors"
                      onClick={() => handleInningEditPlayer(pIdx)}
                    >
                      <div className="flex items-center gap-1 flex-wrap">
                        {pitcher.award === "win"  && <span className="text-xs text-turf font-bold">勝</span>}
                        {pitcher.award === "lose" && <span className="text-xs text-stitch font-bold">敗</span>}
                        {pitcher.award === "save" && <span className="text-xs text-foreground font-bold">S</span>}
                        {pitcher.award === "hold" && <span className="text-xs text-foreground font-bold">H</span>}
                        <span className="font-medium text-foreground">{pitcher.playerName || <span className="text-muted-foreground">名前を設定</span>}</span>
                        {pitcher.isHelper && <span className="text-xs px-1 bg-amber-100 text-amber-700">助っ人</span>}
                      </div>
                    </td>
                  </>
                )}
                <td className="px-2 py-1 text-center text-xs text-muted-foreground whitespace-nowrap">{stat}</td>
                {inningColumns.map(inning => {
                  const val = getInningValue(pitcher, inning, stat)
                  return (
                    <td
                      key={inning}
                      className={cn(
                        "px-1 py-1 text-center cursor-pointer hover:bg-turf/10 transition-colors",
                        inning === activeInning && "bg-amber-50"
                      )}
                      onClick={() => handleInningCellClick(pIdx, inning)}
                    >
                      {val !== null ? (
                        <span className={cn("font-medium", val > 0 && stat === "失点" && "text-stitch")}>{val}</span>
                      ) : (
                        <span className="text-muted-foreground/30">-</span>
                      )}
                    </td>
                  )
                })}
                {sIdx === 0 && (
                  <td rowSpan={3} className="px-1 py-1 text-center align-middle">
                    <button
                      onClick={() => handleInningDeletePitcher(pIdx)}
                      className="p-1.5 text-muted-foreground hover:text-stitch hover:bg-stitch/10 transition-colors"
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
          className="text-sm text-turf hover:text-turf/80 font-medium flex items-center gap-1 py-1"
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
        <thead className="bg-muted text-muted-foreground">
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
        <tbody className="divide-y divide-border">
          {pitchers.map((pitcher, index) => (
            <tr
              key={index}
              className="hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => handleAggEdit(index)}
            >
              <td className="px-2 py-2 text-center">
                {pitcher.award === "win"  && <span className="text-turf font-bold">勝</span>}
                {pitcher.award === "lose" && <span className="text-stitch font-bold">敗</span>}
                {pitcher.award === "save" && <span className="text-foreground font-bold">S</span>}
                {pitcher.award === "hold" && <span className="text-foreground font-bold">H</span>}
              </td>
              <td className="px-2 py-2 font-medium text-foreground min-w-[4rem] max-w-[5rem]">
                <div className="flex items-center gap-1 flex-wrap">
                  <span>{pitcher.playerName}</span>
                  {pitcher.isHelper && <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 font-medium">助っ人</span>}
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
                  className="p-1.5 text-muted-foreground hover:text-stitch hover:bg-stitch/10 transition-colors"
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
    <div className="border border-border overflow-hidden">
      {/* ヘッダ */}
      <div className="px-4 py-3 bg-muted border-b border-border flex items-center justify-between gap-2">
        <h2 className="font-bold text-foreground">投手成績</h2>
        <div className="flex items-center gap-2">
          {/* ヘルプアイコン */}
          <button
            onClick={() => setIsHelpDialogOpen(true)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="入力モードの説明"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          {/* モードトグル */}
          <div className="flex border border-border overflow-hidden text-xs font-medium">
            <button
              onClick={() => handleModeToggle("inning")}
              className={cn(
                "px-3 py-1.5 transition-colors",
                inputMode === "inning"
                  ? "bg-turf text-turf-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"
              )}
            >
              イニングごと
            </button>
            <button
              onClick={() => handleModeToggle("aggregate")}
              className={cn(
                "px-3 py-1.5 transition-colors",
                inputMode === "aggregate"
                  ? "bg-turf text-turf-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"
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
        <div className="p-8 text-center text-muted-foreground">投手を追加してください</div>
      ) : inputMode === "inning" ? (
        renderInningTable()
      ) : (
        renderAggregateTable()
      )}

      {/* ── ヘルプダイアログ ── */}
      <Dialog open={isHelpDialogOpen} onOpenChange={setIsHelpDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">入力モードについて</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 text-sm text-muted-foreground">
            <div>
              <p className="font-semibold text-foreground mb-1">イニングごと</p>
              <p>各イニングの投球内容（被安打・奪三振・与四球など）をイニング単位で記録します。登板・交代のタイミングも管理できます。</p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">試合集約</p>
              <p>試合全体の投手成績（投球回・被安打・奪三振・与四球・失点など）をまとめて入力します。イニング詳細は記録しません。</p>
            </div>
          </div>
          <Button className="w-full bg-turf hover:bg-turf/90 text-turf-foreground" onClick={() => setIsHelpDialogOpen(false)}>
            閉じる
          </Button>
        </DialogContent>
      </Dialog>

      {/* ── 確認ダイアログ ── */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog(prev => ({ ...prev, open: false }))}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">入力モードの切り替え</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            {confirmDialog.targetMode === "aggregate"
              ? "イニングごとのデータは集約されますがよろしいですか？"
              : "入力されたデータは1回の記録とします"}
          </p>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}>
              キャンセル
            </Button>
            <Button className="flex-1 bg-turf hover:bg-turf/90 text-turf-foreground" onClick={handleConfirmModeSwitch}>
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── 集約モード: 投手編集ダイアログ ── */}
      <Drawer open={isAggDialogOpen} onOpenChange={setIsAggDialogOpen}>
        <DrawerContent className="max-h-[92vh]">
          <DrawerHeader>
            <DrawerTitle className="text-lg font-bold text-foreground">
              {aggEditingIndex !== null ? "投手成績を編集" : "投手を追加"}
            </DrawerTitle>
          </DrawerHeader>
          <div className="space-y-6 py-4 px-4 overflow-y-auto">
            <PlayerNameSection form={aggForm} setForm={setAggForm} />
            <InningsSection form={aggForm} setForm={setAggForm} />
            <div className="bg-muted p-4">
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
            <div className="flex gap-3 pt-2 pb-2">
              <Button variant="outline" className="flex-1 h-12" onClick={() => setIsAggDialogOpen(false)}>キャンセル</Button>
              <Button className="flex-1 h-12 bg-turf hover:bg-turf/90 text-turf-foreground font-semibold" onClick={handleAggSave} disabled={!aggForm.playerName.trim()}>保存</Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* ── イニングモード: 選手編集ダイアログ ── */}
      <Drawer open={isPlayerDialogOpen} onOpenChange={setIsPlayerDialogOpen}>
        <DrawerContent className="max-h-[92vh]">
          <DrawerHeader>
            <DrawerTitle className="text-lg font-bold text-foreground">
              {playerEditingIndex !== null ? "投手を編集" : "投手を追加"}
            </DrawerTitle>
          </DrawerHeader>
          <div className="space-y-6 py-4 px-4 overflow-y-auto">
            <PlayerNameSection form={playerForm} setForm={setPlayerForm} />
            <AwardSection form={playerForm} setForm={setPlayerForm} />
            <div className="flex gap-3 pt-2 pb-2">
              <Button variant="outline" className="flex-1 h-12" onClick={() => setIsPlayerDialogOpen(false)}>キャンセル</Button>
              <Button className="flex-1 h-12 bg-turf hover:bg-turf/90 text-turf-foreground font-semibold" onClick={handlePlayerSave} disabled={!playerForm.playerName.trim() && !playerForm.isHelper}>保存</Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* ── イニングモード: イニング統計ダイアログ ── */}
      <Drawer open={isInningDialogOpen} onOpenChange={setIsInningDialogOpen}>
        <DrawerContent className="max-h-[92vh]">
          <DrawerHeader>
            <DrawerTitle className="text-lg font-bold text-foreground">
              {pitchers[inningDialogPitcherIndex]?.playerName} — {inningDialogInning}回
            </DrawerTitle>
          </DrawerHeader>
          <div className="space-y-4 py-4 px-4 overflow-y-auto">
            {/* 投球回 */}
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">投球回</label>
              <div className="flex gap-2">
                {OUTS_OPTIONS.map(opt => (
                  <button
                    key={opt.outs}
                    onClick={() => setInningForm({ ...inningForm, outs: opt.outs })}
                    className={cn(
                      "flex-1 py-2.5 text-sm font-semibold transition-all border",
                      inningForm.outs === opt.outs
                        ? "bg-turf text-turf-foreground border-turf"
                        : "bg-background text-muted-foreground border-border hover:border-foreground/30"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {/* スタッツ */}
            <div className="bg-muted p-4 space-y-3">
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
                className="w-full h-10 border-stitch/40 text-stitch hover:bg-stitch/10 hover:border-stitch"
                onClick={handleInningStatsDelete}
              >
                このイニングのデータを削除
              </Button>
            )}
            <div className="flex gap-3 pb-2">
              <Button variant="outline" className="flex-1 h-12" onClick={() => setIsInningDialogOpen(false)}>キャンセル</Button>
              <Button className="flex-1 h-12 bg-turf hover:bg-turf/90 text-turf-foreground font-semibold" onClick={handleInningStatsSave}>保存</Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <ConfirmDeleteDialog
        open={aggDeleteTarget !== null}
        onOpenChange={(open) => { if (!open) setAggDeleteTarget(null) }}
        title="投手を削除しますか？"
        description="この投手の記録が削除されます。"
        onConfirm={handleAggDeleteConfirm}
      />
      <ConfirmDeleteDialog
        open={inningDeleteTarget !== null}
        onOpenChange={(open) => { if (!open) setInningDeleteTarget(null) }}
        title="投手を削除しますか？"
        description="この投手の記録が削除されます。"
        onConfirm={handleInningDeleteConfirm}
      />
      <ConfirmDeleteDialog
        open={inningStatsDeleteOpen}
        onOpenChange={setInningStatsDeleteOpen}
        title="イニングのデータを削除しますか？"
        description="このイニングの成績が削除されます。"
        onConfirm={handleInningStatsDeleteConfirm}
      />
    </div>
  )
}
