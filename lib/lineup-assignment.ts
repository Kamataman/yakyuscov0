/**
 * 打順 × イニング から選手を解決するための共通ロジック
 *
 * batting_results テーブルには player_id が無く、打席は
 * (game_id, batting_order, inning, at_bat_sequence) のセルとしてのみ記録される。
 * 同じ打順に先発・代打・代走・守備交代が並ぶため、打席をどの選手に割り当てるかは
 * lineup_entries の entered_inning から求めた「担当イニング範囲」で決まる。
 *
 * 個人成績の集計 (app/[teamId]/stats/page.tsx) と
 * 試合詳細ページの打席グリッド (app/[teamId]/games/[id]/page.tsx) の両方から使う。
 */

/** 代打を表す守備位置（lineup_entries.positions に入る） */
export const PINCH_HITTER_POSITION = "打"
/** 代走を表す守備位置（lineup_entries.positions に入る） */
export const PINCH_RUNNER_POSITION = "走"

/** 範囲計算に必要な lineup_entries の最小限のフィールド */
export interface LineupEntryLike {
  is_substitute?: boolean | null
  entered_inning?: number | null
  positions?: string[] | null
}

export interface ActiveRange<T extends LineupEntryLike> {
  entry: T
  /** 打席を担当する最初のイニング */
  activeFrom: number
  /** 打席を担当する最後のイニング。最終エントリは Number.POSITIVE_INFINITY */
  activeTo: number
}

/**
 * そのエントリが打席を担当し始めるイニングを返す。
 *
 * 代走は「出塁した打者の代わりに走る」だけで、その回の打席は交代前の選手が完了している。
 * そのため代走のみ翌イニングからの担当とする。代打・守備交代は出場イニングから担当。
 */
export function getBattingActiveFrom(entry: LineupEntryLike): number {
  if (!entry.is_substitute) return 1
  const enteredInning = entry.entered_inning ?? 1
  const isPinchRunner = (entry.positions ?? []).includes(PINCH_RUNNER_POSITION)
  return isPinchRunner ? enteredInning + 1 : enteredInning
}

/**
 * 同じ打順のエントリ群を出場順に並べ、それぞれの担当イニング範囲を返す。
 *
 * 助っ人や player_id が NULL のエントリも必ず渡すこと。
 * 除外すると、その選手の打席が同じ打順の別の選手に加算されてしまう。
 */
export function buildActiveRanges<T extends LineupEntryLike>(entries: T[]): ActiveRange<T>[] {
  const sorted = [...entries].sort((a, b) => {
    if (!a.is_substitute && b.is_substitute) return -1
    if (a.is_substitute && !b.is_substitute) return 1
    return getBattingActiveFrom(a) - getBattingActiveFrom(b)
  })

  return sorted.map((entry, index) => {
    const activeFrom = getBattingActiveFrom(entry)
    const activeTo =
      index < sorted.length - 1
        ? getBattingActiveFrom(sorted[index + 1]) - 1
        : Number.POSITIVE_INFINITY
    return { entry, activeFrom, activeTo }
  })
}

/** 指定イニングの打席を担当するエントリを返す。該当なしは null */
export function resolveEntryForInning<T extends LineupEntryLike>(
  ranges: ActiveRange<T>[],
  inning: number
): T | null {
  for (const range of ranges) {
    if (inning >= range.activeFrom && inning <= range.activeTo) return range.entry
  }
  return null
}
