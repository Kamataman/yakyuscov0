import type { GameForScore, InningScoreLike } from "@/lib/game-score"

export type GameInconsistencyKind = "runs" | "rbi" | "opponentRuns"

export interface GameInconsistency {
  kind: GameInconsistencyKind
  inning: number | null // イニング単位で判定できない場合（投手の集約入力）は null
  message: string
}

// 検証に必要な打撃結果のフィールドのみを持つ型
export interface BattingResultForValidation {
  inning: number
  rbiCount: number
  scored?: boolean
}

// 検証に必要な投手成績のフィールドのみを持つ型
export interface PitcherResultForValidation {
  runs: number
  inningStats?: { inning: number; runs: number }[]
}

interface InningRuns {
  inning: number
  our: number
  opponent: number
}

// イニングごとの得点。total_innings（延長短縮後の実イニング数）と
// last_inning_x（サヨナラ・コールド等での最終回未実施側の✕）を calculateGameTotals と同じ扱いで解決する
function resolveInningRuns(game: GameForScore, inningScores: InningScoreLike[]): InningRuns[] {
  const maxInning = game.total_innings || 9
  const isFirstBatting = game.is_first_batting ?? true
  const hasX = game.last_inning_x ?? false
  const xAdd = hasX ? (game.last_inning_x_score ?? 0) : 0
  const byInning = new Map(inningScores.map((score) => [score.inning, score]))

  const rows: InningRuns[] = []
  for (let inning = 1; inning <= maxInning; inning++) {
    const score = byInning.get(inning)
    const isXInning = hasX && inning === maxInning
    rows.push({
      inning,
      our: isXInning && !isFirstBatting ? xAdd : (score?.our_score || 0),
      opponent: isXInning && isFirstBatting ? xAdd : (score?.opponent_score || 0),
    })
  }
  return rows
}

function sumByInning<T>(items: T[], inningOf: (item: T) => number, valueOf: (item: T) => number): Map<number, number> {
  const map = new Map<number, number>()
  for (const item of items) {
    const inning = inningOf(item)
    map.set(inning, (map.get(inning) ?? 0) + valueOf(item))
  }
  return map
}

// 試合1件分のデータから、イニングごとにスコアと打撃・投手成績の不整合を検出する。
// 1件の不整合＝1件の警告として、イニング単位で返す。
// 助っ人の記録も検証対象に含める（除外するとスコアと合わなくなるため）。
export function detectGameInconsistencies(
  game: GameForScore,
  inningScores: InningScoreLike[],
  battingResults: BattingResultForValidation[],
  pitchers: PitcherResultForValidation[]
): GameInconsistency[] {
  const inningRuns = resolveInningRuns(game, inningScores)
  const inconsistencies: GameInconsistency[] = []

  const scoredByInning = sumByInning(battingResults, (r) => r.inning, (r) => (r.scored ? 1 : 0))
  const rbiByInning = sumByInning(battingResults, (r) => r.inning, (r) => r.rbiCount || 0)

  // 相手得点 vs 投手の失点。全投手がイニング入力ならイニングごとに、
  // 集約入力が混ざる場合はイニングに割り振れないため合計で比較する
  const hasAllInningStats = pitchers.length > 0 && pitchers.every((p) => (p.inningStats?.length ?? 0) > 0)
  const runsAllowedByInning = sumByInning(
    pitchers.flatMap((pitcher) => pitcher.inningStats ?? []),
    (stat) => stat.inning,
    (stat) => stat.runs || 0
  )

  for (const row of inningRuns) {
    // 自チーム得点 vs 生還記録
    const scored = scoredByInning.get(row.inning) ?? 0
    if (scored !== row.our) {
      inconsistencies.push({
        kind: "runs",
        inning: row.inning,
        message: `${row.inning}回: 得点${row.our}点に対し生還${scored}人`,
      })
    }

    // 打点の上限（エラーや暴投による得点があるため、下回るのは正常）
    const rbi = rbiByInning.get(row.inning) ?? 0
    if (rbi > row.our) {
      inconsistencies.push({
        kind: "rbi",
        inning: row.inning,
        message: `${row.inning}回: 打点${rbi}が得点${row.our}点を超過`,
      })
    }

    if (hasAllInningStats) {
      const runsAllowed = runsAllowedByInning.get(row.inning) ?? 0
      if (runsAllowed !== row.opponent) {
        inconsistencies.push({
          kind: "opponentRuns",
          inning: row.inning,
          message: `${row.inning}回: 相手得点${row.opponent}点に対し失点${runsAllowed}`,
        })
      }
    }
  }

  if (!hasAllInningStats) {
    const opponentTotal = inningRuns.reduce((sum, row) => sum + row.opponent, 0)
    const runsAllowedTotal = pitchers.reduce((sum, pitcher) => sum + (pitcher.runs || 0), 0)
    if (runsAllowedTotal !== opponentTotal) {
      inconsistencies.push({
        kind: "opponentRuns",
        inning: null,
        message: `合計: 相手得点${opponentTotal}点に対し失点${runsAllowedTotal}`,
      })
    }
  }

  return inconsistencies
}
