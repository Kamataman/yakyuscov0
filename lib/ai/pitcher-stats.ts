export interface PitcherAggregateRow {
  id: string
  player_name: string
  innings_outs: number
  is_mid_inning_exit: boolean
  hits: number
  runs: number
  earned_runs: number
  strikeouts: number
  walks: number
  hit_by_pitch: number
  home_runs: number
  pitcher_award: string | null
}

export interface PitcherInningStatRow {
  pitcher_result_id: string
  inning: number
  outs: number
  runs: number
  hits: number
  strikeouts: number
  earned_runs: number
  walks: number
  hit_by_pitch: number
  home_runs: number
}

// 投手成績は「試合合計」と「イニングごと」の2つの入力方式があり、イニングごとで入力した場合
// pitcher_resultsの集計カラムは未入力(0)のままになりうる。表示側(pitcher-results-section.tsx)と
// 同じロジックで、イニングごとの入力があればそちらの合計を優先する
export function resolveEffectivePitcherStats(
  aggregate: PitcherAggregateRow,
  inningStats: PitcherInningStatRow[]
): PitcherAggregateRow {
  if (inningStats.length === 0) return aggregate

  const totals = inningStats.reduce(
    (acc, s) => ({
      hits: acc.hits + s.hits,
      runs: acc.runs + s.runs,
      earned_runs: acc.earned_runs + s.earned_runs,
      strikeouts: acc.strikeouts + s.strikeouts,
      walks: acc.walks + s.walks,
      hit_by_pitch: acc.hit_by_pitch + s.hit_by_pitch,
      home_runs: acc.home_runs + s.home_runs,
      outs: acc.outs + (s.outs ?? 3),
    }),
    { hits: 0, runs: 0, earned_runs: 0, strikeouts: 0, walks: 0, hit_by_pitch: 0, home_runs: 0, outs: 0 }
  )
  const lastInning = inningStats[inningStats.length - 1]

  return {
    ...aggregate,
    innings_outs: totals.outs,
    is_mid_inning_exit: (lastInning.outs ?? 3) < 3,
    hits: totals.hits,
    runs: totals.runs,
    earned_runs: totals.earned_runs,
    strikeouts: totals.strikeouts,
    walks: totals.walks,
    hit_by_pitch: totals.hit_by_pitch,
    home_runs: totals.home_runs,
  }
}
