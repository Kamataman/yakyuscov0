"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Save, Loader2 } from "lucide-react"
import { BattingGrid } from "@/components/batting-grid"
import { BattingInputDialog } from "@/components/batting-input-dialog"
import { ScoreInput } from "@/components/score-input"
import { PlayerSelectDialog } from "@/components/player-select-dialog"
import { PitcherInput } from "@/components/pitcher-input"
import type { BattingResult, CellPosition, LineupSlot, InningScore, Player, PitcherResult } from "@/lib/batting-types"

export default function GameEditPage() {
  const params = useParams()
  const router = useRouter()
  const gameId = params.id as string
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  // 試合情報
  const [gameDate, setGameDate] = useState("")
  const [opponent, setOpponent] = useState("")

  // 打撃結果
  const [results, setResults] = useState<Record<string, BattingResult>>({})
  const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  // イニングスコア
  const [inningScores, setInningScores] = useState<InningScore[]>(
    Array.from({ length: 9 }, () => ({ our: 0, opponent: 0 }))
  )

  // 打順
  const [lineupSlots, setLineupSlots] = useState<LineupSlot[]>(
    Array.from({ length: 9 }, (_, i) => ({
      order: i + 1,
      entries: [],
    }))
  )
  const [selectedLineupOrder, setSelectedLineupOrder] = useState<number | null>(null)
  const [playerDialogOpen, setPlayerDialogOpen] = useState(false)

  // 登録済み選手
  const [registeredPlayers, setRegisteredPlayers] = useState<Player[]>([])
  
  // 投手成績
  const [pitchers, setPitchers] = useState<PitcherResult[]>([])

  // データを読み込み
  useEffect(() => {
    Promise.all([
      fetch(`/api/games/${gameId}`).then(res => res.json()),
      fetch("/api/players").then(res => res.json()),
    ])
      .then(([gameData, playersData]) => {
        if (gameData.game) {
          setGameDate(gameData.game.date)
          setOpponent(gameData.game.opponent)
        }

        // イニングスコア
        if (gameData.inningScores) {
          const scores: InningScore[] = Array.from({ length: 9 }, () => ({ our: 0, opponent: 0 }))
          for (const score of gameData.inningScores) {
            if (score.inning >= 1 && score.inning <= scores.length) {
              scores[score.inning - 1] = {
                our: score.our_score,
                opponent: score.opponent_score,
              }
            }
          }
          setInningScores(scores)
        }

        // 打順
        if (gameData.lineupEntries) {
          const slots = new Map<number, LineupSlot>()
          for (const entry of gameData.lineupEntries) {
            if (!slots.has(entry.batting_order)) {
              slots.set(entry.batting_order, {
                order: entry.batting_order,
                entries: [],
              })
            }
            slots.get(entry.batting_order)!.entries.push({
              playerId: entry.player_id || "",
              playerName: entry.player_name,
              position: entry.position,
              isSubstitute: entry.is_substitute,
              enteredInning: entry.entered_inning,
            })
          }
          
          const maxOrder = Math.max(9, ...gameData.lineupEntries.map((e: { batting_order: number }) => e.batting_order))
          const newSlots: LineupSlot[] = Array.from({ length: maxOrder }, (_, i) => 
            slots.get(i + 1) || { order: i + 1, entries: [] }
          )
          setLineupSlots(newSlots)
        }

        // 打撃結果
        if (gameData.battingResults) {
          const newResults: Record<string, BattingResult> = {}
          for (const result of gameData.battingResults) {
            const key = `${result.batting_order}-${result.inning}`
            newResults[key] = {
              hitResult: result.hit_result,
              direction: result.direction,
              rbiCount: result.rbi_count,
              runners: {
                first: result.runner_first,
                second: result.runner_second,
                third: result.runner_third,
              },
              stolenBases: {
                second: result.stolen_second,
                third: result.stolen_third,
                home: result.stolen_home,
              },
            }
          }
          setResults(newResults)
        }

        // 投手成績
        if (gameData.pitcherResults) {
          setPitchers(gameData.pitcherResults.map((p: {
            player_id?: string
            player_name: string
            innings_pitched: number
            hits: number
            runs: number
            earned_runs: number
            strikeouts: number
            walks: number
            hit_by_pitch: number
            home_runs: number
            pitch_count?: number
            is_win: boolean
            is_lose: boolean
            is_save: boolean
            is_hold: boolean
          }) => ({
            playerId: p.player_id || "",
            playerName: p.player_name,
            inningsPitched: p.innings_pitched,
            hits: p.hits,
            runs: p.runs,
            earnedRuns: p.earned_runs,
            strikeouts: p.strikeouts,
            walks: p.walks,
            hitByPitch: p.hit_by_pitch,
            homeRuns: p.home_runs,
            pitchCount: p.pitch_count,
            isWin: p.is_win,
            isLose: p.is_lose,
            isSave: p.is_save,
            isHold: p.is_hold,
          })))
        }

        // 選手一覧
        if (Array.isArray(playersData)) {
          setRegisteredPlayers(playersData.map((p: { id: string; name: string; number?: number }) => ({
            id: p.id,
            name: p.name,
            number: p.number,
          })))
        }

        setIsLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setIsLoading(false)
      })
  }, [gameId])

  // 保存処理
  const handleSave = async () => {
    if (!opponent.trim()) {
      alert("対戦相手を入力してください")
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/games/${gameId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: gameDate,
          opponent,
          inningScores,
          lineupSlots,
          battingResults: results,
          pitchers,
        }),
      })

      if (!response.ok) {
        throw new Error("保存に失敗しました")
      }

      alert("保存しました")
      router.push(`/games/${gameId}`)
    } catch (error) {
      console.error(error)
      alert("保存に失敗しました")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCellClick = (position: CellPosition) => {
    setSelectedCell(position)
    setDialogOpen(true)
  }

  const handleResultSave = (result: BattingResult) => {
    if (!selectedCell) return
    const key = `${selectedCell.battingOrder}-${selectedCell.inning}`
    setResults((prev) => ({
      ...prev,
      [key]: result,
    }))
    setDialogOpen(false)
  }

  const handleResultDelete = () => {
    if (!selectedCell) return
    const key = `${selectedCell.battingOrder}-${selectedCell.inning}`
    setResults((prev) => {
      const newResults = { ...prev }
      delete newResults[key]
      return newResults
    })
    setDialogOpen(false)
  }

  const handlePlayerClick = (order: number) => {
    setSelectedLineupOrder(order)
    setPlayerDialogOpen(true)
  }

  const handleLineupSave = (entries: LineupSlot["entries"]) => {
    if (selectedLineupOrder === null) return
    setLineupSlots((prev) => {
      const newSlots = [...prev]
      const index = newSlots.findIndex((s) => s.order === selectedLineupOrder)
      if (index !== -1) {
        newSlots[index] = { ...newSlots[index], entries }
      }
      return newSlots
    })
    setPlayerDialogOpen(false)
  }

  const handleAddBattingOrder = () => {
    const newOrder = lineupSlots.length + 1
    setLineupSlots((prev) => [...prev, { order: newOrder, entries: [] }])
  }

  const currentResult = selectedCell
    ? results[`${selectedCell.battingOrder}-${selectedCell.inning}`]
    : undefined

  const currentLineupSlot = selectedLineupOrder !== null
    ? lineupSlots.find((s) => s.order === selectedLineupOrder)
    : undefined

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200">
      <div className="mx-auto max-w-6xl space-y-4 p-4 md:p-6">
        {/* ページタイトルと保存ボタン */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-slate-800">試合結果編集</h1>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-md transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSaving ? "保存中..." : "保存"}
          </button>
        </div>
        {/* 試合情報 */}
        <div className="rounded-2xl bg-white p-4 shadow-lg">
          <h2 className="mb-3 text-sm font-bold text-slate-600">試合情報</h2>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600">日付</label>
              <input
                type="date"
                value={gameDate}
                onChange={(e) => setGameDate(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-1 items-center gap-2">
              <label className="text-sm text-slate-600">対戦相手</label>
              <input
                type="text"
                value={opponent}
                onChange={(e) => setOpponent(e.target.value)}
                placeholder="チーム名を入力"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        
        <ScoreInput
          inningScores={inningScores}
          onScoresChange={setInningScores}
        />

        <BattingGrid 
          results={results} 
          onCellClick={handleCellClick}
          lineupSlots={lineupSlots}
          onPlayerClick={handlePlayerClick}
          onAddBattingOrder={handleAddBattingOrder}
        />

        <PitcherInput
          pitchers={pitchers}
          onPitchersChange={setPitchers}
          registeredPlayers={registeredPlayers}
        />
      </div>

      <BattingInputDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        position={selectedCell}
        existingResult={currentResult}
        onSave={handleResultSave}
        onDelete={handleResultDelete}
      />

      <PlayerSelectDialog
        open={playerDialogOpen}
        onOpenChange={setPlayerDialogOpen}
        order={selectedLineupOrder || 1}
        currentEntries={currentLineupSlot?.entries || []}
        onSave={handleLineupSave}
        registeredPlayers={registeredPlayers}
      />
    </main>
  )
}
