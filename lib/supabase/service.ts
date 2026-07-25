import { createClient } from "@supabase/supabase-js";

/**
 * サーバー専用・service role key によりRLSを常にバイパスするクライアント。
 * セッション(Cookie)を持たないため、ログイン有無に関わらず常に service role
 * として動作する。テーブルアクセス(.from())は全てこちらを使うこと。
 * auth.getUser() 等の認証操作には lib/supabase/server.ts の createClient を使うこと。
 */
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
