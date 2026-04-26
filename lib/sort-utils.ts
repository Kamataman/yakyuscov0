/**
 * 背番号のソートキーを生成する
 * ソート順: 0, 00, 000, 1, 01, 001, 2, ..., 10, 010, 11, ...
 * 
 * ロジック:
 * 1. 数値として解釈した値でまずソート
 * 2. 同じ数値の場合は桁数が少ない順（0 < 00 < 000）
 */
export function getNumberSortKey(number: string | number | undefined | null): [number, number] {
  if (number === undefined || number === null || number === "") {
    return [Infinity, 0] // 背番号なしは最後
  }
  
  const str = String(number)
  const numericValue = parseInt(str, 10)
  
  if (isNaN(numericValue)) {
    return [Infinity, 0] // 数値でない場合は最後
  }
  
  // [数値, 桁数] でソート
  return [numericValue, str.length]
}

/**
 * 背番号でソートする比較関数
 */
export function compareByNumber<T extends { number?: string | number | null }>(a: T, b: T): number {
  const [aNum, aLen] = getNumberSortKey(a.number)
  const [bNum, bLen] = getNumberSortKey(b.number)
  
  // まず数値で比較
  if (aNum !== bNum) {
    return aNum - bNum
  }
  
  // 同じ数値なら桁数で比較（少ない順）
  return aLen - bLen
}

/**
 * 選手リストを背番号順にソート
 */
export function sortPlayersByNumber<T extends { number?: string | number | null }>(players: T[]): T[] {
  return [...players].sort(compareByNumber)
}
