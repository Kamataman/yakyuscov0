import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/constants'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // 検索結果に載せる必要が無く、クロール予算だけを消費するURL。
      // トークン付きURLは期限切れで404/無効表示に変わるため、インデックスさせない。
      disallow: [
        '/api/',
        '/auth/',
        '/invite/',
        '/share/',
        '/password-reset/',
        '/teams/new',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
