"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { LineupEntry, FieldPosition, Player } from "@/lib/batting-types"
import { FIELD_POSITIONS, SUBSTITUTE_ROLES } from "@/lib/batting-types"
import { sortPlayersByNumber } from "@/lib/sort-utils"

interface PlayerSelectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: number
  currentEntries: LineupEntry[]
  registeredPlayers: Player[]
  onSave: (entries: LineupEntry[]) => void
}

export function PlayerSelectDialog({
  open,
  onOpenChange,
  order,
  currentEntries,
  registeredPlayers,
  onSave,
}: PlayerSelectDialogProps) {
  const [entries, setEntries] = useState<LineupEntry[]>([])

  useEffect(() => {
    if (open) {
      if (currentEntries.length > 0) {
        setEntries(currentEntries)
      } else {
        setEntries([{ playerId: "", playerName: "", positions: [] }])
      }
    }
  }, [open, currentEntries])

  const handlePlayerSelect = (index: number, playerId: string) => {
    const player = registeredPlayers.find(p => p.id === playerId)
    setEntries((prev) => {
      const newEntries = [...prev]
      if (player) {
        newEntries[index] = {
          ...newEntries[index],
          playerId: player.id,
          playerName: player.name,
          isHelper: false,
        }
      } else {
        newEntries[index] = {
          ...newEntries[index],
          playerId: "",
          playerName: "",
          isHelper: false,
        }
      }
      return newEntries
    })
  }

  const handleHelperSelect = (index: number) => {
    setEntries((prev) => {
      const newEntries = [...prev]
      newEntries[index] = {
        ...newEntries[index],
        playerId: "",
        playerName: "助っ人",
        isHelper: true,
      }
      return newEntries
    })
  }

  const handleNameChange = (index: number, name: string) => {
    setEntries((prev) => {
      const newEntries = [...prev]
      newEntries[index] = {
        ...newEntries[index],
        playerName: name,
        playerId: "",
        isHelper: false,
      }
      return newEntries
    })
  }

  const handlePositionToggle = (index: number, pos: FieldPosition) => {
    setEntries((prev) => {
      const newEntries = [...prev]
      const current = newEntries[index].positions ?? []
      const exists = current.includes(pos)
      newEntries[index] = {
        ...newEntries[index],
        positions: exists ? current.filter(p => p !== pos) : [...current, pos],
      }
      return newEntries
    })
  }

  const handlePositionRemove = (index: number, pos: FieldPosition) => {
    setEntries((prev) => {
      const newEntries = [...prev]
      newEntries[index] = {
        ...newEntries[index],
        positions: (newEntries[index].positions ?? []).filter(p => p !== pos),
      }
      return newEntries
    })
  }

  const handleAddSubstitute = () => {
    setEntries((prev) => [
      ...prev,
      { playerId: "", playerName: "", positions: [], isSubstitute: true }
    ])
  }

  const handleRemoveEntry = (index: number) => {
    if (entries.length <= 1) return
    setEntries((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    const validEntries = entries.filter((e) => e.playerName.trim() !== "")
    onSave(validEntries)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {order}番打者
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {entries.map((entry, index) => (
            <div
              key={index}
              className={cn(
                "rounded-xl p-4 space-y-4",
                entry.isSubstitute ? "bg-amber-50 border border-amber-200" : "bg-slate-50"
              )}
            >
              {entry.isSubstitute && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-700 bg-amber-200 px-2 py-1 rounded">
                    打・走・途中出場
                  </span>
                  <button
                    onClick={() => handleRemoveEntry(index)}
                    className="text-xs text-slate-500 hover:text-red-600"
                  >
                    削除
                  </button>
                </div>
              )}

              {/* 選手名 */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">
                  選手名
                </label>
                {registeredPlayers.length > 0 ? (
                  <div className="space-y-2">
                    <select
                      value={entry.isHelper ? "" : entry.playerId}
                      onChange={(e) => handlePlayerSelect(index, e.target.value)}
                      className={cn(
                        "w-full h-12 px-4 text-base rounded-xl",
                        "bg-white border border-slate-200",
                        "focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                      )}
                    >
                      <option value="">選手を選択...</option>
                      {sortPlayersByNumber(registeredPlayers).map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.number ? `${player.number} ` : ""}{player.name}
                        </option>
                      ))}
                    </select>
                    {!entry.isHelper && !entry.playerId && (
                      <input
                        type="text"
                        value={entry.playerName}
                        onChange={(e) => handleNameChange(index, e.target.value)}
                        placeholder="または名前を直接入力"
                        className={cn(
                          "w-full h-10 px-4 text-sm rounded-lg",
                          "bg-white border border-slate-200",
                          "focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                        )}
                      />
                    )}
                  </div>
                ) : (
                  !entry.isHelper && (
                    <input
                      type="text"
                      value={entry.playerName}
                      onChange={(e) => handleNameChange(index, e.target.value)}
                      placeholder="名前を入力"
                      className={cn(
                        "w-full h-12 px-4 text-lg rounded-lg",
                        "bg-white border border-slate-200",
                        "focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                      )}
                    />
                  )
                )}
                <button
                  onClick={() => entry.isHelper ? handlePlayerSelect(index, "") : handleHelperSelect(index)}
                  className={cn(
                    "mt-2 text-xs px-3 py-1.5 rounded-lg transition-all",
                    entry.isHelper
                      ? "bg-purple-50 text-purple-600 border border-purple-300 font-medium"
                      : "text-slate-400 border border-dashed border-slate-300 hover:border-slate-400 hover:text-slate-500"
                  )}
                >
                  {entry.isHelper ? "✓ 助っ人" : "助っ人として登録"}
                </button>
              </div>

              {/* 守備位置 */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">
                  守備位置
                </label>

                {/* 打・走ボタン（途中出場のみ） */}
                {entry.isSubstitute && (
                  <div className="flex gap-2 mb-2">
                    {SUBSTITUTE_ROLES.map((role) => (
                      <button
                        key={role.value}
                        onClick={() => handlePositionToggle(index, role.value)}
                        className={cn(
                          "h-10 px-4 rounded-lg font-bold text-sm transition-all",
                          (entry.positions ?? []).includes(role.value)
                            ? "bg-amber-500 text-white shadow-md scale-105"
                            : "bg-white border border-slate-200 text-slate-600 hover:border-amber-300 hover:bg-amber-50"
                        )}
                      >
                        {role.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* 守備位置グリッド */}
                <div className="grid grid-cols-5 gap-2">
                  {FIELD_POSITIONS.map((pos) => (
                    <button
                      key={pos.value}
                      onClick={() => handlePositionToggle(index, pos.value)}
                      className={cn(
                        "h-10 rounded-lg font-bold text-sm transition-all",
                        (entry.positions ?? []).includes(pos.value)
                          ? "bg-emerald-500 text-white shadow-md scale-105"
                          : "bg-white border border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50"
                      )}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>

                {/* 選択済み守備位置チップ */}
                {(entry.positions ?? []).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(entry.positions ?? []).map((pos, posIdx) => (
                      <span
                        key={posIdx}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 text-xs font-bold"
                      >
                        {pos}
                        <button
                          onClick={() => handlePositionRemove(index, pos)}
                          className="text-emerald-500 hover:text-emerald-800 leading-none"
                          aria-label={`${pos}を削除`}
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 途中出場イニング */}
              {entry.isSubstitute && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2">
                    出場イニング
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((inning) => (
                      <button
                        key={inning}
                        onClick={() => {
                          setEntries((prev) => {
                            const newEntries = [...prev]
                            newEntries[index] = { ...newEntries[index], enteredInning: inning }
                            return newEntries
                          })
                        }}
                        className={cn(
                          "w-8 h-8 rounded text-sm font-bold transition-all",
                          entry.enteredInning === inning
                            ? "bg-amber-500 text-white"
                            : "bg-white border border-slate-200 text-slate-500 hover:border-amber-300"
                        )}
                      >
                        {inning}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* 代打・途中出場追加ボタン */}
          <button
            onClick={handleAddSubstitute}
            className={cn(
              "w-full h-12 rounded-xl border-2 border-dashed border-slate-300",
              "text-slate-500 font-semibold transition-all",
              "hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50"
            )}
          >
            + 途中出場を追加
          </button>
        </div>

        {/* 保存ボタン */}
        <div className="flex gap-3">
          <button
            onClick={() => onOpenChange(false)}
            className={cn(
              "flex-1 h-12 rounded-xl font-semibold transition-all",
              "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            className={cn(
              "flex-1 h-12 rounded-xl font-semibold transition-all",
              "bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/25"
            )}
          >
            保存
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
