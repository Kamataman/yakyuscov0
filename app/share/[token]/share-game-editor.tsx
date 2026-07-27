"use client"

import Link from "next/link"
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
    <div className="min-h-screen bg-background">
      {/* 共有用のシンプルなヘッダー */}
      <header className="bg-background border-b-4 border-turf">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-foreground">試合結果入力</h1>
              <p className="text-sm text-muted-foreground">
                {date} vs {opponent}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/${teamId}`}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                チームトップへ
              </Link>
              <div className="text-xs text-turf bg-turf/10 px-2 py-1">
                共有リンクからのアクセス
              </div>
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
