"use client";

import Link from "next/link";
import { Mail } from "lucide-react";

export default function ConfirmPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="border border-border p-8 max-w-md w-full text-center">
        <div className="diamond-mark w-16 h-16 bg-turf flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-turf-foreground -rotate-45" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-3">
          確認メールを送信しました
        </h1>
        <p className="text-muted-foreground mb-2">
          登録したメールアドレスに確認メールを送信しました。
        </p>
        <p className="text-muted-foreground mb-8">
          メール内のリンクをクリックして、チーム登録を完了してください。
        </p>
        <div className="bg-turf/10 border border-turf/30 px-4 py-3 text-sm text-turf mb-6 text-left">
          <p className="font-medium mb-1">メールが届かない場合</p>
          <ul className="list-disc list-inside space-y-1 text-turf/80">
            <li>迷惑メールフォルダをご確認ください</li>
            <li>メールアドレスが正しいか確認してください</li>
          </ul>
        </div>
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground underline"
        >
          トップページに戻る
        </Link>
      </div>
    </main>
  );
}
