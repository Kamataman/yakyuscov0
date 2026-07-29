import {
  AI_REVIEW_MIN_BATTING_RESULTS,
  AI_REVIEW_MIN_PITCHER_RESULTS,
  AI_REVIEW_MIN_INNINGS,
  AI_REVIEW_MIN_LINEUP_ENTRIES,
} from "@/lib/constants"

export interface GameContentCounts {
  battingResults: number
  pitcherResults: number
  inningsPlayed: number
  lineupEntries: number
}

// 試合内容が薄く、AI戦評を生成すべきでないかを判定する
export function isGameContentThin(counts: GameContentCounts): boolean {
  return (
    counts.battingResults < AI_REVIEW_MIN_BATTING_RESULTS ||
    counts.pitcherResults < AI_REVIEW_MIN_PITCHER_RESULTS ||
    counts.inningsPlayed < AI_REVIEW_MIN_INNINGS ||
    counts.lineupEntries < AI_REVIEW_MIN_LINEUP_ENTRIES
  )
}
