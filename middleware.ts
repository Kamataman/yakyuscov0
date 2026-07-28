import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // sitemap.xml / robots.txt / opengraph-image はクローラー向けの静的レスポンスで
    // セッションを必要としない。Supabaseへの往復を挟むと無駄な遅延と障害点になるため除外する。
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|opengraph-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
