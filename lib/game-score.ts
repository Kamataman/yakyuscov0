export interface InningScoreLike {
  inning: number
  our_score: number
  opponent_score: number
}

export interface GameForScore {
  total_innings: number | null
  is_first_batting: boolean | null
  last_inning_x: boolean | null
  last_inning_x_score: number | null
}

export interface GameTotals {
  our: number
  opponent: number
}

// 試合の合計得点を算出する。total_innings（延長短縮後の実イニング数）と
// last_inning_x（サヨナラ・コールド等での最終回未実施側の✕）を考慮する。
export function calculateGameTotals(
  game: GameForScore,
  inningScores: InningScoreLike[]
): GameTotals {
  const maxInning = game.total_innings || 9
  const isFirstBatting = game.is_first_batting ?? true
  const hasX = game.last_inning_x ?? false
  const xAdd = hasX ? (game.last_inning_x_score ?? 0) : 0

  const our =
    inningScores
      .filter((s) => s.inning <= maxInning && !(hasX && !isFirstBatting && s.inning === maxInning))
      .reduce((sum, s) => sum + (s.our_score || 0), 0) + (!isFirstBatting ? xAdd : 0)

  const opponent =
    inningScores
      .filter((s) => s.inning <= maxInning && !(hasX && isFirstBatting && s.inning === maxInning))
      .reduce((sum, s) => sum + (s.opponent_score || 0), 0) + (isFirstBatting ? xAdd : 0)

  return { our, opponent }
}

export function getGameResult(totals: GameTotals): "win" | "lose" | "draw" {
  if (totals.our > totals.opponent) return "win"
  if (totals.our < totals.opponent) return "lose"
  return "draw"
}
