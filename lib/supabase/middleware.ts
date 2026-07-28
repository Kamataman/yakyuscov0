import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // セッショントークンを自動リフレッシュ
  // createServerClient と getUser の間にロジックを挟まないこと
  try {
    await supabase.auth.getUser();
  } catch (error) {
    // Supabaseの一時的な障害でサイト全体が500になるのを防ぐ。
    // リフレッシュに失敗しても未ログイン扱いで描画を継続させる。
    console.error("セッションのリフレッシュに失敗しました:", error);
  }

  return supabaseResponse;
}
