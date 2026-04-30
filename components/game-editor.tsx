"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Loader2, CheckCircle2, AlertCircle, Share2, Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { BattingGrid } from "@/components/batting-grid"
import { BattingInputDialog } from "@/components/batting-input-dialog"
import { ScoreInput } from "@/components/score-input"
import { PlayerSelectDialog } from "@/components/player-select-dialog"
import { PitcherInput } from "@/components/pitcher-input"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import type { BattingResult, CellPosition, LineupSlot, InningScore, Player, PitcherResult, HitResult, HitDirection, FieldPosition } from "@/lib/batting-types"

interface GameEditorProps {
  gameId: string
  teamId: string
  shareToken?: string  // 共有URLの場合のトークン
  isAdmin: boolean     // 管理者かどうか
  onBack?: () => void  // 戻るボタンのコールバック
}

type SaveStatus = "idle" | "saving" | "saved" | "error"

const POLLING_INTERVAL_MS = 15_000

export function GameEditor({ gameId, teamId, shareToken, isAdmin, onBack }: GameEditorProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 試合情報
  const [gameDate, setGameDate] = useState("")
  const [opponent, setOpponent] = useState("")
  const [location, setLocation] = useState("")
  const [memo, setMemo] = useState("")
  const [isFirstBatting, setIsFirstBatting] = useState(true)
  const [totalInnings, setTotalInnings] = useState(9)
  const [hasX, setHasX] = useState(false)
  const [xScore, setXScore] = useState<number | null>(null)

  // 打撃結果
  const [results, setResults] = useState<Record<string, BattingResult>>({})
  const [atBatSequences, setAtBatSequences] = useState<Record<number, number>>({})
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

  // 共有URL関連
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [generatedShareToken, setGeneratedShareToken] = useState<string | null>(null)
  const [shareTokenExpiry, setShareTokenExpiry] = useState<string | null>(null)
  const [isGeneratingToken, setIsGeneratingToken] = useState(false)
  const [urlCopied, setUrlCopied] = useState(false)

  // ポーリング用 ref（stale closure 回避）
  const lastLocalEditTimeRef = useRef<number>(0)
  const saveStatusRef = useRef<SaveStatus>("idle")
  const dialogOpenRef = useRef(false)
  const playerDialogOpenRef = useRef(false)

  useEffect(() => { saveStatusRef.current = saveStatus }, [saveStatus])
  useEffect(() => { dialogOpenRef.current = dialogOpen }, [dialogOpen])
  useEffect(() => { playerDialogOpenRef.current = playerDialogOpen }, [playerDialogOpen])

  // 保存ステータスの自動リセット
  useEffect(() => {
    if (saveStatus === "saved" || saveStatus === "error") {
      const timer = setTimeout(() => {
        setSaveStatus("idle")
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [saveStatus])

  // APIリクエストの共通ヘルパー
  const apiRequest = useCallback(async (url: string, method: string, body?: Record<string, unknown>) => {
    const requestBody = shareToken ? { ...body, shareToken } : body
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    })
    if (!response.ok) {
      throw new Error("API request failed")
    }
    return response.json()
  }, [shareToken])

  // APIレスポンスを state に適用する（初回ロード・ポーリング共用）
  const applyGameData = useCallback((gameData: {
    game?: { date: string; opponent: string; location: string; memo: string; is_first_batting: boolean; total_innings: number }
    inningScores?: { inning: number; our_score: number; opponent_score: number }[]
    lineupEntries?: { batting_order: number; player_id: string; player_name: string; position: string; is_substitute: boolean; entered_inning?: number; is_helper: boolean }[]
    battingResults?: { batting_order: number; inning: number; at_bat_sequence?: number; hit_result: string; direction: string; rbi_count: number; scored?: boolean; runner_first: boolean; runner_second: boolean; runner_third: boolean; stolen_second: boolean; stolen_third: boolean; stolen_home: boolean }[]
    pitcherResults?: { player_id?: string; player_name: string; innings_outs: number; is_mid_inning_exit: boolean; hits: number; runs: number; earned_runs: number; strikeouts: number; walks: number; hit_by_pitch: number; home_runs: number; pitch_count?: number; is_win: boolean; is_lose: boolean; is_save: boolean; is_hold: boolean; is_helper?: boolean }[]
  }) => {
    if (gameData.game) {
      setGameDate(gameData.game.date || "")
      setOpponent(gameData.game.opponent || "")
      setLocation(gameData.game.location || "")
      setMemo(gameData.game.memo || "")
      setIsFirstBatting(gameData.game.is_first_batting ?? true)
      setTotalInnings(gameData.game.total_innings ?? 9)
    }

    if (gameData.inningScores) {
      const numInnings = gameData.game?.total_innings ?? 9
      const scores: InningScore[] = Array.from({ length: numInnings }, () => ({ our: 0, opponent: 0 }))
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
          position: entry.position as FieldPosition | undefined,
          isSubstitute: entry.is_substitute,
          enteredInning: entry.entered_inning,
          isHelper: entry.is_helper,
        })
      }

      const maxOrder = Math.max(9, ...gameData.lineupEntries.map((e) => e.batting_order))
      const newSlots: LineupSlot[] = Array.from({ length: maxOrder }, (_, i) =>
        slots.get(i + 1) || { order: i + 1, entries: [] }
      )
      setLineupSlots(newSlots)
    }

    if (gameData.battingResults) {
      const newResults: Record<string, BattingResult> = {}
      const newAtBatSeqs: Record<number, number> = {}
      for (const result of gameData.battingResults) {
        const seq = result.at_bat_sequence ?? 1
        const key = `${result.batting_order}-${result.inning}-${seq}`
        newResults[key] = {
          hitResult: result.hit_result as HitResult,
          direction: result.direction as HitDirection | undefined,
          rbiCount: result.rbi_count,
          scored: result.scored || false,
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
        if (!newAtBatSeqs[result.inning] || newAtBatSeqs[result.inning] < seq) {
          newAtBatSeqs[result.inning] = seq
        }
      }
      setResults(newResults)
      setAtBatSequences(newAtBatSeqs)
    }

    if (gameData.pitcherResults) {
      setPitchers(gameData.pitcherResults.map((p) => ({
        playerId: p.player_id || "",
        playerName: p.player_name,
        outsPitched: p.innings_outs,
        isMidInningExit: p.is_mid_inning_exit,
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
        isHelper: p.is_helper || false,
      })))
    }
  }, [])

  // データを読み込み
  useEffect(() => {
    Promise.all([
      fetch(`/api/games/${gameId}`).then(res => res.json()),
      fetch(`/api/players?teamId=${teamId}`).then(res => res.json()),
    ])
      .then(([gameData, playersData]) => {
        applyGameData(gameData)
        if (gameData.game) {
          setHasX(gameData.game.last_inning_x ?? false)
          setXScore(gameData.game.last_inning_x_score ?? null)
        }

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
  }, [gameId, teamId, applyGameData])

  // 定期的に最新データを取得して反映（複数人同時編集対応）
  useEffect(() => {
    if (isLoading) return

    const id = setInterval(async () => {
      if (
        Date.now() - lastLocalEditTimeRef.current < 5000 ||
        dialogOpenRef.current ||
        playerDialogOpenRef.current ||
        saveStatusRef.current === "saving"
      ) return

      try {
        const res = await fetch(`/api/games/${gameId}`)
        if (!res.ok) return
        applyGameData(await res.json())
      } catch {
        // ポーリング失敗はサイレントに無視
      }
    }, POLLING_INTERVAL_MS)

    return () => clearInterval(id)
  }, [isLoading, gameId, applyGameData])

  // 打撃結果を都度保存
  const handleResultSave = async (result: BattingResult) => {
    if (!selectedCell) return

    const key = `${selectedCell.battingOrder}-${selectedCell.inning}-${selectedCell.atBatSequence}`
    setResults((prev) => ({
      ...prev,
      [key]: result,
    }))
    setDialogOpen(false)

    // APIで保存
    setSaveStatus("saving")
    try {
      await apiRequest(`/api/games/${gameId}/batting-result`, "POST", {
        battingOrder: selectedCell.battingOrder,
        inning: selectedCell.inning,
        atBatSequence: selectedCell.atBatSequence,
        result,
      })
      setSaveStatus("saved")
    } catch {
      setSaveStatus("error")
    }
  }

  // 打撃結果を削除
  const handleResultDelete = async () => {
    if (!selectedCell) return

    const key = `${selectedCell.battingOrder}-${selectedCell.inning}-${selectedCell.atBatSequence}`
    setResults((prev) => {
      const newResults = { ...prev }
      delete newResults[key]
      return newResults
    })
    setDialogOpen(false)

    // APIで削除
    setSaveStatus("saving")
    try {
      await apiRequest(
        `/api/games/${gameId}/batting-result?battingOrder=${selectedCell.battingOrder}&inning=${selectedCell.inning}&atBatSequence=${selectedCell.atBatSequence}${shareToken ? `&shareToken=${shareToken}` : ""}`,
        "DELETE"
      )
      setSaveStatus("saved")
    } catch {
      setSaveStatus("error")
    }
  }

  // イニングスコアを都度保存
  const handleScoresChange = useCallback((newScores: InningScore[]) => {
    setInningScores(newScores)
    lastLocalEditTimeRef.current = Date.now()

    // 変更があったイニングを特定して保存
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(async () => {
      setSaveStatus("saving")
      try {
        // すべてのイニングを保存（差分検出は複雑になるため）
        for (let i = 0; i < newScores.length; i++) {
          await apiRequest(`/api/games/${gameId}/inning-score`, "POST", {
            inning: i + 1,
            ourScore: newScores[i].our,
            opponentScore: newScores[i].opponent,
          })
        }
        setSaveStatus("saved")
      } catch {
        setSaveStatus("error")
      }
    }, 500) // デバウンス
  }, [apiRequest, gameId])

  // 打順を都度保存
  const handleLineupSave = async (entries: LineupSlot["entries"]) => {
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

    // APIで保存
    setSaveStatus("saving")
    try {
      await apiRequest(`/api/games/${gameId}/lineup`, "POST", {
        battingOrder: selectedLineupOrder,
        entries,
      })
      setSaveStatus("saved")
    } catch {
      setSaveStatus("error")
    }
  }

  // 投手成績を都度保存
  const handlePitchersChange = async (newPitchers: PitcherResult[]) => {
    setPitchers(newPitchers)

    // APIで保存
    setSaveStatus("saving")
    try {
      await apiRequest(`/api/games/${gameId}/pitchers`, "POST", {
        pitchers: newPitchers,
      })
      setSaveStatus("saved")
    } catch {
      setSaveStatus("error")
    }
  }

  // 試合情報を都度保存
  const handleGameInfoChange = useCallback((field: "date" | "opponent" | "location" | "memo" | "isFirstBatting" | "totalInnings", value: string | boolean | number) => {
    lastLocalEditTimeRef.current = Date.now()
    if (field === "date") {
      setGameDate(value as string)
    } else if (field === "opponent") {
      setOpponent(value as string)
    } else if (field === "location") {
      setLocation(value as string)
    } else if (field === "memo") {
      setMemo(value as string)
    } else if (field === "isFirstBatting") {
      setIsFirstBatting(value as boolean)
    } else if (field === "totalInnings") {
      setTotalInnings(value as number)
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(async () => {
      setSaveStatus("saving")
      try {
        await apiRequest(`/api/games/${gameId}/info`, "POST", {
          [field]: value,
        })
        setSaveStatus("saved")
      } catch {
        setSaveStatus("error")
      }
    }, 500)
  }, [apiRequest, gameId])

  // ✕ゲーム設定を都度保存
  const handleXChange = useCallback((newHasX: boolean, newXScore: number | null) => {
    setHasX(newHasX)
    setXScore(newXScore)

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(async () => {
      setSaveStatus("saving")
      try {
        await apiRequest(`/api/games/${gameId}/info`, "POST", {
          lastInningX: newHasX,
          lastInningXScore: newHasX ? newXScore : null,
        })
        setSaveStatus("saved")
      } catch {
        setSaveStatus("error")
      }
    }, 500)
  }, [apiRequest, gameId])

  const handleCellClick = (position: CellPosition) => {
    setSelectedCell(position)
    setDialogOpen(true)
  }

  const handlePlayerClick = (order: number) => {
    setSelectedLineupOrder(order)
    setPlayerDialogOpen(true)
  }

  const handleAddBattingOrder = () => {
    const newOrder = lineupSlots.length + 1
    setLineupSlots((prev) => [...prev, { order: newOrder, entries: [] }])
  }

  const handleAddAtBat = (inning: number) => {
    setAtBatSequences((prev) => ({
      ...prev,
      [inning]: (prev[inning] ?? 1) + 1,
    }))
  }

  const handleRemoveAtBat = async (inning: number) => {
    const seq = atBatSequences[inning] ?? 1
    if (seq <= 1) return

    // 削除対象の打席結果キーを収集
    const keysToDelete: { order: number; key: string }[] = []
    for (let order = 1; order <= lineupSlots.length; order++) {
      const key = `${order}-${inning}-${seq}`
      if (results[key]) keysToDelete.push({ order, key })
    }

    // ローカル state から削除
    setResults((prev) => {
      const next = { ...prev }
      for (const { key } of keysToDelete) delete next[key]
      return next
    })
    setAtBatSequences((prev) => {
      const next = { ...prev }
      if (seq <= 2) delete next[inning]
      else next[inning] = seq - 1
      return next
    })

    // DB から削除
    if (keysToDelete.length === 0) return
    setSaveStatus("saving")
    try {
      await Promise.all(
        keysToDelete.map(({ order }) =>
          apiRequest(
            `/api/games/${gameId}/batting-result?battingOrder=${order}&inning=${inning}&atBatSequence=${seq}${shareToken ? `&shareToken=${shareToken}` : ""}`,
            "DELETE"
          )
        )
      )
      setSaveStatus("saved")
    } catch {
      setSaveStatus("error")
    }
  }

  // 共有URLを生成
  const handleGenerateShareUrl = async (): Promise<string | null> => {
    setIsGeneratingToken(true)
    try {
      const response = await fetch(`/api/games/${gameId}/share-token`, {
        method: "POST",
      })
      const data = await response.json()
      if (data.token) {
        setGeneratedShareToken(data.token)
        setShareTokenExpiry(data.expiresAt)
        return data.token
      }
    } catch (err) {
      console.error("Failed to generate share URL:", err)
    } finally {
      setIsGeneratingToken(false)
    }
    return null
  }

  const getShareUrl = () => {
    if (typeof window === "undefined") return ""
    return `${window.location.origin}/share/${generatedShareToken}`
  }

  const copyUrlToClipboard = async (token: string) => {
    if (typeof window === "undefined") return
    const url = `${window.location.origin}/share/${token}`
    await navigator.clipboard.writeText(url)
    setUrlCopied(true)
    setTimeout(() => setUrlCopied(false), 2000)
  }

  const handleCopyShareUrl = async () => {
    if (!generatedShareToken) return
    await copyUrlToClipboard(generatedShareToken)
  }

  const handleShareButtonClick = async () => {
    setShareDialogOpen(true)
    const token = generatedShareToken ?? (await handleGenerateShareUrl())
    if (token) await copyUrlToClipboard(token)
  }

  const currentResult = selectedCell
    ? results[`${selectedCell.battingOrder}-${selectedCell.inning}-${selectedCell.atBatSequence}`]
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
        {/* ページタイトルとステータス */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="rounded-lg bg-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-300"
              >
                戻る
              </button>
            )}
            <h1 className="text-lg font-bold text-slate-800">
              {shareToken ? "試合結果入力" : "試合結果編集"}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            {/* 共有ボタン（管理者のみ） */}
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareButtonClick}
                className="gap-2 bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
              >
                <Share2 className="h-4 w-4" />
                みんなで入力
              </Button>
            )}
          </div>
        </div>

        {/* 共有URLの場合の注意書き */}
        {shareToken && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            共有URLからの入力です。入力内容は自動的に保存されます。
          </div>
        )}

        {/* 試合情報 */}
        <div className="rounded-2xl bg-white p-4 shadow-lg">
          <h2 className="mb-3 text-sm font-bold text-slate-600">試合情報</h2>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600">日付</label>
              <input
                type="date"
                value={gameDate}
                onChange={(e) => handleGameInfoChange("date", e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-1 items-center gap-2">
              <label className="text-sm text-slate-600">対戦相手</label>
              <input
                type="text"
                value={opponent}
                onChange={(e) => handleGameInfoChange("opponent", e.target.value)}
                placeholder="チーム名を入力"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-1 items-center gap-2">
              <label className="text-sm text-slate-600 whitespace-nowrap">球場</label>
              <input
                type="text"
                value={location}
                onChange={(e) => handleGameInfoChange("location", e.target.value)}
                placeholder="球場名を入力"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="mb-1 block text-sm text-slate-600">メモ</label>
            <textarea
              value={memo}
              onChange={(e) => handleGameInfoChange("memo", e.target.value)}
              placeholder="試合のメモを入力"
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>
        
        <ScoreInput
          inningScores={inningScores}
          onScoresChange={handleScoresChange}
          isFirstBatting={isFirstBatting}
          onFirstBattingChange={(value) => handleGameInfoChange("isFirstBatting", value)}
          totalInnings={totalInnings}
          hasX={hasX}
          xScore={xScore}
          onXChange={handleXChange}
          onTotalInningsChange={(value) => {
            handleGameInfoChange("totalInnings", value)
            // イニングスコア配列も調整
            if (value > inningScores.length) {
              const newScores = [...inningScores]
              while (newScores.length < value) {
                newScores.push({ our: 0, opponent: 0 })
              }
              setInningScores(newScores)
            } else if (value < inningScores.length) {
              // イニング数を減らす場合はスコア配列を縮小
              setInningScores(inningScores.slice(0, value))
            }
          }}
        />

        <BattingGrid
          results={results}
          onCellClick={handleCellClick}
          lineupSlots={lineupSlots}
          onPlayerClick={handlePlayerClick}
          onAddBattingOrder={handleAddBattingOrder}
          totalInnings={totalInnings}
          atBatSequences={atBatSequences}
          onAddAtBat={handleAddAtBat}
          onRemoveAtBat={handleRemoveAtBat}
        />

        <PitcherInput
          pitchers={pitchers}
          onPitchersChange={handlePitchersChange}
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

      {/* 共有URLダイアログ */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              みんなで入力
            </DialogTitle>
            <DialogDescription>
              このURLを共有すると、複数人で一緒に試合結果を入力できます。URLは24時間有効です。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {isGeneratingToken ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : generatedShareToken ? (
              <>
                <div className="space-y-1.5">
                  <div className="text-xs text-slate-500">共有URL</div>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={getShareUrl()}
                      className="font-mono text-xs"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyShareUrl}
                      className={urlCopied ? "shrink-0 text-emerald-600 border-emerald-300" : "shrink-0"}
                    >
                      {urlCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {shareTokenExpiry && (
                  <div className="text-xs text-slate-500">
                    有効期限: {new Date(shareTokenExpiry).toLocaleString("ja-JP")}
                  </div>
                )}

                <Button
                  variant="outline"
                  className="w-full gap-2 border-[#06C755] text-[#06C755] hover:bg-[#06C755]/10"
                  asChild
                >
                  <a
                    href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(getShareUrl())}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    LINEで共有
                  </a>
                </Button>

                <div className="text-xs text-slate-500 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  このURLを知っている人は誰でも試合結果を入力できます。LINE等で共有する際はご注意ください。
                </div>
              </>
            ) : (
              <div className="text-center py-4 text-slate-500">
                URLの生成に失敗しました
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* トースト風の保存ステータス */}
      {saveStatus !== "idle" && (
        <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg text-sm font-medium",
            saveStatus === "saving" && "bg-blue-500 text-white",
            saveStatus === "saved" && "bg-emerald-500 text-white",
            saveStatus === "error" && "bg-red-500 text-white",
          )}>
            {saveStatus === "saving" && <Loader2 className="h-4 w-4 animate-spin" />}
            {saveStatus === "saved" && <CheckCircle2 className="h-4 w-4" />}
            {saveStatus === "error" && <AlertCircle className="h-4 w-4" />}
            <span>
              {saveStatus === "saving" && "保存中..."}
              {saveStatus === "saved" && "保存しました"}
              {saveStatus === "error" && "保存に失敗しました"}
            </span>
          </div>
        </div>
      )}
    </main>
  )
}
