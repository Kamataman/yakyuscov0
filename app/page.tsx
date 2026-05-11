import type { Metadata } from "next"
import Link from "next/link"
import { Users, BarChart3, Calendar, ChevronRight, Share2, Smartphone, Trophy, ClipboardList, TrendingUp, Shield } from "lucide-react"
import { APP_NAME, SITE_URL } from "@/lib/constants"
import { ScoreSharingDemo } from "@/components/score-sharing-demo"

export const metadata: Metadata = {
  title: "野球チームの成績管理アプリ | やきゅスコ",
  description: `${APP_NAME}は野球チームの試合スコア・打撃成績・投手成績をスマホから簡単に記録・管理できる無料Webアプリです。打率・OPS・防御率を自動計算。チーム登録は無料・クレジットカード不要。草野球・少年野球・社会人野球チームに最適。`,
  alternates: {
    canonical: "/",
  },
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: APP_NAME,
  applicationCategory: "SportsApplication",
  operatingSystem: "Web",
  inLanguage: "ja",
  url: `${SITE_URL}/`,
  description: "野球チームの試合スコア・打撃成績・投手成績をスマホから簡単に記録・管理できる無料Webアプリ。打率・OPS・防御率を自動計算。草野球・少年野球・社会人野球チームに最適。",
  featureList: [
    "試合スコア記録（イニング別）",
    "打撃成績自動集計（打率・出塁率・OPS・長打率）",
    "投手成績自動集計（防御率・奪三振・与四球）",
    "選手管理（背番号・ポジション）",
    "試合結果のURL共有",
    "スマートフォン対応",
  ],
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "JPY",
  },
  audience: {
    "@type": "Audience",
    audienceType: "草野球チーム・少年野球チーム・社会人野球チーム",
  },
}

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "やきゅスコは無料で使えますか？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "はい、完全無料でご利用いただけます。チーム登録にクレジットカードは不要です。",
      },
    },
    {
      "@type": "Question",
      name: "スマートフォンから使えますか？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "はい、スマートフォン・タブレット・PCのブラウザから利用できます。アプリのインストールは不要です。",
      },
    },
    {
      "@type": "Question",
      name: "どんな成績が自動計算されますか？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "打者は打率・出塁率・長打率・OPS・打点・本塁打・三振・四球などを自動計算します。投手は防御率・奪三振・与四球・完投数などを自動計算します。",
      },
    },
    {
      "@type": "Question",
      name: "何チームまで登録できますか？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "現在は1アカウントにつき1チームを管理できます。",
      },
    },
  ],
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* ヘッダー */}
      <header className="mx-auto max-w-6xl px-4 py-6">
        <nav className="flex items-center justify-between">
          <span className="text-2xl font-bold text-white">{APP_NAME}</span>
          <div className="flex items-center gap-4">
            <Link
              href="/register"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700"
            >
              チーム登録（無料）
            </Link>
          </div>
        </nav>
      </header>

      {/* ヒーローセクション */}
      <section className="mx-auto max-w-6xl px-4 py-16 text-center md:py-24">
        <p className="mb-4 inline-block rounded-full bg-blue-500/20 px-4 py-1.5 text-sm font-semibold text-blue-300">
          草野球・少年野球・社会人野球チームに最適
        </p>
        <h1 className="text-4xl font-bold leading-tight text-white md:text-5xl">
          チームの試合結果と<br />個人成績を簡単管理
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
          野球チームの試合スコア・打撃成績・投手成績を一元管理。
          打率・OPS・防御率を自動計算し、スマートフォンからいつでも記録・確認できます。
          チーム登録は無料・クレジットカード不要。
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/register"
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl"
          >
            無料でチームを作成
            <ChevronRight className="h-5 w-5" />
          </Link>
          <Link
            href="/demo"
            className="rounded-xl border border-slate-600 px-8 py-4 text-lg font-bold text-white transition-all hover:bg-slate-700"
          >
            デモチームを見てみる
          </Link>
        </div>
        <p className="mt-4 text-sm text-slate-500">クレジットカード不要・登録1分</p>
      </section>

      {/* 主な機能 */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-4 text-center text-3xl font-bold text-white">主な機能</h2>
        <p className="mb-12 text-center text-slate-400">試合記録から成績集計まで、チーム運営に必要な機能をすべて無料で</p>
        <div className="grid gap-8 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-800/50 p-6">
            <div className="mb-4 inline-flex rounded-xl bg-blue-500/20 p-3">
              <Calendar className="h-8 w-8 text-blue-400" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-white">試合結果の記録</h3>
            <p className="text-slate-400">
              スコアボード形式でイニング別のスコアを記録。打撃結果（安打・三振・四球・本塁打など）もタップ操作で簡単入力できます。
            </p>
          </div>
          <div className="rounded-2xl bg-slate-800/50 p-6">
            <div className="mb-4 inline-flex rounded-xl bg-emerald-500/20 p-3">
              <BarChart3 className="h-8 w-8 text-emerald-400" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-white">成績の自動計算</h3>
            <p className="text-slate-400">
              打率・出塁率・長打率・OPS・打点・本塁打を自動集計。投手は防御率・奪三振・与四球も自動計算。選手ごとの成績を一覧で確認できます。
            </p>
          </div>
          <div className="rounded-2xl bg-slate-800/50 p-6">
            <div className="mb-4 inline-flex rounded-xl bg-purple-500/20 p-3">
              <Users className="h-8 w-8 text-purple-400" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-white">選手管理</h3>
            <p className="text-slate-400">
              チームメンバーを登録して試合ごとの出場選手を選択。背番号・ポジションも管理でき、投手・野手の区別も設定できます。
            </p>
          </div>
          <div className="rounded-2xl bg-slate-800/50 p-6">
            <div className="mb-4 inline-flex rounded-xl bg-orange-500/20 p-3">
              <Share2 className="h-8 w-8 text-orange-400" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-white">試合結果の共有</h3>
            <p className="text-slate-400">
              試合結果をURLで共有できます。LINEやSNSに貼るだけで、チームメンバーや相手チームにスコアを伝えられます。
            </p>
          </div>
          <div className="rounded-2xl bg-slate-800/50 p-6">
            <div className="mb-4 inline-flex rounded-xl bg-cyan-500/20 p-3">
              <Smartphone className="h-8 w-8 text-cyan-400" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-white">スマホ完全対応</h3>
            <p className="text-slate-400">
              アプリのインストール不要。スマートフォンのブラウザからそのまま使えます。試合中もスコアをリアルタイムで入力できます。
            </p>
          </div>
          <div className="rounded-2xl bg-slate-800/50 p-6">
            <div className="mb-4 inline-flex rounded-xl bg-yellow-500/20 p-3">
              <Trophy className="h-8 w-8 text-yellow-400" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-white">シーズン成績管理</h3>
            <p className="text-slate-400">
              複数試合の成績を累計で管理。シーズン通算の打率・防御率など、チーム全体の成長をトラッキングできます。
            </p>
          </div>
        </div>
      </section>

      {/* 計算できる成績一覧 */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-4 text-center text-3xl font-bold text-white">自動計算される成績</h2>
        <p className="mb-12 text-center text-slate-400">入力したデータから以下の成績を自動で集計します</p>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-slate-800/50 p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="inline-flex rounded-xl bg-blue-500/20 p-2">
                <ClipboardList className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white">打撃成績</h3>
            </div>
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-center gap-2"><span className="text-blue-400">•</span>打率（AVG）</li>
              <li className="flex items-center gap-2"><span className="text-blue-400">•</span>出塁率（OBP）</li>
              <li className="flex items-center gap-2"><span className="text-blue-400">•</span>長打率（SLG）</li>
              <li className="flex items-center gap-2"><span className="text-blue-400">•</span>OPS（出塁率＋長打率）</li>
              <li className="flex items-center gap-2"><span className="text-blue-400">•</span>打点・本塁打・二塁打・三塁打</li>
              <li className="flex items-center gap-2"><span className="text-blue-400">•</span>三振・四球・死球</li>
              <li className="flex items-center gap-2"><span className="text-blue-400">•</span>盗塁・盗塁刺</li>
            </ul>
          </div>
          <div className="rounded-2xl bg-slate-800/50 p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="inline-flex rounded-xl bg-emerald-500/20 p-2">
                <TrendingUp className="h-6 w-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white">投手成績</h3>
            </div>
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-center gap-2"><span className="text-emerald-400">•</span>防御率（ERA）</li>
              <li className="flex items-center gap-2"><span className="text-emerald-400">•</span>投球回数</li>
              <li className="flex items-center gap-2"><span className="text-emerald-400">•</span>奪三振・与四球・与死球</li>
              <li className="flex items-center gap-2"><span className="text-emerald-400">•</span>被安打・被本塁打</li>
              <li className="flex items-center gap-2"><span className="text-emerald-400">•</span>勝利・敗北・セーブ</li>
              <li className="flex items-center gap-2"><span className="text-emerald-400">•</span>自責点・失点</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 使い方ステップ */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-4 text-center text-3xl font-bold text-white">かんたん3ステップで始められる</h2>
        <p className="mb-12 text-center text-slate-400">難しい設定は不要。すぐに使い始められます</p>
        <div className="grid gap-8 md:grid-cols-3">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold text-white">1</div>
            <h3 className="mb-2 text-lg font-bold text-white">チームを作成</h3>
            <p className="text-slate-400">チーム名を決めてメールアドレスで登録するだけ。1分で完了します。</p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold text-white">2</div>
            <h3 className="mb-2 text-lg font-bold text-white">選手を登録</h3>
            <p className="text-slate-400">チームメンバーの名前・背番号・ポジションを登録します。あとから追加・編集も自由。</p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold text-white">3</div>
            <h3 className="mb-2 text-lg font-bold text-white">試合を記録</h3>
            <p className="text-slate-400">試合のスコアと打撃結果を入力すると成績が自動集計。結果はURLで共有できます。</p>
          </div>
        </div>
      </section>

      {/* URL共有デモ */}
      <ScoreSharingDemo />

      {/* こんなチームにおすすめ */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-4 text-center text-3xl font-bold text-white">こんなチームにおすすめ</h2>
        <p className="mb-12 text-center text-slate-400">あらゆる野球チームのスコア管理・成績管理に対応</p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "草野球チーム", desc: "週末の試合スコアを手軽に記録・共有したい" },
            { label: "少年野球チーム", desc: "子どもたちの成長を成績データで見える化したい" },
            { label: "社会人野球チーム", desc: "シーズンを通じた個人成績をしっかり管理したい" },
            { label: "軟式野球チーム", desc: "試合後に打率やOPSをすぐ確認したい" },
            { label: "高校・大学野球OB会", desc: "定期試合の記録をメンバーと共有したい" },
            { label: "企業内野球チーム", desc: "スコアラー不在でも打席結果を記録したい" },
          ].map(({ label, desc }) => (
            <div key={label} className="rounded-xl bg-slate-800/50 p-4 flex items-start gap-3">
              <div className="mt-0.5 inline-flex rounded-lg bg-blue-500/20 p-1.5">
                <Shield className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="font-bold text-white">{label}</p>
                <p className="text-sm text-slate-400">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* デモリンク */}
      <div className="text-center pb-8">
        <Link
          href="/demo"
          className="rounded-xl border border-slate-600 px-8 py-4 text-lg font-bold text-white transition-all hover:bg-slate-700"
        >
          デモチームを見てみる
        </Link>
      </div>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="mb-12 text-center text-3xl font-bold text-white">よくある質問</h2>
        <div className="space-y-4">
          {[
            {
              q: "完全無料で使えますか？",
              a: "はい、すべての機能を無料でご利用いただけます。チーム登録・選手登録・試合記録・成績集計・URL共有、すべて無料です。クレジットカードの登録も不要です。",
            },
            {
              q: "スマートフォンから使えますか？",
              a: "はい、スマートフォン・タブレット・PCのブラウザからそのままお使いいただけます。アプリのインストールは不要です。試合中にグラウンドでスコアを入力することも可能です。",
            },
            {
              q: "どんな成績が自動計算されますか？",
              a: "打者は打率・出塁率・長打率・OPS・打点・本塁打・三振・四球などを自動集計します。投手は防御率・奪三振・与四球・被安打などを自動計算します。",
            },
            {
              q: "試合結果を共有する方法は？",
              a: "試合詳細ページから共有用URLを発行できます。そのURLをLINEやSNSでシェアすると、アカウントなしで誰でも試合結果を確認できます。",
            },
            {
              q: "過去の試合データは残りますか？",
              a: "はい、登録した試合データはすべて保存されます。シーズン通算の成績も自動で集計されます。",
            },
          ].map(({ q, a }) => (
            <div key={q} className="rounded-2xl bg-slate-800/50 p-6">
              <p className="mb-2 font-bold text-white">Q. {q}</p>
              <p className="text-slate-400">A. {a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16 text-center">
        <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-blue-700 p-8 md:p-12">
          <h2 className="text-2xl font-bold text-white md:text-3xl">
            今すぐチームを作成して始めましょう
          </h2>
          <p className="mt-4 text-blue-100">
            無料で使えます。クレジットカード不要。登録1分。
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-lg font-bold text-blue-600 shadow-lg transition-all hover:bg-slate-100"
          >
            無料でチーム登録
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* フッター */}
      <footer className="border-t border-slate-700 py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-slate-500">
          <p>{APP_NAME} - 野球チームの試合スコア・打撃成績・投手成績を無料で管理</p>
          <p className="mt-2">草野球・少年野球・社会人野球チームのスコア管理アプリ</p>
          <p className="mt-2">
            <a
              href="https://forms.gle/wPRQDXBgRxCD5JqPA"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-300 transition-colors"
            >
              問い合わせ
            </a>
          </p>
        </div>
      </footer>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </main>
  )
}
