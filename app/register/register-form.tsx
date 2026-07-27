"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { registerTeam } from "./actions";

type Props = {
  termsText: string;
  privacyText: string;
};

export default function RegisterForm({ termsText, privacyText }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNavigating, startNavigation] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // router.push は遷移完了を待たないため、finally で isSubmitting を戻すと
  // 遷移中だけボタンが通常表示に戻ってしまう。transition の pending で覆う。
  const isBusy = isSubmitting || isNavigating;

  const [form, setForm] = useState({
    teamId: "",
    teamName: "",
    adminEmail: "",
    adminPassword: "",
    agreedToTerms: false,
    agreedToPrivacy: false,
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
    if (!form.agreedToTerms) {
      setError("利用規約への同意が必要です");
      return;
    }
    if (!form.agreedToPrivacy) {
      setError("プライバシーポリシーへの同意が必要です");
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

      // ユーザー登録 + 本人確認メール送信
      await registerTeam({
        teamId: form.teamId,
        teamName: form.teamName,
        email: form.adminEmail,
        password: form.adminPassword,
      });

      // 確認メール送信完了ページへ
      startNavigation(() => {
        router.push("/auth/confirm");
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "通信エラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-4 py-8">
        {/* 戻るリンク */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          トップページに戻る
        </Link>

        <div className="border border-border p-6 md:p-8">
          <h1 className="mb-6 text-2xl font-bold text-foreground">チーム登録</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* チームID */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                チームID
              </label>
              <input
                type="text"
                value={form.teamId}
                onChange={(e) =>
                  setForm({ ...form, teamId: e.target.value.toLowerCase() })
                }
                placeholder="my-team"
                className="w-full border border-input px-4 py-3 text-sm focus:border-turf focus:outline-none focus:ring-1 focus:ring-turf"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                URLに使用されます（例: /my-team）。英小文字、数字、ハイフンのみ使用可能
              </p>
            </div>

            {/* チーム名 */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                チーム名
              </label>
              <input
                type="text"
                value={form.teamName}
                onChange={(e) =>
                  setForm({ ...form, teamName: e.target.value })
                }
                placeholder="○○ベースボールクラブ"
                className="w-full border border-input px-4 py-3 text-sm focus:border-turf focus:outline-none focus:ring-1 focus:ring-turf"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                ヘッダーに表示されるチーム名です
              </p>
            </div>

            {/* 管理者メールアドレス */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                管理者メールアドレス
              </label>
              <input
                type="email"
                value={form.adminEmail}
                onChange={(e) =>
                  setForm({ ...form, adminEmail: e.target.value })
                }
                placeholder="admin@example.com"
                className="w-full border border-input px-4 py-3 text-sm focus:border-turf focus:outline-none focus:ring-1 focus:ring-turf"
              />
            </div>

            {/* 管理者パスワード */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
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
                  className="w-full border border-input px-4 py-3 pr-12 text-sm focus:border-turf focus:outline-none focus:ring-1 focus:ring-turf"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* 利用規約 */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                利用規約
              </label>
              <textarea
                readOnly
                value={termsText}
                rows={6}
                className="w-full border border-input bg-muted px-3 py-2 text-xs text-muted-foreground resize-none overflow-y-auto"
              />
              <div className="mt-2 flex items-center gap-2">
                <Checkbox
                  id="agreedToTerms"
                  checked={form.agreedToTerms}
                  onCheckedChange={(c) =>
                    setForm({ ...form, agreedToTerms: c === true })
                  }
                />
                <label
                  htmlFor="agreedToTerms"
                  className="cursor-pointer text-sm text-foreground"
                >
                  利用規約に同意します
                </label>
              </div>
            </div>

            {/* プライバシーポリシー */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                プライバシーポリシー
              </label>
              <textarea
                readOnly
                value={privacyText}
                rows={6}
                className="w-full border border-input bg-muted px-3 py-2 text-xs text-muted-foreground resize-none overflow-y-auto"
              />
              <div className="mt-2 flex items-center gap-2">
                <Checkbox
                  id="agreedToPrivacy"
                  checked={form.agreedToPrivacy}
                  onCheckedChange={(c) =>
                    setForm({ ...form, agreedToPrivacy: c === true })
                  }
                />
                <label
                  htmlFor="agreedToPrivacy"
                  className="cursor-pointer text-sm text-foreground"
                >
                  プライバシーポリシーに同意します
                </label>
              </div>
            </div>

            {/* エラーメッセージ */}
            {error && (
              <div className="bg-stitch/10 border border-stitch/40 p-3 text-sm text-stitch">
                {error}
              </div>
            )}

            {/* 登録ボタン */}
            <button
              type="submit"
              disabled={isBusy}
              className="flex w-full items-center justify-center gap-2 bg-turf px-4 py-3 text-sm font-bold text-turf-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isBusy ? (
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
