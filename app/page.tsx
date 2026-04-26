"use client"

import Link from "next/link"
import { Calendar, Users, PlusCircle, TrendingUp } from "lucide-react"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <h1 className="text-2xl font-bold text-slate-800">野球スコア管理</h1>
          <p className="mt-1 text-sm text-slate-500">試合結果と個人成績を記録・管理</p>
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className="mx-auto max-w-6xl p-4 md:p-6">
        {/* クイックアクション */}
        <div className="mb-8">
          <Link
            href="/games/new"
            className="flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 text-white shadow-lg transition-all hover:from-blue-700 hover:to-blue-800 hover:shadow-xl active:scale-[0.98]"
          >
            <PlusCircle className="h-6 w-6" />
            <span className="text-lg font-bold">新しい試合を記録</span>
          </Link>
        </div>

        {/* ナビゲーションカード */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* 試合一覧 */}
          <Link
            href="/games"
            className="group rounded-2xl bg-white p-6 shadow-md transition-all hover:shadow-lg"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-emerald-100 p-3">
                <Calendar className="h-7 w-7 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-800 group-hover:text-emerald-600">
                  試合一覧
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  過去の試合結果を確認・編集
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
                  <span>0 試合</span>
                </div>
              </div>
            </div>
          </Link>

          {/* 個人成績 */}
          <Link
            href="/stats"
            className="group rounded-2xl bg-white p-6 shadow-md transition-all hover:shadow-lg"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-amber-100 p-3">
                <TrendingUp className="h-7 w-7 text-amber-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-800 group-hover:text-amber-600">
                  個人成績
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  選手ごとの打撃・投手成績を確認
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
                  <span>0 選手</span>
                </div>
              </div>
            </div>
          </Link>

          {/* 選手管理 */}
          <Link
            href="/players"
            className="group rounded-2xl bg-white p-6 shadow-md transition-all hover:shadow-lg"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-purple-100 p-3">
                <Users className="h-7 w-7 text-purple-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-800 group-hover:text-purple-600">
                  選手管理
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  選手の登録・編集
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
                  <span>0 選手登録済み</span>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* 直近の試合 */}
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-bold text-slate-800">直近の試合</h2>
          <div className="rounded-2xl bg-white p-6 shadow-md">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Calendar className="mb-3 h-12 w-12 text-slate-300" />
              <p className="text-slate-500">まだ試合が記録されていません</p>
              <Link
                href="/games/new"
                className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                最初の試合を記録する
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
