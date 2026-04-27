import { createClient } from "@/lib/supabase/server";

export interface AuthSession {
  teamId: string;
  isAdmin: true;
}

export interface ShareTokenSession {
  gameId: string;
  teamId: string;
  isAdmin: false;
}

export type Session = AuthSession | ShareTokenSession;

/**
 * 管理者セッションを取得（Supabase Auth ベース）
 */
export async function getAdminSession(): Promise<AuthSession | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const { data: team } = await supabase
    .from("teams")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!team) {
    return null;
  }

  return { teamId: team.id, isAdmin: true };
}

/**
 * 共有トークンからセッションを取得
 */
export async function getShareTokenSession(
  token: string
): Promise<ShareTokenSession | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("game_share_tokens")
    .select("game_id, games!inner(team_id)")
    .eq("token", token)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (error || !data) {
    return null;
  }

  return {
    gameId: data.game_id,
    teamId: (data.games as { team_id: string }).team_id,
    isAdmin: false,
  };
}

/**
 * 管理者権限が必要なAPIで使用
 */
export async function requireAdmin(): Promise<AuthSession | null> {
  return getAdminSession();
}

/**
 * 特定のチームの管理者かどうかを確認
 */
export async function requireTeamAdmin(
  teamId: string
): Promise<AuthSession | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: team } = await supabase
    .from("teams")
    .select("id")
    .eq("id", teamId)
    .eq("user_id", user.id)
    .single();

  if (!team) {
    return null;
  }

  return { teamId, isAdmin: true };
}

/**
 * 特定の試合へのアクセス権を確認（管理者または共有トークン）
 */
export async function requireGameAccess(
  gameId: string,
  shareToken?: string
): Promise<Session | null> {
  const adminSession = await getAdminSession();
  if (adminSession) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("games")
      .select("team_id")
      .eq("id", gameId)
      .single();

    if (data && data.team_id === adminSession.teamId) {
      return adminSession;
    }
  }

  if (shareToken) {
    const tokenSession = await getShareTokenSession(shareToken);
    if (tokenSession && tokenSession.gameId === gameId) {
      return tokenSession;
    }
  }

  return null;
}

/**
 * 共有トークンを生成
 */
export function generateShareToken(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}
