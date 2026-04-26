"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Save } from "lucide-react"
import { BattingGrid } from "@/components/batting-grid"
import { BattingInputDialog } from "@/components/batting-input-dialog"
import { ScoreInput } from "@/components/score-input"
import { PlayerSelectDialog } from "@/components/player-select-dialog"
import { PitcherInput } from "@/components/pitcher-input"
import type { BattingResult, CellPosition, LineupSlot, InningScore, Player, PitcherResult } from "@/lib/batting-types"

export default function GameResultPage() {
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
  
  // 登録済み選手（将来用：データベースから取得）
  const [registeredPlayers] = useState<Player[]>([])
  
  // 投手成績
  const [pitchers, setPitchers] = useState<PitcherResult[]>([])

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
            onClick={() => {
              // TODO: 保存処理
              alert("保存機能は今後実装予定です")
            }}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-md transition-all hover:bg-blue-700 active:scale-[0.98]"
          >
            <Save className="h-4 w-4" />
            保存
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-4 p-4 md:p-6">
        
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
