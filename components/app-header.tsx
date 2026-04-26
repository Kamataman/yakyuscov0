"use client"

import Link from "next/link"
import { usePathname, useParams } from "next/navigation"
import { Home, List, BarChart3, Users, Menu, X } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

export function AppHeader() {
  const pathname = usePathname()
  const params = useParams()
  const teamId = params.teamId as string | undefined
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [teamName, setTeamName] = useState<string | null>(null)

  // チームが指定されていない場合（ランディングページ等）はヘッダーを表示しない
  const isTeamPage = teamId && !pathname.startsWith("/register")

  // チーム名を取得
  useEffect(() => {
    if (teamId) {
      fetch(`/api/teams?id=${teamId}`)
        .then(res => res.json())
        .then(data => {
          if (data.name) setTeamName(data.name)
        })
        .catch(console.error)
    }
  }, [teamId])

  if (!isTeamPage) return null

  const navItems = [
    { href: `/${teamId}`, label: "ホーム", icon: Home },
    { href: `/${teamId}/games`, label: "試合一覧", icon: List },
    { href: `/${teamId}/stats`, label: "個人成績", icon: BarChart3 },
    { href: `/${teamId}/players`, label: "選手管理", icon: Users },
  ]

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* チーム名/ロゴ */}
        <Link
          href={`/${teamId}`}
          className="flex items-center gap-2 text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
        >
          <span className="text-2xl">&#9918;</span>
          <span className="max-w-[150px] truncate sm:max-w-none">
            {teamName || teamId}
          </span>
        </Link>

        {/* デスクトップナビ */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || 
              (item.href !== `/${teamId}` && pathname.startsWith(item.href))
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-100 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* モバイルメニューボタン */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100"
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* モバイルナビ */}
      {isMenuOpen && (
        <nav className="md:hidden border-t bg-white px-4 py-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || 
              (item.href !== `/${teamId}` && pathname.startsWith(item.href))
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-100 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      )}
    </header>
  )
}
