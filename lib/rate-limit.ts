import { createServiceClient } from "@/lib/supabase/service";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

const LIMIT_IP_PER_HOUR = 3;
const LIMIT_IP_PER_DAY = 5;
const LIMIT_TEAM_PER_DAY = 10;
const LIMIT_GLOBAL_PER_DAY = 30;

/**
 * チーム問い合わせフォームのレート制限を判定し、許可された場合は送信記録を書き込む。
 * メールアドレス・氏名・本文は保存しない（team_id・ip_hashのみ）。
 * 24時間より古い記録は判定のたびに削除する。
 */
export async function checkAndRecordContactRateLimit(
  teamId: string,
  ipHash: string
): Promise<boolean> {
  const db = createServiceClient();
  const now = Date.now();
  const dayAgo = new Date(now - DAY_MS).toISOString();
  const hourAgo = new Date(now - HOUR_MS).toISOString();

  await db.from("contact_rate_limits").delete().lt("created_at", dayAgo);

  const [ipHourResult, ipDayResult, teamDayResult, globalDayResult] = await Promise.all([
    db
      .from("contact_rate_limits")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", hourAgo),
    db
      .from("contact_rate_limits")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", dayAgo),
    db
      .from("contact_rate_limits")
      .select("id", { count: "exact", head: true })
      .eq("team_id", teamId)
      .gte("created_at", dayAgo),
    db
      .from("contact_rate_limits")
      .select("id", { count: "exact", head: true })
      .gte("created_at", dayAgo),
  ]);

  const ipHourCount = ipHourResult.count ?? 0;
  const ipDayCount = ipDayResult.count ?? 0;
  const teamDayCount = teamDayResult.count ?? 0;
  const globalDayCount = globalDayResult.count ?? 0;

  if (
    ipHourCount >= LIMIT_IP_PER_HOUR ||
    ipDayCount >= LIMIT_IP_PER_DAY ||
    teamDayCount >= LIMIT_TEAM_PER_DAY ||
    globalDayCount >= LIMIT_GLOBAL_PER_DAY
  ) {
    return false;
  }

  const { error } = await db.from("contact_rate_limits").insert({ team_id: teamId, ip_hash: ipHash });
  if (error) {
    throw new Error(error.message);
  }

  return true;
}
