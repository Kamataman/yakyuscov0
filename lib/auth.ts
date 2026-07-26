import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export type TeamRole = "owner" | "admin";

export interface AuthSession {
  teamId: string;
  userId: string;
  isAdmin: true;
  role: TeamRole;
}

export interface ShareTokenSession {
  gameId: string;
  teamId: string;
  isAdmin: false;
}

export type Session = AuthSession | ShareTokenSession;

/**
 * 共有トークンからセッションを取得
 */
export async function getShareTokenSession(
  token: string
): Promise<ShareTokenSession | null> {
  const db = createServiceClient();

  const { data, error } = await db
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
 * 特定のチームの管理者（owner/admin）かどうかを確認
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

  const db = createServiceClient();
  const { data: member } = await db
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", user.id)
    .single();

  if (!member) {
    return null;
  }

  return { teamId, userId: user.id, isAdmin: true, role: member.role as TeamRole };
}

/**
 * 特定のチームのオーナーかどうかを確認
 */
export async function requireTeamOwner(
  teamId: string
): Promise<AuthSession | null> {
  const session = await requireTeamAdmin(teamId);
  return session?.role === "owner" ? session : null;
}

/**
 * 特定の試合へのアクセス権を確認（管理者または共有トークン）
 */
export async function requireGameAccess(
  gameId: string,
  shareToken?: string
): Promise<Session | null> {
  const db = createServiceClient();
  const { data: game } = await db
    .from("games")
    .select("team_id")
    .eq("id", gameId)
    .single();

  if (game) {
    const adminSession = await requireTeamAdmin(game.team_id);
    if (adminSession) {
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
