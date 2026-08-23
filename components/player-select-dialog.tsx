"use client"

import { useState, useEffect } from "react"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { cn } from "@/lib/utils"
import type { LineupEntry, FieldPosition, Player } from "@/lib/batting-types"
import { FIELD_POSITIONS, SUBSTITUTE_ROLES } from "@/lib/batting-types"
import { PINCH_HITTER_POSITION, PINCH_RUNNER_POSITION } from "@/lib/lineup-assignment"
import { PlayerCombobox } from "@/components/player-combobox"

/** 途中出場の打席がどのイニングから成績に反映されるかを説明する */
function describeSubstituteScoring(positions: string[], enteredInning?: number): string {
  const inning = enteredInning ? `${enteredInning}回` : "出場イニング"
  if (positions.includes(PINCH_RUNNER_POSITION)) {
    const next = enteredInning ? `${enteredInning + 1}回` : "次のイニング"
    return `代走: ${inning}の打席には立たないため、${next}の打席から成績が付きます`
  }
  if (positions.includes(PINCH_HITTER_POSITION)) {
    return `代打: ${inning}の打席から成績が付きます`
  }
  return `${inning}の打席から成績が付きます`
}

interface PlayerSelectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: number
  currentEntries: LineupEntry[]
  registeredPlayers: Player[]
  onSave: (entries: LineupEntry[]) => void
  teamId: string
  onPlayerAdded: (player: Player) => void
  isAdmin?: boolean
  shareToken?: string
}

export function PlayerSelectDialog({
  open,
  onOpenChange,
  order,
  currentEntries,
  registeredPlayers,
  onSave,
  teamId,
  onPlayerAdded,
  isAdmin = false,
  shareToken,
}: PlayerSelectDialogProps) {
  const [entries, setEntries] = useState<LineupEntry[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setError(null)
      if (currentEntries.length > 0) {
        setEntries(currentEntries)
      } else {
        setEntries([{ playerId: "", playerName: "", positions: [] }])
      }
    }
  }, [open, currentEntries])

  const handlePlayerSelect = (index: number, player: Player | null) => {
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

  const handlePositionAdd = (index: number, pos: FieldPosition) => {
    setEntries((prev) => {
      const newEntries = [...prev]
      const current = newEntries[index].positions ?? []
      if (current.includes(pos)) return prev
      // 代打と代走は同時に成立しないため、片方を選んだらもう片方を外す
      const isRole = pos === PINCH_HITTER_POSITION || pos === PINCH_RUNNER_POSITION
      const kept = isRole
        ? current.filter((p) => p !== PINCH_HITTER_POSITION && p !== PINCH_RUNNER_POSITION)
        : current
      newEntries[index] = {
        ...newEntries[index],
        positions: [...kept, pos],
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
    const missingInning = validEntries.some((e) => e.isSubstitute && !e.enteredInning)
    if (missingInning) {
      setError("途中出場選手の出場イニングを選択してください")
      return
    }
    setError(null)
    onSave(validEntries)
    onOpenChange(false)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92vh]">
        <DrawerHeader>
          <DrawerTitle className="text-xl font-bold text-foreground">
            {order}番打者
          </DrawerTitle>
        </DrawerHeader>

        <div className="space-y-4 py-4 px-4 overflow-y-auto">
          {entries.map((entry, index) => (
            <div
              key={index}
              className={cn(
                "p-4 space-y-4",
                entry.isSubstitute ? "bg-amber-50 border border-amber-200" : "bg-muted"
              )}
            >
              {entry.isSubstitute && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-700 bg-amber-200 px-2 py-1">
                    打・走・途中出場
                  </span>
                  <button
                    onClick={() => handleRemoveEntry(index)}
                    className="text-xs text-muted-foreground hover:text-stitch"
                  >
                    削除
                  </button>
                </div>
              )}

              {/* 選手名 */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2">
                  選手名
                </label>
                {!entry.isHelper && (
                  <PlayerCombobox
                    players={registeredPlayers}
                    value={entry.playerId}
                    onChange={(player) => handlePlayerSelect(index, player)}
                    teamId={teamId}
                    onPlayerAdded={onPlayerAdded}
                    isAdmin={isAdmin}
                    shareToken={shareToken}
                  />
                )}
                <button
                  onClick={() => entry.isHelper ? handlePlayerSelect(index, null) : handleHelperSelect(index)}
                  className={cn(
                    "mt-2 text-xs px-3 py-1.5 transition-all",
                    entry.isHelper
                      ? "bg-amber-50 text-amber-700 border border-amber-300 font-medium"
                      : "text-muted-foreground border border-dashed border-border hover:border-foreground/40 hover:text-foreground"
                  )}
                >
                  {entry.isHelper ? "✓ 助っ人" : "助っ人として登録"}
                </button>
              </div>

              {/* 守備位置 */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2">
                  守備位置
                </label>

                {/* 打・走ボタン（途中出場のみ） */}
                {entry.isSubstitute && (
                  <div className="grid grid-cols-5 gap-2 mb-2">
                    {SUBSTITUTE_ROLES.map((role) => (
                      <button
                        key={role.value}
                        onClick={() => handlePositionAdd(index, role.value)}
                        className="h-10 font-bold text-sm transition-all bg-background border border-border text-muted-foreground hover:border-amber-300 hover:bg-amber-50"
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
                      onClick={() => handlePositionAdd(index, pos.value)}
                      className="h-10 font-bold text-sm transition-all bg-background border border-border text-muted-foreground hover:border-turf/50 hover:bg-turf/10"
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
                        className="inline-flex items-center gap-1 px-2 py-1 bg-turf/15 text-turf text-xs font-bold"
                      >
                        {pos}
                        <button
                          onClick={() => handlePositionRemove(index, pos)}
                          className="text-turf/70 hover:text-turf leading-none"
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
                  <label className="block text-xs font-semibold text-muted-foreground mb-2">
                    出場イニング
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((inning) => (
                      <button
                        key={inning}
                        onClick={() => {
                          setError(null)
                          setEntries((prev) => {
                            const newEntries = [...prev]
                            newEntries[index] = { ...newEntries[index], enteredInning: inning }
                            return newEntries
                          })
                        }}
                        className={cn(
                          "font-display w-8 h-8 text-sm font-bold transition-all",
                          entry.enteredInning === inning
                            ? "bg-amber-500 text-white"
                            : "bg-background border border-border text-muted-foreground hover:border-amber-300"
                        )}
                      >
                        {inning}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    {describeSubstituteScoring(entry.positions ?? [], entry.enteredInning)}
                  </p>
                </div>
              )}
            </div>
          ))}

          {/* 代打・途中出場追加ボタン */}
          <button
            onClick={handleAddSubstitute}
            className={cn(
              "w-full h-12 border-2 border-dashed border-border",
              "text-muted-foreground font-semibold transition-all",
              "hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50"
            )}
          >
            + 途中出場を追加
          </button>
        </div>

        {/* バリデーションエラー */}
        {error && (
          <p className="text-sm text-stitch font-medium text-center px-4">
            {error}
          </p>
        )}

        {/* 保存ボタン */}
        <div className="flex gap-3 p-4 pt-2">
          <button
            onClick={() => onOpenChange(false)}
            className={cn(
              "flex-1 h-12 font-semibold transition-all",
              "bg-muted text-foreground/70 hover:bg-muted-foreground/20"
            )}
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            className={cn(
              "flex-1 h-12 font-semibold transition-all",
              "bg-turf text-turf-foreground hover:bg-turf/90"
            )}
          >
            保存
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
