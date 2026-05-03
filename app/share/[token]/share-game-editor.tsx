"use client"

import { GameEditor } from "@/components/game-editor"
import type { Player } from "@/lib/batting-types"

interface ShareGameEditorProps {
  gameId: string
  teamId: string
  shareToken: string
  opponent: string
  date: string
  players: Player[]
}

export function ShareGameEditor({ gameId, teamId, shareToken, opponent, date, players }: ShareGameEditorProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200">
      {/* 共有用のシンプルなヘッダー */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-slate-800">試合結果入力</h1>
              <p className="text-sm text-slate-500">
                {date} vs {opponent}
              </p>
            </div>
            <div className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">
              共有リンクからのアクセス
            </div>
          </div>
        </div>
      </header>

      <GameEditor
        gameId={gameId}
        teamId={teamId}
        shareToken={shareToken}
        isAdmin={false}
        players={players}
      />
    </div>
  )
}
