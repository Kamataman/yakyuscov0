"use client"

import { useState, useTransition } from "react"
import { Loader2, Trash2 } from "lucide-react"
import { deleteGame } from "./actions"
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog"

interface DeleteButtonProps {
  gameId: string
  teamId: string
}

export function DeleteButton({ gameId, teamId }: DeleteButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  const handleConfirm = () => {
    setOpen(false)
    startTransition(async () => {
      await deleteGame(teamId, gameId)
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={isPending}
        className="flex items-center gap-2 border border-stitch px-4 py-2 text-sm font-bold text-stitch transition-colors hover:bg-stitch hover:text-stitch-foreground disabled:opacity-50"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        削除
      </button>
      <ConfirmDeleteDialog
        open={open}
        onOpenChange={setOpen}
        title="試合を削除しますか？"
        description="この操作は取り消せません。試合に関連するすべてのデータが削除されます。"
        onConfirm={handleConfirm}
        isPending={isPending}
      />
    </>
  )
}
