import { Suspense } from "react"
import ConfirmHandler from "./confirm-handler"

export default function ConfirmPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 flex items-center justify-center">
      <Suspense fallback={<p className="text-slate-600">認証処理中...</p>}>
        <ConfirmHandler />
      </Suspense>
    </div>
  )
}
