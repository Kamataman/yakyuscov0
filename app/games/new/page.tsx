"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { BattingGrid } from "@/components/batting-grid"
import { BattingInputDialog } from "@/components/batting-input-dialog"
import { ScoreInput } from "@/components/score-input"
import { PlayerSelectDialog } from "@/components/player-select-dialog"
import { PitcherInput } from "@/components/pitcher-input"
import type { BattingResult, CellPosition, LineupSlot, InningScore, Player, PitcherResult } from "@/lib/batting-types"

export default function GameResultPage() {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [results, setResults] = useState<Record<string, BattingResult>>({})
  const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  // イニングごとのスコア
  const [inningScores, setInningScores] = useState<InningScore[]>(
    Array(9).fill(null).map(() => ({ our: 0, opponent: 0 }))
  )
  
  // 打順の最大数（初期9、増やせる）
  const [maxBattingOrder, setMaxBattingOrder] = useState(9)
  
  // 打順スロット（代打・途中交代対応）
  const [lineupSlots, setLineupSlots] = useState<LineupSlot[]>(
    Array(9).fill(null).map((_, i) => ({ order: i + 1, entries: [] }))
  )
  
  // 選手選択ダイアログ
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null)
  const [isPlayerDialogOpen, setIsPlayerDialogOpen] = useState(false)
  
  // 登録済み選手（データベースから取得）
  const [registeredPlayers, setRegisteredPlayers] = useState<Player[]>([])
  
  // 投手成績
  const [pitchers, setPitchers] = useState<PitcherResult[]>([])

  // 試合情報
  const [gameDate, setGameDate] = useState(new Date().toISOString().split("T")[0])
  const [opponent, setOpponent] = useState("")

  // 選手一覧を取得
  useEffect(() => {
    fetch("/api/players")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setRegisteredPlayers(data.map((p: { id: string; name: string; number?: number }) => ({
            id: p.id,
            name: p.name,
            number: p.number,
          })))
        }
      })
      .catch(console.error)
  }, [])

  // 保存処理
  const handleSave = async () => {
    if (!opponent.trim()) {
      alert("対戦相手を入力してください")
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/games", {
        method: "POST",
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
      router.push("/games")
    } catch (error) {
      console.error(error)
      alert("保存に失敗しました")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCellClick = (battingOrder: number, inning: number) => {
    setSelectedCell({ battingOrder, inning })
    setIsDialogOpen(true)
  }

  const handleSaveResult = (result: BattingResult) => {
    if (selectedCell) {
      const key = `${selectedCell.battingOrder}-${selectedCell.inning}`
      setResults((prev) => ({ ...prev, [key]: result }))
    }
    setIsDialogOpen(false)
    setSelectedCell(null)
  }

  const handleDeleteResult = () => {
    if (selectedCell) {
      const key = `${selectedCell.battingOrder}-${selectedCell.inning}`
      setResults((prev) => {
        const newResults = { ...prev }
        delete newResults[key]
        return newResults
      })
    }
    setIsDialogOpen(false)
    setSelectedCell(null)
  }

  const handleInningScoreChange = (inning: number, team: "our" | "opponent", value: number) => {
    setInningScores((prev) => {
      const newScores = [...prev]
      newScores[inning - 1] = { ...newScores[inning - 1], [team]: value }
      return newScores
    })
  }

  const handlePlayerClick = (order: number) => {
    setSelectedOrder(order)
    setIsPlayerDialogOpen(true)
  }

  const handleSaveLineup = (entries: LineupSlot["entries"]) => {
    if (selectedOrder === null) return
    setLineupSlots((prev) => {
      const newSlots = [...prev]
      const index = newSlots.findIndex((s) => s.order === selectedOrder)
      if (index >= 0) {
        newSlots[index] = { ...newSlots[index], entries }
      }
      return newSlots
    })
  }

  const handleAddBattingOrder = () => {
    const newOrder = maxBattingOrder + 1
    setMaxBattingOrder(newOrder)
    setLineupSlots((prev) => [...prev, { order: newOrder, entries: [] }])
  }

  const getExistingResult = (): BattingResult | undefined => {
    if (!selectedCell) return undefined
    const key = `${selectedCell.battingOrder}-${selectedCell.inning}`
    return results[key]
  }

  const getCurrentEntries = () => {
    if (selectedOrder === null) return []
    const slot = lineupSlots.find((s) => s.order === selectedOrder)
    return slot?.entries || []
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200">
      {/* ヘッダー */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-lg font-bold text-slate-800">試合結果入力</h1>
          </div>
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
      </header>

      <div className="mx-auto max-w-6xl space-y-4 p-4 md:p-6">
        
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
          onInningScoreChange={handleInningScoreChange} 
        />
        
        <BattingGrid 
          results={results} 
          onCellClick={handleCellClick}
          lineupSlots={lineupSlots}
          onPlayerClick={handlePlayerClick}
          onAddBattingOrder={handleAddBattingOrder}
          maxBattingOrder={maxBattingOrder}
        />

        <PitcherInput
          pitchers={pitchers}
          onPitchersChange={setPitchers}
          registeredPlayers={registeredPlayers}
        />

        <BattingInputDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          position={selectedCell}
          existingResult={getExistingResult()}
          onSave={handleSaveResult}
          onDelete={handleDeleteResult}
        />

        <PlayerSelectDialog
          open={isPlayerDialogOpen}
          onOpenChange={setIsPlayerDialogOpen}
          order={selectedOrder || 1}
          currentEntries={getCurrentEntries()}
          registeredPlayers={registeredPlayers}
          onSave={handleSaveLineup}
        />
      </div>
    </main>
  )
}
