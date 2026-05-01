import { createClient } from "@/lib/supabase/server";
import { sendTeamRegistrationEmail } from "@/lib/email";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/register?error=missing_code`);
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error("Code exchange error:", exchangeError);
    return NextResponse.redirect(`${origin}/register?error=confirmation_failed`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/register?error=confirmation_failed`);
  }

  const teamId = user.user_metadata?.teamId as string | undefined;
  const teamName = user.user_metadata?.teamName as string | undefined;

  if (!teamId || !teamName) {
    return NextResponse.redirect(`${origin}/register?error=missing_team_info`);
  }

  // 既存チームのチェック（再確認クリック対策）
  const { data: existingTeam } = await supabase
    .from("teams")
    .select("id")
    .eq("id", teamId)
    .single();

  if (!existingTeam) {
    const { error: insertError } = await supabase.from("teams").insert({
      id: teamId,
      name: teamName,
      user_id: user.id,
      admin_email: user.email,
    });

    if (insertError) {
      console.error("Team insert error:", insertError);
      return NextResponse.redirect(`${origin}/register?error=team_creation_failed`);
    }

    if (user.email) {
      sendTeamRegistrationEmail({
        to: user.email,
        teamName,
        teamUrl: `${origin}/${teamId}`,
      }).catch((err: unknown) => {
        console.error("Team registration email failed:", err);
      });
    }
  }

  return NextResponse.redirect(`${origin}/${teamId}`);
}
