"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useParams, useRouter } from "next/navigation"
import { Home, List, BarChart3, Users, Menu, X, LogIn, LogOut, Shield } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { APP_NAME } from "@/lib/constants"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export function AppHeader() {
  const pathname = usePathname()
  const params = useParams()
  const router = useRouter()
  const teamId = params.teamId as string | undefined
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [teamName, setTeamName] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loggedInTeamId, setLoggedInTeamId] = useState<string | null>(null)

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

  // ログイン状態を確認
  useEffect(() => {
    fetch("/api/auth/status")
      .then(res => res.json())
      .then(data => {
        setIsLoggedIn(data.isLoggedIn)
        setLoggedInTeamId(data.teamId)
      })
      .catch(() => {
        setIsLoggedIn(false)
        setLoggedInTeamId(null)
      })
  }, [pathname])

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    setIsLoggedIn(false)
    setLoggedInTeamId(null)
    router.refresh()
  }

  // このチームの管理者としてログインしているか
  const isTeamAdmin = isLoggedIn && loggedInTeamId === teamId

  const navItems = [
    { href: `/${teamId}`, label: "ホーム", icon: Home },
    { href: `/${teamId}/games`, label: "試合一覧", icon: List },
    { href: `/${teamId}/stats`, label: "個人成績", icon: BarChart3 },
    { href: `/${teamId}/players`, label: "選手一覧", icon: Users },
  ]

  const visibleNavItems = navItems

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* チーム名/ロゴ */}
        <Link
          href={`/${teamId}`}
          className="flex items-center gap-2 text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
        >
          <Image src="/apple-icon.png" alt="やきゅすこ" width={36} height={36} className="rounded-lg" />
          <span className="flex flex-col">
            <span className="max-w-[150px] truncate sm:max-w-none leading-tight">
              {teamName || teamId}
            </span>
            <span className="text-xs font-normal text-slate-400 leading-tight">{APP_NAME}</span>
          </span>
        </Link>

        {/* デスクトップナビ */}
        <nav className="hidden md:flex items-center gap-1">
          {visibleNavItems.map((item) => {
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

          {/* ログイン/ログアウトボタン */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className={cn(
                  "ml-2 gap-2",
                  isTeamAdmin ? "text-emerald-600 hover:text-emerald-700" : "text-slate-500"
                )}
              >
                {isTeamAdmin ? (
                  <>
                    <Shield className="h-4 w-4" />
                    <span className="hidden lg:inline">管理者</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    <span className="hidden lg:inline">ログイン</span>
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {isTeamAdmin ? (
                <>
                  <DropdownMenuItem disabled className="text-xs text-slate-500">
                    {teamName || teamId} の管理者
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    ログアウト
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <Link href={`/${teamId}/login`} className="flex items-center">
                      <LogIn className="h-4 w-4 mr-2" />
                      管理者ログイン
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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
          {visibleNavItems.map((item) => {
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
          
          {/* モバイル用ログイン/ログアウト */}
          <div className="border-t mt-2 pt-2">
            {isTeamAdmin ? (
              <>
                <div className="flex items-center gap-2 px-3 py-2 text-sm text-emerald-600">
                  <Shield className="h-4 w-4" />
                  管理者としてログイン中
                </div>
                <button
                  onClick={() => {
                    handleLogout()
                    setIsMenuOpen(false)
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-5 w-5" />
                  ログアウト
                </button>
              </>
            ) : (
              <Link
                href={`/${teamId}/login`}
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                <LogIn className="h-5 w-5" />
                管理者ログイン
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  )
}
