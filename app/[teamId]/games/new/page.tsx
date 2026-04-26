"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Save, Loader2, Share2 } from "lucide-react"
import { BattingGrid } from "@/components/batting-grid"
import { BattingInputDialog } from "@/components/batting-input-dialog"
import { ScoreInput } from "@/components/score-input"
import { PlayerSelectDialog } from "@/components/player-select-dialog"
import { PitcherInput } from "@/components/pitcher-input"
import type { BattingResult, CellPosition, LineupSlot, InningScore, Player, PitcherResult } from "@/lib/batting-types"

export default function GameResultPage() {
  const params = useParams()
  const router = useRouter()
  const teamId = params.teamId as string
  
  const [isSaving, setIsSaving] = useState(false)
  const [isCreatingShareLink, setIsCreatingShareLink] = useState(false)
  const [results, setResults] = useState<Record<string, BattingResult>>({})
  const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  // イニングごとのスコア
  const [inningScores, setInningScores] = useState<InningScore[]>(
    Array(9).fill(null).map(() => ({ our: 0, opponent: 0 }))
  )
  
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
  const [isFirstBatting, setIsFirstBatting] = useState(true)
  const [totalInnings, setTotalInnings] = useState(9)

  // 選手一覧を取得
  useEffect(() => {
    fetch(`/api/players?teamId=${teamId}`)
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
  }, [teamId])

  // 共有リンク作成（試合を保存してから共有URLを発行）
  const handleCreateShareLink = async () => {
    if (!opponent.trim()) {
      alert("対戦相手を入力してください")
      return
    }

    setIsCreatingShareLink(true)
    try {
      // まず試合を保存
      const response = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId,
          date: gameDate,
          opponent,
          isFirstBatting,
          totalInnings,
          inningScores,
          lineupSlots,
          battingResults: results,
          pitchers,
        }),
      })

      if (!response.ok) {
        throw new Error("保存に失敗しました")
      }

      const data = await response.json()
      
      // 共有トークンを作成
      const tokenResponse = await fetch(`/api/games/${data.id}/share-token`, {
        method: "POST",
      })

      if (!tokenResponse.ok) {
        throw new Error("共有リンクの作成に失敗しました")
      }

      const tokenData = await tokenResponse.json()
      const shareUrl = `${window.location.origin}/share/${tokenData.token}`

      // クリップボードにコピー
      await navigator.clipboard.writeText(shareUrl)
      alert("共有リンクをコピーしました！LINEなどで共有してください。\n\n" + shareUrl)

      // 編集ページにリダイレクト
      router.push(`/${teamId}/games/${data.id}/edit`)
    } catch (error) {
      console.error(error)
      alert("共有リンクの作成に失敗しました")
    } finally {
      setIsCreatingShareLink(false)
    }
  }

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
          teamId,
          date: gameDate,
          opponent,
          isFirstBatting,
          totalInnings,
          inningScores,
          lineupSlots,
          battingResults: results,
          pitchers,
        }),
      })

      if (!response.ok) {
        throw new Error("保存に失敗しました")
      }

      const data = await response.json()
      
      // 作成した試合の編集ページにリダイレクト（共有URLを発行できるように）
      router.push(`/${teamId}/games/${data.id}/edit`)
    } catch (error) {
      console.error(error)
      alert("保存に失敗しました")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCellClick = (position: CellPosition) => {
    setSelectedCell(position)
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
    const newOrder = lineupSlots.length + 1
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
      <div className="mx-auto max-w-6xl space-y-4 p-4 md:p-6">
        {/* ページタイトルとボタン */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-slate-800">試合結果入力</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateShareLink}
              disabled={isCreatingShareLink || isSaving}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-md transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50"
            >
              {isCreatingShareLink ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Share2 className="h-4 w-4" />
              )}
              {isCreatingShareLink ? "作成中..." : "共有して入力"}
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || isCreatingShareLink}
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
          isFirstBatting={isFirstBatting}
          onFirstBattingChange={setIsFirstBatting}
          totalInnings={totalInnings}
          onTotalInningsChange={setTotalInnings}
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
