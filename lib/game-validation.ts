import { calculateGameTotals, type GameForScore, type InningScoreLike } from "@/lib/game-score"

export type GameInconsistencyKind = "runs" | "rbi" | "opponentRuns"

export interface GameInconsistency {
  kind: GameInconsistencyKind
  message: string
}

// 検証に必要な打撃結果のフィールドのみを持つ型
export interface BattingResultForValidation {
  rbiCount: number
  scored?: boolean
}

// 検証に必要な投手成績のフィールドのみを持つ型
export interface PitcherResultForValidation {
  runs: number
  inningStats?: { runs: number }[]
}

// 投手の失点合計。イニングごとの成績があればそちらを優先する
// （個人成績の集計 app/[teamId]/stats/page.tsx と同じ優先順位）
function sumPitcherRuns(pitchers: PitcherResultForValidation[]): number {
  return pitchers.reduce((sum, pitcher) => {
    const inningStats = pitcher.inningStats
    if (inningStats && inningStats.length > 0) {
      return sum + inningStats.reduce((s, inning) => s + (inning.runs || 0), 0)
    }
    return sum + (pitcher.runs || 0)
  }, 0)
}

// 試合1件分のデータから、スコアと打撃・投手成績の不整合を検出する。
// 助っ人の記録も検証対象に含める（除外するとスコアと合わなくなるため）。
export function detectGameInconsistencies(
  game: GameForScore,
  inningScores: InningScoreLike[],
  battingResults: BattingResultForValidation[],
  pitchers: PitcherResultForValidation[]
): GameInconsistency[] {
  const totals = calculateGameTotals(game, inningScores)
  const inconsistencies: GameInconsistency[] = []

  // 自チーム得点 vs 生還記録
  const scoredCount = battingResults.filter((result) => result.scored).length
  if (scoredCount !== totals.our) {
    inconsistencies.push({
      kind: "runs",
      message: `スコアの得点は${totals.our}点ですが、打撃結果の生還は${scoredCount}人です。`,
    })
  }

  // 打点の上限（エラーや暴投による得点があるため、下回るのは正常）
  const rbiTotal = battingResults.reduce((sum, result) => sum + (result.rbiCount || 0), 0)
  if (rbiTotal > totals.our) {
    inconsistencies.push({
      kind: "rbi",
      message: `打点の合計が${rbiTotal}で、スコアの得点${totals.our}点を上回っています。`,
    })
  }

  // 相手得点 vs 投手の失点
  const pitcherRuns = sumPitcherRuns(pitchers)
  if (pitcherRuns !== totals.opponent) {
    inconsistencies.push({
      kind: "opponentRuns",
      message: `スコアの相手得点は${totals.opponent}点ですが、投手成績の失点合計は${pitcherRuns}点です。`,
    })
  }

  return inconsistencies
}
