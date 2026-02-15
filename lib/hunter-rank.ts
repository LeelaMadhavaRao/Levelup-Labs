export type HunterRankCode = 'E' | 'C' | 'B' | 'A' | 'S'

export type HunterRank = {
  code: HunterRankCode
  label: `${HunterRankCode}-RANK`
  index: number
  minPoints: number
}

const HUNTER_RANKS: HunterRank[] = [
  { code: 'E', label: 'E-RANK', index: 0, minPoints: 0 },
  { code: 'C', label: 'C-RANK', index: 1, minPoints: 1000 },
  { code: 'B', label: 'B-RANK', index: 2, minPoints: 2500 },
  { code: 'A', label: 'A-RANK', index: 3, minPoints: 5000 },
  { code: 'S', label: 'S-RANK', index: 4, minPoints: 10000 },
]

export function getHunterRankByPoints(points: number | null | undefined): HunterRank {
  const value = Number(points || 0)
  for (let i = HUNTER_RANKS.length - 1; i >= 0; i -= 1) {
    if (value >= HUNTER_RANKS[i].minPoints) return HUNTER_RANKS[i]
  }
  return HUNTER_RANKS[0]
}

export function getHunterRankFromCode(code: string | null | undefined): HunterRank {
  const normalized = String(code || '').toUpperCase() as HunterRankCode
  return HUNTER_RANKS.find((rank) => rank.code === normalized) || HUNTER_RANKS[0]
}
