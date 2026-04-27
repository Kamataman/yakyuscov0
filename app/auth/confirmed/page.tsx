import Link from "next/link"
import { CheckCircle, XCircle } from "lucide-react"

export default async function ConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ teamId?: string; error?: string }>
}) {
  const { teamId, error } = await searchParams

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-3">確認に失敗しました</h1>
          <p className="text-slate-600 mb-6">
            リンクが無効または期限切れです。再度登録してください。
          </p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700"
          >
            登録ページへ
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-3">登録完了</h1>
        <p className="text-slate-600 mb-6">
          メールアドレスの確認が完了しました。
          <br />
          ログインしてチーム管理を始めましょう。
        </p>
        {teamId ? (
          <Link
            href={`/${teamId}/login`}
            className="inline-flex items-center justify-center w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700"
          >
            ログインする
          </Link>
        ) : (
          <Link
            href="/"
            className="inline-flex items-center justify-center w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700"
          >
            トップページへ
          </Link>
        )}
      </div>
    </main>
  )
}
