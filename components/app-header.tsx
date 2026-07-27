"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useParams, useRouter } from "next/navigation"
import { Home, List, BarChart3, Users, MoreHorizontal, LogIn, LogOut, Shield, ExternalLink, Settings, KeyRound } from "lucide-react"
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
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"

interface AppHeaderProps {
  teamName?: string
}

export function AppHeader({ teamName: initialTeamName }: AppHeaderProps) {
  const pathname = usePathname()
  const params = useParams()
  const router = useRouter()
  const teamId = params.teamId as string | undefined
  const [moreSheetOpen, setMoreSheetOpen] = useState(false)
  const [teamName, setTeamName] = useState<string | null>(initialTeamName ?? null)
  const [isTeamAdmin, setIsTeamAdmin] = useState(false)

  // teamName が prop で渡されなかった場合のフォールバック
  useEffect(() => {
    if (teamId && initialTeamName === undefined) {
      fetch(`/api/teams?id=${teamId}`)
        .then(res => res.json())
        .then(data => {
          if (data.name) setTeamName(data.name)
        })
        .catch(console.error)
    }
  }, [teamId, initialTeamName])

  // このチームの管理者としてログインしているか確認
  useEffect(() => {
    if (!teamId) {
      setIsTeamAdmin(false)
      return
    }
    fetch(`/api/auth/session?teamId=${teamId}`)
      .then((res) => res.json())
      .then((data: { teamId: string | null }) => {
        setIsTeamAdmin(!!data.teamId)
      })
      .catch(() => {
        setIsTeamAdmin(false)
      })
  }, [pathname, teamId])

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    setIsTeamAdmin(false)
    // 管理者専用ページ(admins/accountなど)にいる場合、そのままrefreshすると
    // セッションが無くなったページがnotFound()を呼び404になるため、
    // 常にアクセスできるチームホームへ遷移させる
    router.push(`/${teamId}`)
    router.refresh()
  }

  const navItems = [
    { href: `/${teamId}`, label: "ホーム", icon: Home },
    { href: `/${teamId}/games`, label: "試合一覧", icon: List },
    { href: `/${teamId}/stats`, label: "個人成績", icon: BarChart3 },
    { href: `/${teamId}/players`, label: "選手一覧", icon: Users },
  ]

  const isItemActive = (href: string) =>
    pathname === href || (href !== `/${teamId}` && pathname.startsWith(href))

  return (
    <>
      <header className="sticky top-0 z-40 border-b-4 border-turf bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          {/* チーム名/ロゴ */}
          <Link href={`/${teamId}`} className="flex items-center gap-2.5">
            <Image src="/apple-icon.png" alt={APP_NAME} width={32} height={32} className="shrink-0" priority />
            <span className="flex flex-col leading-none">
              <span className="max-w-[160px] truncate text-lg font-black text-foreground sm:max-w-none sm:text-xl">
                {teamName || teamId}
              </span>
              <span className="mt-1 text-[10px] font-bold text-turf">{APP_NAME}</span>
            </span>
          </Link>

          {/* デスクトップナビ */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isItemActive(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-2 px-3 py-2 text-sm font-bold transition-colors",
                    active ? "text-turf" : "text-foreground/60 hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {active && (
                    <span className="absolute inset-x-3 -bottom-[13px] h-[3px] bg-turf" />
                  )}
                </Link>
              )
            })}

            {/* ログイン/ログアウトボタン */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "ml-3 gap-2",
                    isTeamAdmin ? "border-turf text-turf hover:text-turf" : "text-foreground/60"
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
                    <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                      {teamName || teamId} の管理者
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/${teamId}/settings`} className="flex items-center">
                        <Settings className="h-4 w-4 mr-2" />
                        チーム設定
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/${teamId}/account`} className="flex items-center">
                        <KeyRound className="h-4 w-4 mr-2" />
                        パスワードを変更
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-stitch">
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
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/" className="flex items-center">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    やきゅスコについて
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </header>

      {/* モバイル下部タブバー */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t-4 border-turf bg-white md:hidden">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isItemActive(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-bold"
            >
              <Icon className={cn("h-5 w-5", active ? "text-turf" : "text-foreground/40")} />
              <span className={active ? "text-turf" : "text-foreground/40"}>{item.label}</span>
            </Link>
          )
        })}
        <button
          type="button"
          onClick={() => setMoreSheetOpen(true)}
          className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-bold"
        >
          <MoreHorizontal className={cn("h-5 w-5", isTeamAdmin ? "text-turf" : "text-foreground/40")} />
          <span className={isTeamAdmin ? "text-turf" : "text-foreground/40"}>その他</span>
        </button>
      </nav>

      {/* モバイル「その他」シート */}
      <Drawer open={moreSheetOpen} onOpenChange={setMoreSheetOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>その他</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col gap-1 px-4 pb-6">
            {isTeamAdmin ? (
              <>
                <div className="flex items-center gap-2 px-2 py-2 text-sm font-bold text-turf">
                  <Shield className="h-4 w-4" />
                  {teamName || teamId} の管理者
                </div>
                <Link
                  href={`/${teamId}/settings`}
                  onClick={() => setMoreSheetOpen(false)}
                  className="flex items-center gap-3 px-2 py-3 text-sm font-medium text-foreground"
                >
                  <Settings className="h-5 w-5" />
                  チーム設定
                </Link>
                <Link
                  href={`/${teamId}/account`}
                  onClick={() => setMoreSheetOpen(false)}
                  className="flex items-center gap-3 px-2 py-3 text-sm font-medium text-foreground"
                >
                  <KeyRound className="h-5 w-5" />
                  パスワードを変更
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    handleLogout()
                    setMoreSheetOpen(false)
                  }}
                  className="flex items-center gap-3 px-2 py-3 text-left text-sm font-medium text-stitch"
                >
                  <LogOut className="h-5 w-5" />
                  ログアウト
                </button>
              </>
            ) : (
              <Link
                href={`/${teamId}/login`}
                onClick={() => setMoreSheetOpen(false)}
                className="flex items-center gap-3 px-2 py-3 text-sm font-medium text-foreground"
              >
                <LogIn className="h-5 w-5" />
                管理者ログイン
              </Link>
            )}
            <div className="mt-1 border-t pt-1">
              <Link
                href="/"
                onClick={() => setMoreSheetOpen(false)}
                className="flex items-center gap-3 px-2 py-3 text-sm font-medium text-foreground/60"
              >
                <ExternalLink className="h-5 w-5" />
                やきゅスコについて
              </Link>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
