import { createServiceClient } from "@/lib/supabase/service"

/** 閲覧数の対象種別 */
export type ViewTargetType = "game"

/** 対象が存在しない、または指定チームのものではない場合に投げる */
export class ViewTargetNotFoundError extends Error {
  constructor() {
    super("対象が見つかりません")
    this.name = "ViewTargetNotFoundError"
  }
}

/**
 * 試合の閲覧数を加算し、加算後の累計を返す。
 *
 * デデュープ判定とインクリメントは SQL 関数 increment_game_view に閉じており、
 * 30分以内に同一IPからの閲覧が記録済みの場合は加算せず現在値を返す。
 *
 * 表示用の取得関数は用意しない。閲覧数は games.view_count に持つため、
 * 試合を取得する既存のクエリからそのまま読めばよい。
 */
export async function incrementGameView(
  teamId: string,
  gameId: string,
  ipHash: string
): Promise<number> {
  const db = createServiceClient()

  const { data, error } = await db.rpc("increment_game_view", {
    p_team_id: teamId,
    p_game_id: gameId,
    p_ip_hash: ipHash,
  })

  if (error) {
    throw new Error(`閲覧数の加算に失敗しました: ${error.message}`)
  }
  if (data === null || data === undefined) {
    throw new ViewTargetNotFoundError()
  }

  return Number(data)
}
