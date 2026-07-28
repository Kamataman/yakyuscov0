"use client"

import { useState } from "react"
import { PlusCircle, Users, MoreVertical } from "lucide-react"
import { sortPlayersByNumber } from "@/lib/sort-utils"
import type { PlayerPosition, ThrowBat } from "@/lib/player-profile"
import { addPlayer, updatePlayer, deletePlayer, type PlayerRecord } from "./actions"
import { PlayerFormDrawer, type PlayerFormValues } from "./player-form-drawer"
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog"

interface PlayersClientProps {
  initialPlayers: PlayerRecord[]
  isAdmin: boolean
  teamId: string
}

function playerLabel(player: PlayerRecord): string {
  return player.number ? `#${player.number} ${player.name}` : player.name
}

function toFormValues(player: PlayerRecord): PlayerFormValues {
  return {
    name: player.name,
    number: player.number?.toString() ?? "",
    position: (player.position as PlayerPosition | null) ?? null,
    throwBat: (player.throw_bat as ThrowBat | null) ?? null,
  }
}

export function PlayersClient({ initialPlayers, isAdmin, teamId }: PlayersClientProps) {
  const [players, setPlayers] = useState<PlayerRecord[]>(initialPlayers)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<"add" | "edit">("add")
  const [editingPlayer, setEditingPlayer] = useState<PlayerRecord | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [drawerError, setDrawerError] = useState<string | null>(null)

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const openAddDrawer = () => {
    setDrawerMode("add")
    setEditingPlayer(null)
    setDrawerError(null)
    setDrawerOpen(true)
  }

  const openEditDrawer = (player: PlayerRecord) => {
    setDrawerMode("edit")
    setEditingPlayer(player)
    setDrawerError(null)
    setDrawerOpen(true)
  }

  const handleSubmit = async (values: PlayerFormValues) => {
    setIsSaving(true)
    setDrawerError(null)
    try {
      if (drawerMode === "add") {
        const player = await addPlayer(teamId, values.name, values.number || null, {
          position: values.position,
          throwBat: values.throwBat,
        })
        setPlayers((prev) => sortPlayersByNumber([...prev, player]))
      } else if (editingPlayer) {
        const updated = await updatePlayer(
          teamId,
          editingPlayer.id,
          values.name,
          values.number || null,
          values.position,
          values.throwBat
        )
        setPlayers((prev) =>
          sortPlayersByNumber(prev.map((p) => (p.id === editingPlayer.id ? updated : p)))
        )
      }
      setDrawerOpen(false)
    } catch (error) {
      setDrawerError(error instanceof Error ? error.message : "保存に失敗しました")
    } finally {
      setIsSaving(false)
    }
  }

  const handleRequestDelete = () => {
    if (!editingPlayer) return
    setDeleteTargetId(editingPlayer.id)
    setDrawerOpen(false)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return
    const id = deleteTargetId
    setIsDeleting(true)
    try {
      await deletePlayer(teamId, id)
      setPlayers((prev) => prev.filter((p) => p.id !== id))
      setDeleteTargetId(null)
    } catch (error) {
      setDrawerError(error instanceof Error ? error.message : "削除に失敗しました")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl p-4 md:p-6">
        <h1 className="mb-6 text-xl font-bold text-foreground border-b-4 border-foreground pb-2">選手一覧</h1>

        {isAdmin && (
          <button
            onClick={openAddDrawer}
            className="diagonal-cut mb-6 flex w-full items-center justify-center gap-2 bg-turf px-4 py-3 text-turf-foreground transition-opacity hover:opacity-90 active:scale-[0.98]"
          >
            <PlusCircle className="h-5 w-5" />
            <span className="font-bold">選手を追加</span>
          </button>
        )}

        {players.length === 0 ? (
          <div className="border border-border p-8 text-center">
            <Users className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">まだ選手が登録されていません</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {players.map((player) => (
              <div key={player.id} className="relative border border-border p-3">
                {isAdmin && (
                  <button
                    onClick={() => openEditDrawer(player)}
                    aria-label={`${player.name}を編集`}
                    className="absolute right-1.5 top-1.5 p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                )}
                <p className="pr-6 font-bold text-foreground">{playerLabel(player)}</p>
                {(player.position || player.throw_bat) && (
                  <div className="mt-2 flex flex-col items-start gap-1.5">
                    {player.position && (
                      <span className="bg-turf-tint px-1.5 py-0.5 text-xs font-bold text-turf">
                        {player.position}
                      </span>
                    )}
                    {player.throw_bat && (
                      <span className="text-xs text-muted-foreground">{player.throw_bat}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <PlayerFormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        mode={drawerMode}
        initialValues={editingPlayer ? toFormValues(editingPlayer) : undefined}
        isSaving={isSaving}
        error={drawerError}
        onSubmit={handleSubmit}
        onRequestDelete={drawerMode === "edit" ? handleRequestDelete : undefined}
      />

      <ConfirmDeleteDialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null)
        }}
        title="選手を削除しますか？"
        description="この操作は取り消せません。選手に関連するすべてのデータが削除されます。"
        onConfirm={handleConfirmDelete}
        isPending={isDeleting}
      />
    </main>
  )
}
