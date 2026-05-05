"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, UserPlus } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import type { Player } from "@/lib/batting-types"
import { sortPlayersByNumber } from "@/lib/sort-utils"
import { addPlayer } from "@/app/[teamId]/players/actions"

interface PlayerComboboxProps {
  players: Player[]
  value: string
  onChange: (player: Player | null) => void
  teamId: string
  onPlayerAdded?: (player: Player) => void
  isAdmin?: boolean
  shareToken?: string
  placeholder?: string
  className?: string
}

function formatPlayerLabel(player: Player): string {
  return player.number ? `#${player.number} ${player.name}` : player.name
}

export function PlayerCombobox({
  players,
  value,
  onChange,
  teamId,
  onPlayerAdded,
  isAdmin = false,
  shareToken,
  placeholder = "選手を選択...",
  className,
}: PlayerComboboxProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [registerOpen, setRegisterOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newNumber, setNewNumber] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canAddPlayer = isAdmin || !!shareToken
  const sortedPlayers = sortPlayersByNumber(players)
  const selectedPlayer = players.find((p) => p.id === value) ?? null

  const handleRegister = async () => {
    if (!newName.trim()) return
    setIsSubmitting(true)
    setError(null)
    try {
      const data = await addPlayer(teamId, newName.trim(), newNumber.trim() || null, shareToken)
      const player: Player = { id: data.id, name: data.name, number: data.number }
      onPlayerAdded?.(player)
      onChange(player)
      setRegisterOpen(false)
      setSearchOpen(false)
      setNewName("")
      setNewNumber("")
    } catch (e) {
      setError(e instanceof Error ? e.message : "登録に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* 選手選択トリガーボタン */}
      <button
        type="button"
        onClick={() => {
          setSearchValue("")
          setSearchOpen(true)
        }}
        className={cn(
          "w-full h-12 px-4 flex items-center justify-between rounded-xl",
          "bg-white border border-slate-200 text-base",
          "focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400",
          className
        )}
      >
        <span className={selectedPlayer ? "text-slate-800" : "text-slate-400"}>
          {selectedPlayer ? formatPlayerLabel(selectedPlayer) : placeholder}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </button>

      {/* 選手検索ダイアログ */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-w-sm p-0 gap-0">
          <DialogHeader className="sr-only">
            <DialogTitle>選手を選択</DialogTitle>
          </DialogHeader>
          <Command>
            <CommandInput
              placeholder="名前で検索..."
              value={searchValue}
              onValueChange={setSearchValue}
              className="h-14 text-base"
            />
            <CommandList className="max-h-[50vh] overflow-y-auto">
              <CommandEmpty>
                {canAddPlayer ? (
                  <button
                    type="button"
                    onClick={() => {
                      setNewName(searchValue)
                      setRegisterOpen(true)
                    }}
                    className="w-full py-4 px-4 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4 shrink-0" />
                    {searchValue ? `「${searchValue}」を登録` : "選手を登録"}
                  </button>
                ) : (
                  <p className="py-4 text-sm text-slate-400">一致する選手がいません</p>
                )}
              </CommandEmpty>
              <CommandGroup>
                {sortedPlayers.map((player) => (
                  <CommandItem
                    key={player.id}
                    value={player.name}
                    className="py-3 text-base"
                    onSelect={() => {
                      onChange(player)
                      setSearchOpen(false)
                      setSearchValue("")
                    }}
                  >
                    <Check
                      className={cn("mr-2 h-4 w-4 shrink-0", value === player.id ? "opacity-100" : "opacity-0")}
                    />
                    {formatPlayerLabel(player)}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>

      {/* 選手登録ダイアログ */}
      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>選手を登録</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1 block">
                選手名 <span className="text-red-500">*</span>
              </label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="選手名を入力"
                className="h-11"
                onKeyDown={(e) => e.key === "Enter" && handleRegister()}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1 block">背番号</label>
              <Input
                value={newNumber}
                onChange={(e) => setNewNumber(e.target.value)}
                placeholder="例: 10"
                className="h-11"
                onKeyDown={(e) => e.key === "Enter" && handleRegister()}
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setRegisterOpen(false)
                setError(null)
              }}
              className="flex-1 h-12 rounded-xl font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleRegister}
              disabled={!newName.trim() || isSubmitting}
              className="flex-1 h-12 rounded-xl font-semibold bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? "登録中..." : "登録"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
