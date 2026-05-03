import Link from "next/link"
import { APP_NAME } from "@/lib/constants"

export function AppFooter() {
  return (
    <footer className="border-t border-slate-200 py-4 mt-auto">
      <div className="mx-auto max-w-6xl px-4 text-center text-xs text-slate-400">
        <p>
          <Link href="/" className="hover:text-slate-600 transition-colors">
            {APP_NAME} - チームの記録を管理するアプリ
          </Link>
        </p>
        <p className="mt-1">
          <a
            href="https://forms.gle/wPRQDXBgRxCD5JqPA"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-600 transition-colors"
          >
            問い合わせ
          </a>
        </p>
      </div>
    </footer>
  )
}
