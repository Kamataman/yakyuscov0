import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendTeamRegistrationEmail } from "@/lib/email";
import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (!tokenHash || !type) {
    return NextResponse.redirect(`${origin}/register?error=missing_code`);
  }

  const supabase = await createClient();
  const db = createServiceClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (verifyError) {
    console.error("OTP verification error:", verifyError);
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
  const { data: existingTeam } = await db
    .from("teams")
    .select("id")
    .eq("id", teamId)
    .single();

  if (!existingTeam) {
    const { error: insertError } = await db.from("teams").insert({
      id: teamId,
      name: teamName,
      user_id: user.id,
      admin_email: user.email,
    });

    if (insertError) {
      console.error("Team insert error:", insertError);
      return NextResponse.redirect(`${origin}/register?error=team_creation_failed`);
    }

    const { error: memberInsertError } = await db.from("team_members").insert({
      team_id: teamId,
      user_id: user.id,
      role: "owner",
    });

    if (memberInsertError) {
      console.error("Team member insert error:", memberInsertError);
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
