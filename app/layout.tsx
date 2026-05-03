import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { APP_NAME, SITE_URL } from '@/lib/constants'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${APP_NAME} - 野球チームの成績管理アプリ`,
    template: `%s | ${APP_NAME}`,
  },
  description: `${APP_NAME}は野球チームの試合スコア・打撃成績・投手成績をスマホから簡単に記録・管理できる無料Webアプリです。打率・OPS・防御率を自動計算。`,
  keywords: ['野球', 'チーム管理', 'スコア記録', '打撃成績', '投手成績', '野球スコアブック', '少年野球', '草野球', '成績管理'],
  generator: 'next.js',
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: SITE_URL,
    siteName: APP_NAME,
    title: `${APP_NAME} - 野球チームの成績管理アプリ`,
    description: `野球チームの試合スコア・打撃成績・投手成績をスマホから簡単に記録・管理。打率・OPS・防御率を自動計算。無料で使えます。`,
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: `${APP_NAME} - 野球チームの成績管理アプリ`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${APP_NAME} - 野球チームの成績管理アプリ`,
    description: `野球チームの試合スコア・打撃成績・投手成績をスマホから簡単に記録・管理。打率・OPS・防御率を自動計算。無料で使えます。`,
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" className="bg-background">
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
