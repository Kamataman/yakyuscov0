"use client"

import { useEffect, useState } from "react"
import { Loader2, Trash2 } from "lucide-react"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { cn } from "@/lib/utils"
import { PLAYER_POSITIONS, THROW_BAT_OPTIONS, type PlayerPosition, type ThrowBat } from "@/lib/player-profile"

export interface PlayerFormValues {
  name: string
  number: string
  position: PlayerPosition | null
  throwBat: ThrowBat | null
}

interface PlayerFormDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "add" | "edit"
  initialValues?: PlayerFormValues
  isSaving: boolean
  error: string | null
  onSubmit: (values: PlayerFormValues) => void
  onRequestDelete?: () => void
}

const EMPTY_VALUES: PlayerFormValues = { name: "", number: "", position: null, throwBat: null }

export function PlayerFormDrawer({
  open,
  onOpenChange,
  mode,
  initialValues,
  isSaving,
  error,
  onSubmit,
  onRequestDelete,
}: PlayerFormDrawerProps) {
  const [name, setName] = useState("")
  const [number, setNumber] = useState("")
  const [position, setPosition] = useState<PlayerPosition | null>(null)
  const [throwBat, setThrowBat] = useState<ThrowBat | null>(null)

  useEffect(() => {
    if (open) {
      const values = initialValues ?? EMPTY_VALUES
      setName(values.name)
      setNumber(values.number)
      setPosition(values.position)
      setThrowBat(values.throwBat)
    }
  }, [open, initialValues])

  const handleSubmit = () => {
    if (!name.trim()) return
    onSubmit({ name: name.trim(), number: number.trim(), position, throwBat })
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92vh]">
        <DrawerHeader>
          <DrawerTitle className="text-xl font-bold text-foreground">
            {mode === "add" ? "選手を追加" : "選手を編集"}
          </DrawerTitle>
        </DrawerHeader>

        <div className="space-y-5 overflow-y-auto px-4 py-2">
          {error && (
            <p className="border border-stitch/40 bg-stitch/10 px-4 py-3 text-sm text-stitch">{error}</p>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">選手名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-input px-4 py-3 text-sm focus:border-turf focus:outline-none focus:ring-1 focus:ring-turf"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">背番号</label>
            <input
              type="text"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              maxLength={3}
              className="w-24 border border-input px-4 py-3 text-sm focus:border-turf focus:outline-none focus:ring-1 focus:ring-turf"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">ポジション</label>
            <div className="grid grid-cols-3 gap-2">
              {PLAYER_POSITIONS.map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => setPosition(position === pos ? null : pos)}
                  className={cn(
                    "px-1 py-2 border text-sm font-bold transition-all",
                    position === pos
                      ? "border-turf bg-turf-tint text-turf"
                      : "border-border bg-background text-muted-foreground hover:border-turf/50 hover:bg-turf/10"
                  )}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">投打</label>
            <div className="grid grid-cols-3 gap-2">
              {THROW_BAT_OPTIONS.map((tb) => (
                <button
                  key={tb}
                  type="button"
                  onClick={() => setThrowBat(throwBat === tb ? null : tb)}
                  className={cn(
                    "h-10 border text-sm font-bold transition-all",
                    throwBat === tb
                      ? "border-turf bg-turf-tint text-turf"
                      : "border-border bg-background text-muted-foreground hover:border-turf/50 hover:bg-turf/10"
                  )}
                >
                  {tb}
                </button>
              ))}
            </div>
          </div>

          {mode === "edit" && onRequestDelete && (
            <button
              type="button"
              onClick={onRequestDelete}
              className="flex items-center gap-2 text-sm font-medium text-stitch hover:underline"
            >
              <Trash2 className="h-4 w-4" />
              この選手を削除
            </button>
          )}
        </div>

        <div className="flex gap-3 p-4 pt-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-12 flex-1 bg-muted font-semibold text-foreground/70 transition-all hover:bg-muted-foreground/20"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!name.trim() || isSaving}
            className="flex h-12 flex-1 items-center justify-center gap-2 bg-turf font-semibold text-turf-foreground transition-all hover:bg-turf/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            保存
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
