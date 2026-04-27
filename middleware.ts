import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // Supabaseがallowlist未登録のredirect URLをSite URL（ルート）にフォールバックする場合、
  // ?code= パラメータ付きでルートに来るため /auth/confirm に転送する
  const code = request.nextUrl.searchParams.get("code")
  if (code && request.nextUrl.pathname !== "/auth/confirm") {
    const confirmUrl = new URL("/auth/confirm", request.url)
    confirmUrl.searchParams.set("code", code)
    return NextResponse.redirect(confirmUrl)
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // セッションの有効期限を自動更新する（getUser()を呼ぶことでトークンがリフレッシュされる）
  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
