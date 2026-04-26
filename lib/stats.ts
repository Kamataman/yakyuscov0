import type { HitResult } from "./batting-types"

/**
 * 打撃成績の統計情報
 * 今後指標を追加する場合はここに追加
 */
export interface BattingStats {
  // 基本指標
  games: number           // 試合数
  plateAppearances: number // 打席数
  atBats: number          // 打数
  hits: number            // 安打
  doubles: number         // 二塁打
  triples: number         // 三塁打
  homeRuns: number        // 本塁打
  rbi: number             // 打点
  walks: number           // 四球
  hitByPitch: number      // 死球
  strikeouts: number      // 三振
  sacrificeHits: number   // 犠打
  sacrificeFlies: number  // 犠飛
  stolenBases: number     // 盗塁
  
  // 計算指標
  battingAverage: number      // 打率
  onBasePercentage: number    // 出塁率
  sluggingPercentage: number  // 長打率
  ops: number                 // OPS
  
  // 今後追加予定の指標例:
  // isolatedPower: number     // ISO（純粋長打率）
  // babip: number             // BABIP
  // wOBA: number              // wOBA
}

/**
 * 打撃結果からの統計計算
 * この関数は将来的にバッチ処理やサーバーサイドに移行可能な設計
 */
export function calculateBattingStats(
  battingResults: Array<{
    hit_result: HitResult
    rbi_count: number
    stolen_second?: boolean
    stolen_third?: boolean
    stolen_home?: boolean
  }>,
  gamesPlayed: number
): BattingStats {
  const stats: BattingStats = {
    games: gamesPlayed,
    plateAppearances: 0,
    atBats: 0,
    hits: 0,
    doubles: 0,
    triples: 0,
    homeRuns: 0,
    rbi: 0,
    walks: 0,
    hitByPitch: 0,
    strikeouts: 0,
    sacrificeHits: 0,
    sacrificeFlies: 0,
    stolenBases: 0,
    battingAverage: 0,
    onBasePercentage: 0,
    sluggingPercentage: 0,
    ops: 0,
  }

  for (const result of battingResults) {
    stats.plateAppearances++
    stats.rbi += result.rbi_count || 0
    
    // 盗塁カウント
    if (result.stolen_second) stats.stolenBases++
    if (result.stolen_third) stats.stolenBases++
    if (result.stolen_home) stats.stolenBases++

    switch (result.hit_result) {
      case "単打":
        stats.hits++
        stats.atBats++
        break
      case "二塁打":
        stats.hits++
        stats.doubles++
        stats.atBats++
        break
      case "三塁打":
        stats.hits++
        stats.triples++
        stats.atBats++
        break
      case "本塁打":
        stats.hits++
        stats.homeRuns++
        stats.atBats++
        break
      case "四球":
        stats.walks++
        break
      case "死球":
        stats.hitByPitch++
        break
      case "三振":
        stats.strikeouts++
        stats.atBats++
        break
      case "犠打":
        stats.sacrificeHits++
        break
      case "犠飛":
        stats.sacrificeFlies++
        break
      default:
        // ゴロ、フライ、ライナー、併殺、エラー、野選
        stats.atBats++
        break
    }
  }

  // 率の計算
  if (stats.atBats > 0) {
    stats.battingAverage = stats.hits / stats.atBats
    
    // 長打率 = 塁打 / 打数
    const totalBases = 
      (stats.hits - stats.doubles - stats.triples - stats.homeRuns) + // 単打
      stats.doubles * 2 +
      stats.triples * 3 +
      stats.homeRuns * 4
    stats.sluggingPercentage = totalBases / stats.atBats
  }

  // 出塁率 = (安打 + 四球 + 死球) / (打数 + 四球 + 死球 + 犠飛)
  const onBaseNumerator = stats.hits + stats.walks + stats.hitByPitch
  const onBaseDenominator = stats.atBats + stats.walks + stats.hitByPitch + stats.sacrificeFlies
  if (onBaseDenominator > 0) {
    stats.onBasePercentage = onBaseNumerator / onBaseDenominator
  }

  // OPS = 出塁率 + 長打率
  stats.ops = stats.onBasePercentage + stats.sluggingPercentage

  return stats
}

/**
 * 投手成績の統計情報
 */
export interface PitchingStats {
  games: number              // 登板数
  wins: number               // 勝利
  losses: number             // 敗北
  saves: number              // セーブ
  holds: number              // ホールド
  inningsPitched: number     // 投球回
  hits: number               // 被安打
  runs: number               // 失点
  earnedRuns: number         // 自責点
  strikeouts: number         // 奪三振
  walks: number              // 与四球
  hitByPitch: number         // 与死球
  homeRuns: number           // 被本塁打
  
  // 計算指標
  era: number                // 防御率
  whip: number               // WHIP
  strikeoutRate: number      // 奪三振率 (K/9)
  walkRate: number           // 与四球率 (BB/9)
}

/**
 * 投手成績の計算
 */
export function calculatePitchingStats(
  pitcherResults: Array<{
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
): PitchingStats {
  const stats: PitchingStats = {
    games: pitcherResults.length,
    wins: 0,
    losses: 0,
    saves: 0,
    holds: 0,
    inningsPitched: 0,
    hits: 0,
    runs: 0,
    earnedRuns: 0,
    strikeouts: 0,
    walks: 0,
    hitByPitch: 0,
    homeRuns: 0,
    era: 0,
    whip: 0,
    strikeoutRate: 0,
    walkRate: 0,
  }

  for (const result of pitcherResults) {
    if (result.is_win) stats.wins++
    if (result.is_lose) stats.losses++
    if (result.is_save) stats.saves++
    if (result.is_hold) stats.holds++
    stats.inningsPitched += result.innings_pitched || 0
    stats.hits += result.hits || 0
    stats.runs += result.runs || 0
    stats.earnedRuns += result.earned_runs || 0
    stats.strikeouts += result.strikeouts || 0
    stats.walks += result.walks || 0
    stats.hitByPitch += result.hit_by_pitch || 0
    stats.homeRuns += result.home_runs || 0
  }

  // 防御率 = 自責点 * 9 / 投球回
  if (stats.inningsPitched > 0) {
    stats.era = (stats.earnedRuns * 9) / stats.inningsPitched
    stats.whip = (stats.walks + stats.hits) / stats.inningsPitched
    stats.strikeoutRate = (stats.strikeouts * 9) / stats.inningsPitched
    stats.walkRate = (stats.walks * 9) / stats.inningsPitched
  }

  return stats
}

/**
 * 統計値のフォーマット
 */
export function formatRate(value: number, digits: number = 3): string {
  if (value === 0) return ".000"
  if (value >= 1) return value.toFixed(digits).replace(/^0/, "")
  return value.toFixed(digits).replace(/^0/, "")
}

/**
 * 成績集計処理のインターフェース
 * 将来的にこのインターフェースを実装したバッチ処理やキャッシュを追加可能
 */
export interface StatsCalculator {
  calculatePlayerStats(playerId: string): Promise<BattingStats>
  calculateAllPlayersStats(): Promise<Map<string, BattingStats>>
}

/**
 * シンプルな同期的な統計計算（現在の実装）
 * 将来的には以下のような実装に置き換え可能:
 * - CachedStatsCalculator: Redis等でキャッシュ
 * - BatchStatsCalculator: バックグラウンドジョブで事前計算
 * - IncrementalStatsCalculator: 差分更新
 */
export class SimpleStatsCalculator implements StatsCalculator {
  constructor(
    private fetchPlayerResults: (playerId: string) => Promise<{
      results: Array<{
        hit_result: HitResult
        rbi_count: number
        stolen_second?: boolean
        stolen_third?: boolean
        stolen_home?: boolean
      }>
      gamesPlayed: number
    }>
  ) {}

  async calculatePlayerStats(playerId: string): Promise<BattingStats> {
    const { results, gamesPlayed } = await this.fetchPlayerResults(playerId)
    return calculateBattingStats(results, gamesPlayed)
  }

  async calculateAllPlayersStats(): Promise<Map<string, BattingStats>> {
    // 将来的にはここでバルク取得を実装
    throw new Error("Not implemented - use individual player stats for now")
  }
}
