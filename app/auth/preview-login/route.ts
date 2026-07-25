import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { origin } = new URL(request.url);

  const email = process.env.PREVIEW_AUTO_LOGIN_EMAIL;
  const password = process.env.PREVIEW_AUTO_LOGIN_PASSWORD;

  if (!email || !password) {
    return NextResponse.redirect(`${origin}/`);
  }

  const supabase = await createClient();
  const db = createServiceClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    console.error("Preview auto-login failed:", signInError.message);
    return NextResponse.redirect(`${origin}/`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/`);
  }

  const { data: team } = await db
    .from("teams")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!team) {
    return NextResponse.redirect(`${origin}/`);
  }

  return NextResponse.redirect(`${origin}/${team.id}`);
}
