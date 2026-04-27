"use client";

import Link from "next/link";
import { Mail } from "lucide-react";

export default function ConfirmPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-3">
          確認メールを送信しました
        </h1>
        <p className="text-slate-500 mb-2">
          登録したメールアドレスに確認メールを送信しました。
        </p>
        <p className="text-slate-500 mb-8">
          メール内のリンクをクリックして、チーム登録を完了してください。
        </p>
        <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700 mb-6 text-left">
          <p className="font-medium mb-1">メールが届かない場合</p>
          <ul className="list-disc list-inside space-y-1 text-blue-600">
            <li>迷惑メールフォルダをご確認ください</li>
            <li>メールアドレスが正しいか確認してください</li>
          </ul>
        </div>
        <Link
          href="/"
          className="text-sm text-slate-500 hover:text-slate-700 underline"
        >
          トップページに戻る
        </Link>
      </div>
    </main>
  );
}
