import Link from "next/link"
import { AlertCircle } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        
        <h1 className="text-xl font-bold text-slate-800 mb-2">
          リンクが無効です
        </h1>
        
        <p className="text-slate-600 mb-6">
          この共有リンクは有効期限が切れているか、存在しません。
          管理者に新しいリンクを発行してもらってください。
        </p>

        <Link
          href="/"
          className="inline-block px-6 py-3 bg-slate-800 text-white font-semibold rounded-lg hover:bg-slate-700 transition-colors"
        >
          トップページへ
        </Link>
      </div>
    </div>
  )
}
