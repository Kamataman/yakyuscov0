"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Shield, ArrowLeft, FlaskConical } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

const IS_PREVIEW = process.env.NEXT_PUBLIC_IS_PREVIEW === "true";

export default function TeamLoginPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.teamId as string;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (
          signInError.message.includes("Invalid login credentials") ||
          signInError.message.includes("invalid_credentials")
        ) {
          setError("メールアドレスまたはパスワードが正しくありません");
        } else if (signInError.message.includes("Email not confirmed")) {
          setError(
            "メールアドレスの確認が完了していません。確認メールをご確認ください"
          );
        } else {
          setError(signInError.message || "ログインに失敗しました");
        }
        return;
      }

      // ログインしたユーザーがこのチームの管理者か確認
      const sessionRes = await fetch(`/api/auth/session?teamId=${teamId}`);
      const { teamId: adminTeamId } = (await sessionRes.json()) as {
        teamId: string | null;
      };

      if (adminTeamId !== teamId) {
        await supabase.auth.signOut();
        setError("このチームの管理者ではありません");
        return;
      }

      router.push(`/${teamId}`);
      router.refresh();
    } catch {
      setError("ログインに失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="border border-border p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="diamond-mark w-16 h-16 bg-turf flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-turf-foreground -rotate-45" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">管理者ログイン</h1>
          <p className="text-muted-foreground mt-2">
            試合の追加や選手の編集を行うにはログインが必要です
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-stitch/10 border border-stitch/40 text-stitch px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              メールアドレス
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              className="h-12"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              パスワード
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワードを入力"
              required
              className="h-12"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-turf hover:bg-turf/90 text-turf-foreground font-semibold"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ログイン中...
              </>
            ) : (
              "ログイン"
            )}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Link href="/password-reset" className="text-sm text-muted-foreground hover:text-foreground">
            パスワードをお忘れですか？
          </Link>
        </div>

        {IS_PREVIEW && (
          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">プレビュー</span>
              </div>
            </div>
            <Link href="/auth/preview-login" className="block mt-4">
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                <FlaskConical className="w-4 h-4 mr-2" />
                テストチームでログイン
              </Button>
            </Link>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link
            href={`/${teamId}`}
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            チームページに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
