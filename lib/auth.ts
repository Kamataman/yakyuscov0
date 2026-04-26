import { cookies } from "next/headers";
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
 * 管理者セッションを取得（Cookieベース）
 */
export async function getAdminSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("team_session");

  if (!sessionCookie?.value) {
    return null;
  }

  try {
    const session = JSON.parse(sessionCookie.value);
    if (session?.teamId) {
      return {
        teamId: session.teamId,
        isAdmin: true,
      };
    }
  } catch {
    return null;
  }

  return null;
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
 * 管理者でない場合はnullを返す
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
  const session = await getAdminSession();
  if (!session || session.teamId !== teamId) {
    return null;
  }
  return session;
}

/**
 * 特定の試合へのアクセス権を確認（管理者または共有トークン）
 */
export async function requireGameAccess(
  gameId: string,
  shareToken?: string
): Promise<Session | null> {
  // まず管理者セッションをチェック
  const adminSession = await getAdminSession();
  if (adminSession) {
    // 管理者の場合、その試合がこのチームのものかどうか確認
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

  // 共有トークンをチェック
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
