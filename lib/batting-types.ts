export type HitResult = 
  | "単打" 
  | "二塁打" 
  | "三塁打" 
  | "本塁打" 
  | "四球" 
  | "死球" 
  | "犠打" 
  | "犠飛" 
  | "三振" 
  | "ゴロ" 
  | "フライ" 
  | "ライナー" 
  | "併殺打" 
  | "エラー"
  | "野選"

export type HitDirection = 
  | "投" 
  | "捕" 
  | "一" 
  | "二" 
  | "三" 
  | "遊" 
  | "左" 
  | "中" 
  | "右"

export interface RunnerState {
  first: boolean
  second: boolean
  third: boolean
}

export interface StolenBase {
  second: boolean  // 二盗
  third: boolean   // 三盗
  home: boolean    // 本盗
}

export interface BattingResult {
  hitResult: HitResult
  direction?: HitDirection
  rbiCount: number
  runners?: RunnerState
  stolenBases?: StolenBase
  memo?: string
}

export interface CellPosition {
  battingOrder: number
  inning: number
  atBatSequence: number
}

// 守備位置
export type FieldPosition = 
  | "投" 
  | "捕" 
  | "一" 
  | "二" 
  | "三" 
  | "遊" 
  | "左" 
  | "中" 
  | "右"
  | "DH"

export const FIELD_POSITIONS: { value: FieldPosition; label: string }[] = [
  { value: "投", label: "投" },
  { value: "捕", label: "捕" },
  { value: "一", label: "一" },
  { value: "二", label: "二" },
  { value: "三", label: "三" },
  { value: "遊", label: "遊" },
  { value: "左", label: "左" },
  { value: "中", label: "中" },
  { value: "右", label: "右" },
  { value: "DH", label: "DH" },
]

// 選手情報
export interface Player {
  id: string
  name: string
  number?: string  // 背番号（00, 01なども対応）
}

// 打順のエントリー（代打・途中交代対応）
export interface LineupEntry {
  playerId: string
  playerName: string
  position?: FieldPosition
  isSubstitute?: boolean  // 代打・途中出場
  enteredInning?: number  // 何回から出場したか
  isHelper?: boolean      // 助っ人（個人成績に含めない）
}

// 打順のスロット（1試合で複数選手が入る可能性）
export interface LineupSlot {
  order: number
  entries: LineupEntry[]
}

// イニングごとのスコア
export interface InningScore {
  our: number
  opponent: number
}

// 投手成績
export interface PitcherResult {
  playerId: string
  playerName: string
  inningsPitched: number      // 投球回（端数は1/3=0.33, 2/3=0.67）
  hits: number                // 被安打
  runs: number                // 失点
  earnedRuns: number          // 自責点
  strikeouts: number          // 奪三振
  walks: number               // 与四球
  hitByPitch: number          // 与死球
  homeRuns: number            // 被本塁打
  pitchCount?: number         // 球数
  isWin?: boolean             // 勝利
  isLose?: boolean            // 敗戦
  isSave?: boolean            // セーブ
  isHold?: boolean            // ホールド
}

// 結果の短縮表示を生成
export function getResultSummary(result: BattingResult): string {
  const { hitResult, direction, rbiCount } = result
  
  // 短縮形の変換
  const shortResult: Record<HitResult, string> = {
    "単打": "安",
    "二塁打": "2",
    "三塁打": "3",
    "本塁打": "HR",
    "四球": "四",
    "死球": "死",
    "犠打": "犠",
    "犠飛": "犠飛",
    "三振": "K",
    "ゴロ": "ゴ",
    "フライ": "飛",
    "ライナー": "直",
    "併殺打": "併",
    "エラー": "E",
    "野選": "野",
  }

  let summary = shortResult[hitResult] || hitResult
  
  // 方向がある場合は追加
  if (direction) {
    summary = `${direction}${summary}`
  }
  
  // 打点がある場合は追加
  if (rbiCount > 0) {
    summary += `(${rbiCount})`
  }
  
  return summary
}

// 結果がヒットかどうか
export function isHit(result: HitResult): boolean {
  return ["単打", "二塁打", "三塁打", "本塁打"].includes(result)
}

// 結果が出塁かどうか
export function isOnBase(result: HitResult): boolean {
  return ["単打", "二塁打", "三塁打", "本塁打", "四球", "死球", "エラー", "野選"].includes(result)
}

// 試合データ
export interface GameData {
  id: string
  date: string
  opponent: string
  location?: string
  inningScores: InningScore[]
  lineupSlots: LineupSlot[]
  battingResults: Record<string, BattingResult>
  pitchers: PitcherResult[]
  memo?: string
}

// 個人成績
export interface PlayerStats {
  playerId: string
  playerName: string
  games: number          // 試合数
  atBats: number         // 打数
  hits: number           // 安打
  doubles: number        // 二塁打
  triples: number        // 三塁打
  homeRuns: number       // 本塁打
  rbi: number            // 打点
  walks: number          // 四球
  strikeouts: number     // 三振
  stolenBases: number    // 盗塁
  battingAverage: number // 打率
  onBasePercentage: number // 出塁率
  sluggingPercentage: number // 長打率
}
