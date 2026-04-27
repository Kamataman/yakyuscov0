"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, Eye, EyeOff, Mail } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [registeredTeamId, setRegisteredTeamId] = useState("")

  const [form, setForm] = useState({
    teamId: "",
    teamName: "",
    adminEmail: "",
    adminPassword: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!form.teamId.trim()) {
      setError("チームIDを入力してください")
      return
    }
    if (!/^[a-z0-9-]+$/.test(form.teamId)) {
      setError("チームIDは英小文字、数字、ハイフンのみ使用できます")
      return
    }
    if (!form.teamName.trim()) {
      setError("チーム名を入力してください")
      return
    }
    if (!form.adminEmail.trim()) {
      setError("メールアドレスを入力してください")
      return
    }
    if (!form.adminPassword || form.adminPassword.length < 8) {
      setError("パスワードは8文字以上で入力してください")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.teamId,
          name: form.teamName,
          adminEmail: form.adminEmail,
          adminPassword: form.adminPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "登録に失敗しました")
        return
      }

      if (data.emailConfirmationRequired) {
        setRegisteredTeamId(data.teamId)
      } else {
        router.push(`/${form.teamId}`)
      }
    } catch {
      setError("通信エラーが発生しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (registeredTeamId) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200">
        <div className="mx-auto max-w-lg px-4 py-8">
          <div className="rounded-2xl bg-white p-6 shadow-lg md:p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="mb-3 text-2xl font-bold text-slate-800">確認メールを送信しました</h1>
            <p className="text-slate-600 mb-2">
              登録したメールアドレスに確認メールを送信しました。
            </p>
            <p className="text-slate-600 mb-6">
              メール内のリンクをクリックして認証を完了してから、ログインしてください。
            </p>
            <Link
              href={`/${registeredTeamId}/login`}
              className="inline-flex items-center justify-center w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700"
            >
              ログインページへ
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200">
      <div className="mx-auto max-w-lg px-4 py-8">
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
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                チームID
              </label>
              <input
                type="text"
                value={form.teamId}
                onChange={(e) => setForm({ ...form, teamId: e.target.value.toLowerCase() })}
                placeholder="my-team"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-slate-500">
                URLに使用されます（例: /my-team）。英小文字、数字、ハイフンのみ使用可能
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                チーム名
              </label>
              <input
                type="text"
                value={form.teamName}
                onChange={(e) => setForm({ ...form, teamName: e.target.value })}
                placeholder="○○ベースボールクラブ"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-slate-500">
                ヘッダーに表示されるチーム名です
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                管理者メールアドレス
              </label>
              <input
                type="email"
                value={form.adminEmail}
                onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                placeholder="admin@example.com"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                管理者パスワード
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.adminPassword}
                  onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                  placeholder="8文字以上"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 pr-12 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

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

          <div className="mt-6 border-t pt-6">
            <p className="mb-4 text-center text-sm text-slate-500">
              または
            </p>
            <button
              type="button"
              disabled
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-400 cursor-not-allowed"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Googleで登録（近日対応予定）
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
