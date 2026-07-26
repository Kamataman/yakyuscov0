/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // 最適化を有効化する場合は Supabase Storage のドメインを remotePatterns に追加すること
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      // チーム画像のアップロード用（デフォルトは1MB）。
      // クライアント側で縮小・再エンコード済みのファイルを1枚ずつ送るため、
      // Vercelのリクエストボディ上限(4.5MB)に収まる値にしている。
      bodySizeLimit: "4mb",
    },
  },
}

export default nextConfig
