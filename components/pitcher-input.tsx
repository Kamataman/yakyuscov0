"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { PitcherResult, Player } from "@/lib/batting-types"
import { Plus, Trash2, Trophy, ThumbsDown, Shield, Star, Minus } from "lucide-react"

interface PitcherInputProps {
  pitchers: PitcherResult[]
  onPitchersChange: (pitchers: PitcherResult[]) => void
  registeredPlayers?: Player[]
}

export function PitcherInput({ 
  pitchers, 
  onPitchersChange, 
  registeredPlayers = [] 
}: PitcherInputProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [form, setForm] = useState<PitcherResult>({
    playerId: "",
    playerName: "",
    inningsPitched: 0,
    hits: 0,
    runs: 0,
    earnedRuns: 0,
    strikeouts: 0,
    walks: 0,
    hitByPitch: 0,
    homeRuns: 0,
  })

  const handleAdd = () => {
    setEditingIndex(null)
    setForm({
      playerId: "",
      playerName: "",
      inningsPitched: 0,
      hits: 0,
      runs: 0,
      earnedRuns: 0,
      strikeouts: 0,
      walks: 0,
      hitByPitch: 0,
      homeRuns: 0,
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (index: number) => {
    setEditingIndex(index)
    setForm(pitchers[index])
    setIsDialogOpen(true)
  }

  const handleDelete = (index: number) => {
    onPitchersChange(pitchers.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    if (!form.playerName.trim()) return
    
    if (editingIndex !== null) {
      const newPitchers = [...pitchers]
      newPitchers[editingIndex] = form
      onPitchersChange(newPitchers)
    } else {
      onPitchersChange([...pitchers, { ...form, playerId: crypto.randomUUID() }])
    }
    setIsDialogOpen(false)
  }

  const formatInnings = (innings: number) => {
    const whole = Math.floor(innings)
    const fraction = innings - whole
    if (fraction < 0.17) return `${whole}`
    if (fraction < 0.5) return `${whole} 1/3`
    if (fraction < 0.84) return `${whole} 2/3`
    return `${whole + 1}`
  }

  const StatButton = ({ 
    label, 
    value, 
    onChange,
    min = 0,
    max = 99,
    step = 1,
  }: { 
    label: string
    value: number
    onChange: (v: number) => void
    min?: number
    max?: number
    step?: number
  }) => (
    <div className="flex flex-col items-center">
      <span className="text-xs font-medium text-slate-500 mb-2">{label}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(min, +(value - step).toFixed(2)))}
          className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-colors flex items-center justify-center"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="w-12 text-center font-bold text-xl text-slate-800">
          {step === 0.34 ? formatInnings(value) : value}
        </span>
        <button
          onClick={() => onChange(Math.min(max, +(value + step).toFixed(2)))}
          className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-colors flex items-center justify-center"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  )

  const DecisionButton = ({
    label,
    icon: Icon,
    active,
    onClick,
    color,
  }: {
    label: string
    icon: typeof Trophy
    active?: boolean
    onClick: () => void
    color: string
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all",
        active 
          ? `${color} text-white shadow-lg scale-105` 
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  )

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <h2 className="font-bold text-slate-700">投手成績</h2>
        <Button size="sm" variant="outline" onClick={handleAdd} className="gap-1">
          <Plus className="w-4 h-4" />
          追加
        </Button>
      </div>

      {pitchers.length === 0 ? (
        <div className="p-8 text-center text-slate-400">
          投手を追加してください
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2 text-left font-medium">投手</th>
                <th className="px-2 py-2 text-center font-medium">回</th>
                <th className="px-2 py-2 text-center font-medium">被安</th>
                <th className="px-2 py-2 text-center font-medium">失点</th>
                <th className="px-2 py-2 text-center font-medium">自責</th>
                <th className="px-2 py-2 text-center font-medium">奪三</th>
                <th className="px-2 py-2 text-center font-medium">四球</th>
                <th className="px-2 py-2 text-center font-medium">死球</th>
                <th className="px-2 py-2 text-center font-medium">被本</th>
                <th className="px-2 py-2 text-center font-medium">決着</th>
                <th className="px-2 py-2 text-center font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pitchers.map((pitcher, index) => (
                <tr 
                  key={pitcher.playerId} 
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => handleEdit(index)}
                >
                  <td className="px-3 py-2 font-medium text-slate-800">{pitcher.playerName}</td>
                  <td className="px-2 py-2 text-center">{formatInnings(pitcher.inningsPitched)}</td>
                  <td className="px-2 py-2 text-center">{pitcher.hits}</td>
                  <td className="px-2 py-2 text-center">{pitcher.runs}</td>
                  <td className="px-2 py-2 text-center">{pitcher.earnedRuns}</td>
                  <td className="px-2 py-2 text-center">{pitcher.strikeouts}</td>
                  <td className="px-2 py-2 text-center">{pitcher.walks}</td>
                  <td className="px-2 py-2 text-center">{pitcher.hitByPitch}</td>
                  <td className="px-2 py-2 text-center">{pitcher.homeRuns}</td>
                  <td className="px-2 py-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {pitcher.isWin && <span className="text-amber-500 font-bold">W</span>}
                      {pitcher.isLose && <span className="text-slate-500 font-bold">L</span>}
                      {pitcher.isSave && <span className="text-blue-500 font-bold">S</span>}
                      {pitcher.isHold && <span className="text-emerald-500 font-bold">H</span>}
                    </div>
                  </td>
                  <td className="px-2 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => handleDelete(index)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800">
              {editingIndex !== null ? "投手成績を編集" : "投手を追加"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* 選手名 */}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">選手名</label>
              {registeredPlayers.length > 0 ? (
                <select
                  value={form.playerId}
                  onChange={(e) => {
                    const player = registeredPlayers.find(p => p.id === e.target.value)
                    if (player) {
                      setForm({ ...form, playerId: player.id, playerName: player.name })
                    }
                  }}
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all text-slate-800"
                >
                  <option value="">選手を選択</option>
                  {registeredPlayers.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={form.playerName}
                  onChange={(e) => setForm({ ...form, playerName: e.target.value })}
                  placeholder="選手名を入力"
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
                />
              )}
            </div>

            {/* 投球回 */}
            <div className="flex justify-center py-2">
              <StatButton
                label="投球回"
                value={form.inningsPitched}
                onChange={(v) => setForm({ ...form, inningsPitched: v })}
                step={0.34}
                max={9}
              />
            </div>

            {/* スタッツ - 4列 */}
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="grid grid-cols-4 gap-4">
                <StatButton
                  label="被安打"
                  value={form.hits}
                  onChange={(v) => setForm({ ...form, hits: v })}
                />
                <StatButton
                  label="奪三振"
                  value={form.strikeouts}
                  onChange={(v) => setForm({ ...form, strikeouts: v })}
                />
                <StatButton
                  label="四球"
                  value={form.walks}
                  onChange={(v) => setForm({ ...form, walks: v })}
                />
                <StatButton
                  label="死球"
                  value={form.hitByPitch}
                  onChange={(v) => setForm({ ...form, hitByPitch: v })}
                />
              </div>
            </div>

            {/* スタッツ - 3列 */}
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="grid grid-cols-3 gap-4">
                <StatButton
                  label="失点"
                  value={form.runs}
                  onChange={(v) => setForm({ ...form, runs: v })}
                />
                <StatButton
                  label="自責点"
                  value={form.earnedRuns}
                  onChange={(v) => setForm({ ...form, earnedRuns: v })}
                />
                <StatButton
                  label="被本塁打"
                  value={form.homeRuns}
                  onChange={(v) => setForm({ ...form, homeRuns: v })}
                />
              </div>
            </div>

            {/* 勝敗セーブ */}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-3 block">勝敗・セーブ</label>
              <div className="grid grid-cols-2 gap-3">
                <DecisionButton
                  label="勝利"
                  icon={Trophy}
                  active={form.isWin}
                  onClick={() => setForm({ ...form, isWin: !form.isWin, isLose: false })}
                  color="bg-amber-500"
                />
                <DecisionButton
                  label="敗戦"
                  icon={ThumbsDown}
                  active={form.isLose}
                  onClick={() => setForm({ ...form, isLose: !form.isLose, isWin: false })}
                  color="bg-slate-500"
                />
                <DecisionButton
                  label="セーブ"
                  icon={Shield}
                  active={form.isSave}
                  onClick={() => setForm({ ...form, isSave: !form.isSave })}
                  color="bg-blue-500"
                />
                <DecisionButton
                  label="ホールド"
                  icon={Star}
                  active={form.isHold}
                  onClick={() => setForm({ ...form, isHold: !form.isHold })}
                  color="bg-emerald-500"
                />
              </div>
            </div>

            {/* ボタン */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 h-12 rounded-xl text-slate-600"
                onClick={() => setIsDialogOpen(false)}
              >
                キャンセル
              </Button>
              <Button
                className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                onClick={handleSave}
                disabled={!form.playerName.trim()}
              >
                保存
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
