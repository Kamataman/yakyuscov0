import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

/**
 * ログイン中ユーザーが所属するチームのうち最初の1件を返す。
 * 招待受諾直後（パスワード設定後）に遷移先のチームを決めるために使う。
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ teamId: null });
  }

  const db = createServiceClient();
  const { data: member } = await db
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  return NextResponse.json({ teamId: member?.team_id ?? null });
}
