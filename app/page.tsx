import Link from "next/link"
import { Users, BarChart3, Calendar, ChevronRight } from "lucide-react"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* ヘッダー */}
      <header className="mx-auto max-w-6xl px-4 py-6">
        <nav className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">野球スコア</h1>
          <div className="flex items-center gap-4">
            <Link
              href="/register"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700"
            >
              チーム登録
            </Link>
          </div>
        </nav>
      </header>

      {/* ヒーローセクション */}
      <section className="mx-auto max-w-6xl px-4 py-16 text-center md:py-24">
        <h2 className="text-4xl font-bold leading-tight text-white md:text-5xl">
          チームの試合結果と<br />個人成績を簡単管理
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
          野球チームの試合スコア、打撃成績、投手成績を一元管理。
          スマートフォンからいつでも簡単に記録・確認できます。
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/register"
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl"
          >
            無料でチームを作成
            <ChevronRight className="h-5 w-5" />
          </Link>
          <Link
            href="/demo"
            className="rounded-xl border border-slate-600 px-8 py-4 text-lg font-bold text-white transition-all hover:bg-slate-700"
          >
            デモを見る
          </Link>
        </div>
      </section>

      {/* 機能紹介 */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h3 className="mb-12 text-center text-2xl font-bold text-white">主な機能</h3>
        <div className="grid gap-8 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-800/50 p-6">
            <div className="mb-4 inline-flex rounded-xl bg-blue-500/20 p-3">
              <Calendar className="h-8 w-8 text-blue-400" />
            </div>
            <h4 className="mb-2 text-xl font-bold text-white">試合結果の記録</h4>
            <p className="text-slate-400">
              スコアボード形式で各イニングのスコアを記録。
              打撃結果もタップ操作で簡単入力。
            </p>
          </div>
          <div className="rounded-2xl bg-slate-800/50 p-6">
            <div className="mb-4 inline-flex rounded-xl bg-emerald-500/20 p-3">
              <BarChart3 className="h-8 w-8 text-emerald-400" />
            </div>
            <h4 className="mb-2 text-xl font-bold text-white">個人成績の自動集計</h4>
            <p className="text-slate-400">
              打率、出塁率、OPS、防御率などを自動計算。
              選手ごとの成績を一覧で確認。
            </p>
          </div>
          <div className="rounded-2xl bg-slate-800/50 p-6">
            <div className="mb-4 inline-flex rounded-xl bg-purple-500/20 p-3">
              <Users className="h-8 w-8 text-purple-400" />
            </div>
            <h4 className="mb-2 text-xl font-bold text-white">選手一覧</h4>
            <p className="text-slate-400">
              チームメンバーを登録して、試合ごとの出場選手を簡単選択。
              背番号やポジションも管理。
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16 text-center">
        <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-blue-700 p-8 md:p-12">
          <h3 className="text-2xl font-bold text-white md:text-3xl">
            今すぐチームを作成して始めましょう
          </h3>
          <p className="mt-4 text-blue-100">
            無料で使えます。クレジットカード不要。
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-lg font-bold text-blue-600 shadow-lg transition-all hover:bg-slate-100"
          >
            チーム登録
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* フッター */}
      <footer className="border-t border-slate-700 py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-slate-500">
          <p>野球スコア - チームの記録を管理するアプリ</p>
        </div>
      </footer>
    </main>
  )
}
