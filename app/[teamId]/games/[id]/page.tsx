"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Edit, Trash2, Loader2 } from "lucide-react"
import type { BattingResult } from "@/lib/batting-types"
import { getResultSummary, isHit, isOnBase } from "@/lib/batting-types"
import { cn } from "@/lib/utils"

interface GameDetail {
  game: {
    id: string
    date: string
    opponent: string
    location?: string
    memo?: string
    is_first_batting?: boolean
    total_innings?: number
    last_inning_x?: boolean
    last_inning_x_score?: number | null
  }
  inningScores: Array<{
    inning: number
    our_score: number
    opponent_score: number
  }>
  lineupEntries: Array<{
    batting_order: number
    player_name: string
    position?: string
    is_substitute: boolean
    entered_inning?: number
  }>
  battingResults: Array<{
    batting_order: number
    inning: number
    at_bat_sequence?: number
    hit_result: string
    direction?: string
    rbi_count: number
  }>
  pitcherResults: Array<{
    player_name: string
    innings_pitched: number
    hits: number
    runs: number
    earned_runs: number
    strikeouts: number
    walks: number
    hit_by_pitch: number
    home_runs: number
    is_win: boolean
    is_lose: boolean
    is_save: boolean
    is_hold: boolean
  }>
}

export default function GameDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const teamId = params.teamId as string
  const gameId = params.id as string
  const timestamp = searchParams.get("t") // キャッシュ無効化用
  
  const [data, setData] = useState<GameDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  const fetchData = useCallback(() => {
    setIsLoading(true)
    Promise.all([
      fetch(`/api/games/${gameId}`, { cache: "no-store" }).then((res) => res.json()),
      fetch(`/api/auth/status?teamId=${teamId}`, { cache: "no-store" }).then((res) => res.json()),
    ])
      .then(([gameData, authData]) => {
        setData(gameData)
        setIsAdmin(authData.isAdmin === true)
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [gameId, teamId, timestamp])

  // 初回読み込み＆タイムスタンプが変わった時に再取得
  useEffect(() => {
    fetchData()
  }, [fetchData, timestamp])

  // ブラウザの「戻る」操作でも再取得する（bfcache対応）
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        // bfcacheから復元された場合は再取得
        fetchData()
      }
    }
    window.addEventListener("pageshow", handlePageShow)
    return () => window.removeEventListener("pageshow", handlePageShow)
  }, [fetchData])

  const handleDelete = async () => {
    if (!confirm("この試合を削除しますか？")) return
    
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/games/${gameId}`, { method: "DELETE" })
      if (res.ok) {
        router.push(`/${teamId}/games`)
      } else {
        const errorData = await res.json()
        alert(errorData.error || "削除に失敗しました")
      }
    } catch {
      alert("削除に失敗しました")
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (!data || !data.game) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-b from-slate-100 to-slate-200">
        <p className="text-slate-600">試合が見つかりません</p>
        <Link href={`/${teamId}/games`} className="text-blue-600 hover:underline">
          試合一覧に戻る
        </Link>
      </div>
    )
  }

  const { game, inningScores, lineupEntries, battingResults, pitcherResults } = data

  const isFirstBatting = game.is_first_batting ?? true

  // イニング数はgame.total_inningsを優先（イニングスコアデータの数に関係なく）
  const totalInnings = game.total_innings || 9
  const maxInning = totalInnings

  // ✕ゲーム情報
  const hasX = game.last_inning_x ?? false
  const xScore = game.last_inning_x_score ?? null
  const xAdd = hasX ? (xScore ?? 0) : 0

  // スコア計算（✕の最終回をinning_scoresから除外してxAddで加算）
  const ourTotal =
    inningScores.filter(s => s.inning <= maxInning && !(hasX && !isFirstBatting && s.inning === maxInning)).reduce((sum, s) => sum + s.our_score, 0)
    + (!isFirstBatting ? xAdd : 0)
  const opponentTotal =
    inningScores.filter(s => s.inning <= maxInning && !(hasX && isFirstBatting && s.inning === maxInning)).reduce((sum, s) => sum + s.opponent_score, 0)
    + (isFirstBatting ? xAdd : 0)
  const isWin = ourTotal > opponentTotal
  const isLose = ourTotal < opponentTotal

  // 打順ごとにグループ化
  const lineupByOrder = new Map<number, typeof lineupEntries>()
  for (const entry of lineupEntries) {
    if (!lineupByOrder.has(entry.batting_order)) {
      lineupByOrder.set(entry.batting_order, [])
    }
    lineupByOrder.get(entry.batting_order)!.push(entry)
  }

  // 打撃結果をマップ化
  const resultsMap = new Map<string, typeof battingResults[0]>()
  const atBatSeqsMap: Record<number, number> = {}
  for (const result of battingResults) {
    const seq = result.at_bat_sequence ?? 1
    resultsMap.set(`${result.batting_order}-${result.inning}-${seq}`, result)
    if (!atBatSeqsMap[result.inning] || atBatSeqsMap[result.inning] < seq) {
      atBatSeqsMap[result.inning] = seq
    }
  }
  const maxOrder = Math.max(9, ...lineupEntries.map(e => e.batting_order))

  type AtBatColumn = { inning: number; sequence: number }
  const columns: AtBatColumn[] = []
  for (let i = 1; i <= maxInning; i++) {
    const maxSeq = atBatSeqsMap[i] ?? 1
    for (let s = 1; s <= maxSeq; s++) {
      columns.push({ inning: i, sequence: s })
    }
  }
  const lastColIndexByInning = new Map<number, number>()
  columns.forEach((col, idx) => {
    lastColIndexByInning.set(col.inning, idx)
  })

  type DisplayRow = {
    battingOrder: number
    playerName: string
    position: string | undefined
    activeFrom: number
    activeTo: number
    isStarter: boolean
    isFirstOfOrder: boolean
  }

  const displayRows: DisplayRow[] = []
  for (let order = 1; order <= maxOrder; order++) {
    const entries = lineupByOrder.get(order) ?? []
    const sorted = [...entries].sort((a, b) => {
      if (!a.is_substitute && b.is_substitute) return -1
      if (a.is_substitute && !b.is_substitute) return 1
      return (a.entered_inning ?? 1) - (b.entered_inning ?? 1)
    })
    if (sorted.length === 0) {
      displayRows.push({
        battingOrder: order,
        playerName: "-",
        position: undefined,
        activeFrom: 1,
        activeTo: maxInning,
        isStarter: false,
        isFirstOfOrder: true,
      })
      continue
    }
    sorted.forEach((entry, idx) => {
      const activeFrom = entry.is_substitute ? (entry.entered_inning ?? 1) : 1
      const activeTo = idx < sorted.length - 1
        ? (sorted[idx + 1].entered_inning ?? maxInning) - 1
        : maxInning
      displayRows.push({
        battingOrder: order,
        playerName: entry.player_name,
        position: entry.position,
        activeFrom,
        activeTo,
        isStarter: !entry.is_substitute,
        isFirstOfOrder: idx === 0,
      })
    })
  }

  // 投球回を整数と分数で表示
  const formatInnings = (innings: number) => {
    const whole = Math.floor(innings)
    const fraction = innings - whole
    if (fraction >= 0.005 && fraction < 0.02) return `${whole} 0/3`
    if (fraction < 0.17) return `${whole}`
    if (fraction < 0.5) return `${whole} 1/3`
    if (fraction < 0.84) return `${whole} 2/3`
    return `${whole + 1}`
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200">
      <div className="mx-auto max-w-6xl space-y-4 p-4 md:p-6">
        {/* アクションバー */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-slate-800">試合結果</h1>
          {isAdmin && (
            <div className="flex items-center gap-2">
              <Link
                href={`/${teamId}/games/${gameId}/edit`}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-md transition-all hover:bg-blue-700"
              >
                <Edit className="h-4 w-4" />
                編集
              </Link>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-md transition-all hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                削除
              </button>
            </div>
          )}
        </div>
        {/* 試合情報 */}
        <div className="rounded-2xl bg-white p-4 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">{game.date}</p>
              <p className="text-xl font-bold text-slate-800">vs {game.opponent}</p>
              {game.location && <p className="text-sm text-slate-500">{game.location}</p>}
            </div>
            <div className="text-right">
              <div className={cn(
                "text-3xl font-bold",
                isWin ? "text-blue-600" : isLose ? "text-red-600" : "text-slate-600"
              )}>
                {ourTotal} - {opponentTotal}
              </div>
              <span className={cn(
                "rounded-full px-3 py-1 text-sm font-bold",
                isWin ? "bg-blue-100 text-blue-700" : isLose ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"
              )}>
                {isWin ? "勝利" : isLose ? "敗戦" : "引分"}
              </span>
            </div>
          </div>
          {game.memo && (
            <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600 border-t border-slate-100 pt-3">{game.memo}</p>
          )}
        </div>

        {/* スコアボード */}
        <div className="rounded-2xl bg-white p-4 shadow-lg">
          <h2 className="mb-3 text-sm font-bold text-slate-600">スコアボード</h2>
          <div className="overflow-x-auto">
            <table className="text-center text-sm border-collapse" style={{ minWidth: `${Math.max(300, 80 + maxInning * 32 + 48)}px` }}>
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="sticky left-0 z-10 bg-slate-50 w-20 min-w-[80px] px-2 py-1 text-left"></th>
                  {Array.from({ length: maxInning }, (_, i) => (
                    <th key={i} className="w-8 min-w-[32px] px-1 py-1">{i + 1}</th>
                  ))}
                  <th className="sticky right-0 z-10 bg-slate-100 w-12 min-w-[48px] px-2 py-1 font-bold">計</th>
                </tr>
              </thead>
              <tbody>
                {/* 先攻チーム */}
                <tr className="border-b">
                  <td className={cn(
                    "sticky left-0 z-10 w-20 min-w-[80px] px-2 py-2 text-left font-bold whitespace-nowrap",
                    isFirstBatting ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-700"
                  )}>
                    {isFirstBatting ? "自チーム" : game.opponent}
                  </td>
                  {Array.from({ length: maxInning }, (_, i) => {
                    const inning = i + 1
                    const score = inningScores.find(s => s.inning === inning)
                    const val = isFirstBatting ? (score?.our_score ?? 0) : (score?.opponent_score ?? 0)
                    return (
                      <td key={i} className={cn(
                        "w-8 min-w-[32px] px-1 py-2",
                        val > 0 && (isFirstBatting ? "text-blue-700 font-bold" : "text-red-700 font-bold")
                      )}>
                        {val}
                      </td>
                    )
                  })}
                  <td className={cn(
                    "sticky right-0 z-10 w-12 min-w-[48px] px-2 py-2 font-bold",
                    isFirstBatting ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
                  )}>
                    {isFirstBatting ? ourTotal : opponentTotal}
                  </td>
                </tr>
                {/* 後攻チーム */}
                <tr>
                  <td className={cn(
                    "sticky left-0 z-10 w-20 min-w-[80px] px-2 py-2 text-left font-bold whitespace-nowrap truncate max-w-[80px]",
                    isFirstBatting ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"
                  )}>
                    {isFirstBatting ? game.opponent : "自チーム"}
                  </td>
                  {Array.from({ length: maxInning }, (_, i) => {
                    const inning = i + 1
                    const score = inningScores.find(s => s.inning === inning)
                    const isXCell = hasX && inning === maxInning
                    if (isXCell) {
                      return (
                        <td key={i} className="w-8 min-w-[32px] px-1 py-2 font-bold text-amber-700">
                          {xScore === null ? "✕" : `${xScore}✕`}
                        </td>
                      )
                    }
                    const val = isFirstBatting ? (score?.opponent_score ?? 0) : (score?.our_score ?? 0)
                    return (
                      <td key={i} className={cn(
                        "w-8 min-w-[32px] px-1 py-2",
                        val > 0 && (isFirstBatting ? "text-red-700 font-bold" : "text-blue-700 font-bold")
                      )}>
                        {val}
                      </td>
                    )
                  })}
                  <td className={cn(
                    "sticky right-0 z-10 w-12 min-w-[48px] px-2 py-2 font-bold",
                    isFirstBatting ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                  )}>
                    {isFirstBatting ? opponentTotal : ourTotal}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 打撃結果一覧 */}
        <div className="rounded-2xl bg-white shadow-lg overflow-hidden">
          <h2 className="px-4 py-3 text-sm font-bold text-slate-600 border-b border-slate-200 bg-slate-50">打撃成績</h2>
          <div className="relative overflow-x-auto">
            <table className="text-center text-sm border-collapse" style={{ minWidth: `${Math.max(400, 176 + columns.length * 56)}px` }}>
              <thead>
                <tr className="border-b bg-slate-100">
                  <th className="sticky left-0 z-20 bg-slate-100 w-10 min-w-[40px] px-2 py-2 text-center border-r border-slate-200">打順</th>
                  <th className="sticky left-10 z-20 bg-slate-100 w-10 min-w-[40px] px-1 py-2 text-center border-r border-slate-200">守</th>
                  <th className="sticky left-20 z-20 bg-slate-100 w-24 min-w-[96px] px-2 py-2 text-left border-r border-slate-200">選手</th>
                  {columns.map((col, idx) => {
                    const isLastOfInning = lastColIndexByInning.get(col.inning) === idx
                    return (
                      <th
                        key={`${col.inning}-${col.sequence}`}
                        className={cn(
                          "px-1 py-2",
                          col.sequence === 1 ? "w-14 min-w-[56px]" : "w-10 min-w-[40px]",
                          isLastOfInning && "border-r border-slate-200"
                        )}
                      >
                        {col.sequence === 1
                          ? col.inning
                          : <span className="text-slate-400 text-[10px]">{["②", "③", "④", "⑤"][col.sequence - 2] ?? col.sequence}</span>
                        }
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row) => {
                  return (
                    <tr
                      key={`${row.battingOrder}-${row.activeFrom}`}
                      className="border-b hover:bg-slate-50/50"
                    >
                      <td className="sticky left-0 z-10 bg-white w-10 min-w-[40px] px-2 py-2 text-center font-bold border-r border-slate-100">
                        {row.isStarter ? `(${row.battingOrder})` : row.battingOrder}
                      </td>
                      <td className="sticky left-10 z-10 bg-white w-10 min-w-[40px] px-1 py-2 text-slate-500 text-center border-r border-slate-100">
                        {row.position ?? "-"}
                      </td>
                      <td className="sticky left-20 z-10 bg-white w-24 min-w-[96px] px-2 py-2 text-left border-r border-slate-100">
                        <div className="truncate">{row.playerName}</div>
                      </td>
                      {columns.map((col, idx) => {
                        const isActive = col.inning >= row.activeFrom && col.inning <= row.activeTo
                        const isLastOfInning = lastColIndexByInning.get(col.inning) === idx
                        const cellClass = cn(
                          col.sequence === 1 ? "w-14 min-w-[56px]" : "w-10 min-w-[40px]",
                          "px-1 py-2",
                          isLastOfInning && "border-r border-slate-100"
                        )
                        if (!isActive) {
                          return (
                            <td key={`${col.inning}-${col.sequence}`} className={cn(cellClass, "text-slate-300")}>-</td>
                          )
                        }
                        const result = resultsMap.get(`${row.battingOrder}-${col.inning}-${col.sequence}`)
                        if (!result) {
                          return <td key={`${col.inning}-${col.sequence}`} className={cn(cellClass, "text-slate-300")}>-</td>
                        }
                        const resultObj: BattingResult = {
                          hitResult: result.hit_result as BattingResult["hitResult"],
                          direction: result.direction as BattingResult["direction"],
                          rbiCount: result.rbi_count,
                        }
                        const summary = getResultSummary(resultObj)
                        const hit = isHit(result.hit_result as BattingResult["hitResult"])
                        const onBase = isOnBase(result.hit_result as BattingResult["hitResult"])
                        return (
                          <td
                            key={`${col.inning}-${col.sequence}`}
                            className={cn(
                              cellClass,
                              "text-xs font-medium whitespace-nowrap",
                              hit && "text-green-700 bg-green-50",
                              !hit && onBase && "text-blue-700 bg-blue-50",
                              !hit && !onBase && "text-slate-600"
                            )}
                          >
                            {summary}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 投手成績 */}
        <div className="rounded-2xl bg-white shadow-lg overflow-hidden">
          <h2 className="px-4 py-3 text-sm font-bold text-slate-600 border-b border-slate-200 bg-slate-50">投手成績</h2>
          {pitcherResults.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-center text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="px-2 py-2 text-left">投手</th>
                    <th className="px-2 py-2">投球回</th>
                    <th className="px-2 py-2">被安打</th>
                    <th className="px-2 py-2">奪三振</th>
                    <th className="px-2 py-2">四球</th>
                    <th className="px-2 py-2">失点</th>
                    <th className="px-2 py-2">自責</th>
                    <th className="px-2 py-2">記録</th>
                  </tr>
                </thead>
                <tbody>
                  {pitcherResults.map((pitcher, index) => (
                    <tr key={index} className="border-b">
                      <td className="px-2 py-2 text-left font-medium">{pitcher.player_name}</td>
                      <td className="px-2 py-2">{formatInnings(pitcher.innings_pitched)}</td>
                      <td className="px-2 py-2">{pitcher.hits}</td>
                      <td className="px-2 py-2">{pitcher.strikeouts}</td>
                      <td className="px-2 py-2">{pitcher.walks}</td>
                      <td className="px-2 py-2">{pitcher.runs}</td>
                      <td className="px-2 py-2">{pitcher.earned_runs}</td>
                      <td className="px-2 py-2">
                        {pitcher.is_win && <span className="rounded bg-blue-100 px-1 text-blue-700">勝</span>}
                        {pitcher.is_lose && <span className="rounded bg-red-100 px-1 text-red-700">敗</span>}
                        {pitcher.is_save && <span className="rounded bg-green-100 px-1 text-green-700">S</span>}
                        {pitcher.is_hold && <span className="rounded bg-purple-100 px-1 text-purple-700">H</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="p-4 py-8 text-center text-slate-400">投手成績が登録されていません</p>
          )}
        </div>

      </div>
    </main>
  )
}
