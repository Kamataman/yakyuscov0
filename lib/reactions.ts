import { createServiceClient } from "@/lib/supabase/service"

const DAY_MS = 24 * 60 * 60 * 1000

/** リアクションの対象種別 */
export type ReactionTargetType = "game"

/** リアクションの種類 */
export type ReactionKind = "nice_game"

/**
 * 同一IPから同じ対象へ再度リアクションできるようになるまでの間隔。
 * 日付境界ではなくローテーティングな24時間で判定する（lib/rate-limit.ts と同方針）。
 */
const REACTION_INTERVAL_MS = DAY_MS

/** 対象が存在しない、または指定チームのものではない場合に投げる */
export class ReactionTargetNotFoundError extends Error {
  constructor() {
    super("対象が見つかりません")
    this.name = "ReactionTargetNotFoundError"
  }
}

export interface ReactionState {
  /** 対象の累計リアクション数 */
  count: number
  /** 直近24時間以内に同一IPからのリアクションが記録済みか */
  alreadyReacted: boolean
}

interface ReactionTarget {
  teamId: string
  targetType: ReactionTargetType
  targetId: string
  kind: ReactionKind
}

/**
 * 対象が指定チームのものかを検証する。
 * reactions.target_id にはFKを張っていないため、書き込み前に必ず通す。
 */
async function belongsToTeam(target: ReactionTarget): Promise<boolean> {
  const db = createServiceClient()

  const { data } = await db
    .from("games")
    .select("id")
    .eq("id", target.targetId)
    .eq("team_id", target.teamId)
    .maybeSingle()

  return !!data
}

/**
 * 対象の累計リアクション数と、リクエスト元がリアクション済みかどうかを取得する。
 * ipHash を省略した場合は alreadyReacted の判定を行わない（false を返す）。
 */
export async function getReactionState(
  target: ReactionTarget,
  ipHash?: string
): Promise<ReactionState> {
  const db = createServiceClient()

  const countQuery = db
    .from("reactions")
    .select("id", { count: "exact", head: true })
    .eq("target_type", target.targetType)
    .eq("target_id", target.targetId)
    .eq("kind", target.kind)

  if (!ipHash) {
    const { count, error } = await countQuery
    if (error) {
      throw new Error(`リアクション数の取得に失敗しました: ${error.message}`)
    }
    return { count: count ?? 0, alreadyReacted: false }
  }

  const since = new Date(Date.now() - REACTION_INTERVAL_MS).toISOString()
  const [countResult, mineResult] = await Promise.all([
    countQuery,
    db
      .from("reactions")
      .select("id", { count: "exact", head: true })
      .eq("target_type", target.targetType)
      .eq("target_id", target.targetId)
      .eq("kind", target.kind)
      .eq("ip_hash", ipHash)
      .gte("created_at", since),
  ])

  if (countResult.error) {
    throw new Error(`リアクション数の取得に失敗しました: ${countResult.error.message}`)
  }
  if (mineResult.error) {
    throw new Error(`リアクション状態の取得に失敗しました: ${mineResult.error.message}`)
  }

  return {
    count: countResult.count ?? 0,
    alreadyReacted: (mineResult.count ?? 0) > 0,
  }
}

/**
 * リアクションを記録する。
 * 直近24時間以内に同一IPからの記録がある場合は加算せず、現在の状態をそのまま返す
 * （上限到達はエラーではなく「押下済み」として扱う）。
 */
export async function addReaction(
  target: ReactionTarget,
  ipHash: string
): Promise<ReactionState> {
  if (!(await belongsToTeam(target))) {
    throw new ReactionTargetNotFoundError()
  }

  const current = await getReactionState(target, ipHash)
  if (current.alreadyReacted) {
    return current
  }

  const db = createServiceClient()
  const { error } = await db.from("reactions").insert({
    team_id: target.teamId,
    target_type: target.targetType,
    target_id: target.targetId,
    kind: target.kind,
    ip_hash: ipHash,
  })

  if (error) {
    throw new Error(`リアクションの記録に失敗しました: ${error.message}`)
  }

  return { count: current.count + 1, alreadyReacted: true }
}

/**
 * 対象に紐づくリアクションをすべて削除する。
 * reactions.target_id にはFKを張っていないため、対象（試合など）の削除時に
 * 明示的に呼び出して孤児レコードを残さないようにする。
 */
export async function deleteReactionsForTarget(
  targetType: ReactionTargetType,
  targetId: string
): Promise<void> {
  const db = createServiceClient()
  const { error } = await db
    .from("reactions")
    .delete()
    .eq("target_type", targetType)
    .eq("target_id", targetId)

  if (error) {
    throw new Error(`リアクションの削除に失敗しました: ${error.message}`)
  }
}
