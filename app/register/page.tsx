"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    teamId: "",
    teamName: "",
    adminEmail: "",
    adminPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // バリデーション
    if (!form.teamId.trim()) {
      setError("チームIDを入力してください");
      return;
    }
    if (!/^[a-z0-9-]+$/.test(form.teamId)) {
      setError("チームIDは英小文字、数字、ハイフンのみ使用できます");
      return;
    }
    if (!form.teamName.trim()) {
      setError("チーム名を入力してください");
      return;
    }
    if (!form.adminEmail.trim()) {
      setError("メールアドレスを入力してください");
      return;
    }
    if (!form.adminPassword || form.adminPassword.length < 8) {
      setError("パスワードは8文字以上で入力してください");
      return;
    }

    setIsSubmitting(true);
    try {
      // チームIDの重複チェック（既存APIルート経由）
      const checkRes = await fetch(`/api/teams?id=${encodeURIComponent(form.teamId)}`);
      if (checkRes.ok) {
        setError("このチームIDはすでに使用されています");
        return;
      }

      // Supabase Auth でユーザー登録
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email: form.adminEmail,
        password: form.adminPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            teamId: form.teamId,
            teamName: form.teamName,
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes("already registered")) {
          setError("このメールアドレスはすでに登録されています");
        } else {
          setError(signUpError.message || "登録に失敗しました");
        }
        return;
      }

      // 確認メール送信完了ページへ
      router.push("/auth/confirm");
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200">
      <div className="mx-auto max-w-lg px-4 py-8">
        {/* 戻るリンク */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          トップページに戻る
        </Link>

        <div className="rounded-2xl bg-white p-6 shadow-lg md:p-8">
          <h1 className="mb-6 text-2xl font-bold text-slate-800">チーム登録</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* チームID */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                チームID
              </label>
              <input
                type="text"
                value={form.teamId}
                onChange={(e) =>
                  setForm({ ...form, teamId: e.target.value.toLowerCase() })
                }
                placeholder="my-team"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-slate-500">
                URLに使用されます（例: /my-team）。英小文字、数字、ハイフンのみ使用可能
              </p>
            </div>

            {/* チーム名 */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                チーム名
              </label>
              <input
                type="text"
                value={form.teamName}
                onChange={(e) =>
                  setForm({ ...form, teamName: e.target.value })
                }
                placeholder="○○ベースボールクラブ"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-slate-500">
                ヘッダーに表示されるチーム名です
              </p>
            </div>

            {/* 管理者メールアドレス */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                管理者メールアドレス
              </label>
              <input
                type="email"
                value={form.adminEmail}
                onChange={(e) =>
                  setForm({ ...form, adminEmail: e.target.value })
                }
                placeholder="admin@example.com"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* 管理者パスワード */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                管理者パスワード
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.adminPassword}
                  onChange={(e) =>
                    setForm({ ...form, adminPassword: e.target.value })
                  }
                  placeholder="8文字以上"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 pr-12 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* エラーメッセージ */}
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* 登録ボタン */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  登録中...
                </>
              ) : (
                "チームを登録"
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
