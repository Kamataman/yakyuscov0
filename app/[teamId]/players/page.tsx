"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { PlusCircle, Users, Loader2, X, Pencil, Trash2, Check } from "lucide-react"

interface Player {
  id: string
  name: string
  number?: number
}

export default function PlayersPage() {
  const params = useParams()
  const teamId = params.teamId as string
  
  const [players, setPlayers] = useState<Player[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState("")
  const [newNumber, setNewNumber] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editNumber, setEditNumber] = useState("")

  useEffect(() => {
    Promise.all([
      fetch(`/api/players?teamId=${teamId}`).then(res => res.json()),
      fetch(`/api/auth/status?teamId=${teamId}`).then(res => res.json()),
    ])
      .then(([playersData, authData]) => {
        if (Array.isArray(playersData)) {
          setPlayers(playersData)
        }
        setIsAdmin(authData.isAdmin === true)
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [teamId])

  const handleAdd = async () => {
    if (!newName.trim()) {
      alert("名前を入力してください")
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId,
          name: newName.trim(),
          number: newNumber ? parseInt(newNumber) : null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "保存に失敗しました")
      }

      const player = await response.json()
      setPlayers((prev) => [...prev, player])
      setNewName("")
      setNewNumber("")
      setIsAdding(false)
    } catch (error) {
      console.error(error)
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
      const response = await fetch(`/api/players/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          number: editNumber ? parseInt(editNumber) : null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "更新に失敗しました")
      }

      const updated = await response.json()
      setPlayers((prev) => prev.map((p) => (p.id === editingId ? updated : p)))
      setEditingId(null)
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : "更新に失敗しました")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("この選手を削除しますか？")) return

    try {
      const response = await fetch(`/api/players/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "削除に失敗しました")
      }

      setPlayers((prev) => prev.filter((p) => p.id !== id))
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : "削除に失敗しました")
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200">
      <div className="mx-auto max-w-6xl p-4 md:p-6">
        <h1 className="mb-6 text-xl font-bold text-slate-800">選手一覧</h1>

        {/* 新規追加ボタン（管理者のみ） */}
        {isAdmin && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-white shadow-md transition-all hover:bg-blue-700 active:scale-[0.98]"
          >
            <PlusCircle className="h-5 w-5" />
            <span className="font-bold">選手を追加</span>
          </button>
        )}

        {/* 新規追加フォーム */}
        {isAdding && (
          <div className="mb-6 rounded-xl bg-white p-4 shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-slate-800">新しい選手を追加</h2>
              <button
                onClick={() => setIsAdding(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="名前"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <input
                type="number"
                value={newNumber}
                onChange={(e) => setNewNumber(e.target.value)}
                placeholder="背番号"
                className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={handleAdd}
                disabled={isSaving}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "追加"
                )}
              </button>
            </div>
          </div>
        )}

        {/* 選手リスト */}
        {isLoading ? (
          <div className="flex items-center justify-center rounded-2xl bg-white p-8 shadow-md">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : players.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-md">
            <Users className="mx-auto mb-3 h-12 w-12 text-slate-300" />
            <p className="text-slate-500">まだ選手が登録されていません</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-white shadow-md">
            <div className="divide-y divide-slate-100">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center gap-4 px-4 py-3"
                >
                  {editingId === player.id ? (
                    // 編集モード
                    <>
                      <input
                        type="number"
                        value={editNumber}
                        onChange={(e) => setEditNumber(e.target.value)}
                        placeholder="番号"
                        className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-sm text-center"
                      />
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 rounded-lg border border-slate-300 px-3 py-1 text-sm"
                      />
                      <button
                        onClick={handleSaveEdit}
                        disabled={isSaving}
                        className="rounded-lg bg-emerald-600 p-2 text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded-lg bg-slate-200 p-2 text-slate-600 hover:bg-slate-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    // 表示モード
                    <>
                      {player.number !== undefined && player.number !== null && (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                          {player.number}
                        </div>
                      )}
                      <span className="flex-1 font-medium text-slate-800">
                        {player.name}
                      </span>
                      {/* 編集・削除ボタン（管理者のみ） */}
                      {isAdmin && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(player)}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(player.id)}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-red-600"
                          >
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
    </main>
  )
}
