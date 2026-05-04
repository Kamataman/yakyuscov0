"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, UserPlus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
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
  const [open, setOpen] = useState(false)
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
      setOpen(false)
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
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
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
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="名前で検索..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>
                {canAddPlayer ? (
                  <button
                    type="button"
                    onClick={() => {
                      setNewName(searchValue)
                      setRegisterOpen(true)
                    }}
                    className="w-full py-3 px-4 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4 shrink-0" />
                    {searchValue ? `「${searchValue}」を登録` : "選手を登録"}
                  </button>
                ) : (
                  <p className="py-3 text-sm text-slate-400">一致する選手がいません</p>
                )}
              </CommandEmpty>
              <CommandGroup>
                {sortedPlayers.map((player) => (
                  <CommandItem
                    key={player.id}
                    value={player.name}
                    onSelect={() => {
                      onChange(player)
                      setOpen(false)
                      setSearchValue("")
                    }}
                  >
                    <Check
                      className={cn("mr-2 h-4 w-4", value === player.id ? "opacity-100" : "opacity-0")}
                    />
                    {formatPlayerLabel(player)}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

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
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setRegisterOpen(false)
                setError(null)
              }}
            >
              キャンセル
            </Button>
            <Button
              className="flex-1"
              onClick={handleRegister}
              disabled={!newName.trim() || isSubmitting}
            >
              {isSubmitting ? "登録中..." : "登録"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
