/**
 * ボットとみなす User-Agent の簡易判定。
 *
 * 閲覧数の加算はクライアント側の fetch を起点にしているため、JSを実行しない
 * クローラは元々加算されない。この判定はヘッドレスブラウザ等を想定した
 * 二重の防御で、取りこぼしは許容する（誤って人間を除外しない側に倒す）。
 */
const BOT_UA_PATTERN =
  /bot|crawler|spider|crawling|slurp|facebookexternalhit|embedly|preview|monitor|headless|python-requests|curl|wget/i

export function isBotUserAgent(userAgent: string | null): boolean {
  // UAを送らないアクセスは通常のブラウザではないためボット扱いにする
  if (!userAgent) return true
  return BOT_UA_PATTERN.test(userAgent)
}
