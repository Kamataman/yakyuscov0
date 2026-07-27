"use client"

import { useState } from "react"
import { PlusCircle, Users, Loader2, X, Pencil, Trash2, Check } from "lucide-react"
import { sortPlayersByNumber } from "@/lib/sort-utils"
import { addPlayer, updatePlayer, deletePlayer } from "./actions"
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog"

interface Player {
  id: string
  name: string
  number?: string
}

interface PlayersClientProps {
  initialPlayers: Player[]
  isAdmin: boolean
  teamId: string
}

export function PlayersClient({ initialPlayers, isAdmin, teamId }: PlayersClientProps) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers)
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState("")
  const [newNumber, setNewNumber] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editNumber, setEditNumber] = useState("")
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const handleAdd = async () => {
    if (!newName.trim()) {
      alert("名前を入力してください")
      return
    }
    setIsSaving(true)
    try {
      const player = await addPlayer(teamId, newName.trim(), newNumber.trim() || null)
      setPlayers((prev) => sortPlayersByNumber([...prev, player]))
      setNewName("")
      setNewNumber("")
      setIsAdding(false)
    } catch (error) {
      alert(error instanceof Error ? error.message : "保存に失敗しました")
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = (player: Player) => {
    setEditingId(player.id)
    setEditName(player.name)
    setEditNumber(player.number?.toString() || "")
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) return
    setIsSaving(true)
    try {
      const updated = await updatePlayer(teamId, editingId, editName.trim(), editNumber.trim() || null)
      setPlayers((prev) => sortPlayersByNumber(prev.map((p) => (p.id === editingId ? updated : p))))
      setEditingId(null)
    } catch (error) {
      alert(error instanceof Error ? error.message : "更新に失敗しました")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = (id: string) => {
    setDeleteTargetId(id)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return
    const id = deleteTargetId
    setDeleteTargetId(null)
    try {
      await deletePlayer(teamId, id)
      setPlayers((prev) => prev.filter((p) => p.id !== id))
    } catch (error) {
      alert(error instanceof Error ? error.message : "削除に失敗しました")
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl p-4 md:p-6">
        <h1 className="mb-6 text-xl font-bold text-foreground border-b-4 border-foreground pb-2">選手一覧</h1>

        {isAdmin && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="diagonal-cut mb-6 flex w-full items-center justify-center gap-2 bg-turf px-4 py-3 text-turf-foreground transition-opacity hover:opacity-90 active:scale-[0.98]"
          >
            <PlusCircle className="h-5 w-5" />
            <span className="font-bold">選手を追加</span>
          </button>
        )}

        {isAdding && (
          <div className="mb-6 border border-border p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-foreground">新しい選手を追加</h2>
              <button onClick={() => setIsAdding(false)} className="p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="名前"
                className="flex-1 border border-input px-3 py-2 text-sm focus:border-turf focus:outline-none focus:ring-1 focus:ring-turf"
              />
              <input
                type="text"
                value={newNumber}
                onChange={(e) => setNewNumber(e.target.value)}
                placeholder="背番号"
                maxLength={3}
                className="w-24 border border-input px-3 py-2 text-sm focus:border-turf focus:outline-none focus:ring-1 focus:ring-turf"
              />
              <button
                onClick={handleAdd}
                disabled={isSaving}
                className="flex items-center gap-2 bg-turf px-4 py-2 text-sm font-bold text-turf-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "追加"}
              </button>
            </div>
          </div>
        )}

        {players.length === 0 ? (
          <div className="border border-border p-8 text-center">
            <Users className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">まだ選手が登録されていません</p>
          </div>
        ) : (
          <div className="border border-border">
            <div className="divide-y divide-border">
              {players.map((player) => (
                <div key={player.id} className="flex items-center gap-4 px-4 py-3">
                  {editingId === player.id ? (
                    <>
                      <input
                        type="text"
                        value={editNumber}
                        onChange={(e) => setEditNumber(e.target.value)}
                        placeholder="番号"
                        maxLength={3}
                        className="w-16 border border-input px-2 py-1 text-sm text-center"
                      />
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 border border-input px-3 py-1 text-sm"
                      />
                      <button onClick={handleSaveEdit} disabled={isSaving} className="bg-turf p-2 text-turf-foreground hover:bg-turf/90 disabled:opacity-50">
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      </button>
                      <button onClick={() => setEditingId(null)} className="bg-muted p-2 text-foreground/70 hover:bg-muted-foreground/20">
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      {player.number !== undefined && player.number !== null && (
                        <div className="font-display flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background">
                          {player.number}
                        </div>
                      )}
                      <span className="flex-1 font-medium text-foreground">{player.name}</span>
                      {isAdmin && (
                        <div className="flex gap-2">
                          <button onClick={() => handleEdit(player)} className="p-2 text-muted-foreground hover:bg-muted hover:text-turf">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(player.id)} className="p-2 text-muted-foreground hover:bg-muted hover:text-stitch">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <ConfirmDeleteDialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => { if (!open) setDeleteTargetId(null) }}
        title="選手を削除しますか？"
        description="この操作は取り消せません。選手に関連するすべてのデータが削除されます。"
        onConfirm={handleConfirmDelete}
      />
    </main>
  )
}
