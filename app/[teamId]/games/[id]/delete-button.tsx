"use client"

import { useTransition } from "react"
import { Loader2, Trash2 } from "lucide-react"
import { deleteGame } from "./actions"

interface DeleteButtonProps {
  gameId: string
  teamId: string
}

export function DeleteButton({ gameId, teamId }: DeleteButtonProps) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (!confirm("この試合を削除しますか？")) return
    startTransition(async () => {
      await deleteGame(teamId, gameId)
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-md transition-all hover:bg-red-700 disabled:opacity-50"
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      削除
    </button>
  )
}
