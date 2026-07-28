// 選手プロフィール（一覧表示・編集で使うポジション区分と投打）

export const PLAYER_POSITIONS = ["投手", "捕手", "内野手", "外野手", "監督・コーチ", "スタッフ"] as const
export type PlayerPosition = (typeof PLAYER_POSITIONS)[number]

export const THROW_BAT_OPTIONS = ["右右", "右左", "右両", "左右", "左左", "左両"] as const
export type ThrowBat = (typeof THROW_BAT_OPTIONS)[number]

export function isPlayerPosition(value: string): value is PlayerPosition {
  return (PLAYER_POSITIONS as readonly string[]).includes(value)
}

export function isThrowBat(value: string): value is ThrowBat {
  return (THROW_BAT_OPTIONS as readonly string[]).includes(value)
}
