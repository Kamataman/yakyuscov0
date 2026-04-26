"use client"

import Link from "next/link"
import { ArrowLeft, TrendingUp, Users } from "lucide-react"
import type { PlayerStats } from "@/lib/batting-types"

// 仮のデータ（将来はデータベースから取得）
const mockPlayerStats: PlayerStats[] = []

export default function StatsPage() {
  const playerStats = mockPlayerStats

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-800">個人成績</h1>
              <p className="text-sm text-slate-500">{playerStats.length} 選手</p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl p-4 md:p-6">
        {/* 成績リスト */}
        {playerStats.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-md">
            <TrendingUp className="mx-auto mb-3 h-12 w-12 text-slate-300" />
            <p className="text-slate-500">まだ成績が記録されていません</p>
            <p className="mt-2 text-sm text-slate-400">
              試合を記録すると、自動で個人成績が集計されます
            </p>
            <Link
              href="/games/new"
              className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              最初の試合を記録する
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 打撃成績テーブル */}
            <div className="rounded-2xl bg-white p-4 shadow-md">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800">
                <Users className="h-5 w-5 text-amber-500" />
                打撃成績
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                      <th className="whitespace-nowrap px-3 py-2">選手名</th>
                      <th className="whitespace-nowrap px-3 py-2 text-center">試合</th>
                      <th className="whitespace-nowrap px-3 py-2 text-center">打数</th>
                      <th className="whitespace-nowrap px-3 py-2 text-center">安打</th>
                      <th className="whitespace-nowrap px-3 py-2 text-center">2B</th>
                      <th className="whitespace-nowrap px-3 py-2 text-center">3B</th>
                      <th className="whitespace-nowrap px-3 py-2 text-center">HR</th>
                      <th className="whitespace-nowrap px-3 py-2 text-center">打点</th>
                      <th className="whitespace-nowrap px-3 py-2 text-center">四球</th>
                      <th className="whitespace-nowrap px-3 py-2 text-center">三振</th>
                      <th className="whitespace-nowrap px-3 py-2 text-center">盗塁</th>
                      <th className="whitespace-nowrap px-3 py-2 text-center">打率</th>
                      <th className="whitespace-nowrap px-3 py-2 text-center">出塁率</th>
                      <th className="whitespace-nowrap px-3 py-2 text-center">長打率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {playerStats.map((stat) => (
                      <tr
                        key={stat.playerId}
                        className="border-b border-slate-100 hover:bg-slate-50"
                      >
                        <td className="whitespace-nowrap px-3 py-3 font-medium text-slate-800">
                          {stat.playerName}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-center">
                          {stat.games}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-center">
                          {stat.atBats}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-center">
                          {stat.hits}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-center">
                          {stat.doubles}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-center">
                          {stat.triples}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-center">
                          {stat.homeRuns}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-center">
                          {stat.rbi}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-center">
                          {stat.walks}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-center">
                          {stat.strikeouts}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-center">
                          {stat.stolenBases}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-center font-bold text-blue-600">
                          {stat.battingAverage.toFixed(3)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-center">
                          {stat.onBasePercentage.toFixed(3)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-center">
                          {stat.sluggingPercentage.toFixed(3)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
