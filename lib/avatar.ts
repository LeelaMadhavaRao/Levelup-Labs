function hashSeed(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return hash
}

function escapeSvgText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function getInitials(seed: string): string {
  const cleaned = seed
    .trim()
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)

  if (cleaned.length === 0) return 'HN'
  if (cleaned.length === 1) return cleaned[0].slice(0, 2).toUpperCase()
  return `${cleaned[0][0]}${cleaned[1][0]}`.toUpperCase()
}

export function isGeneratedHunterAvatarUrl(url: string | null | undefined): boolean {
  if (!url) return false
  return url.startsWith('data:image/svg+xml') || url.includes('api.dicebear.com')
}

export function generateHunterAvatarUrl(seedInput: string): string {
  const normalized = (seedInput.trim().toLowerCase() || 'solo-leveling-hunter').slice(0, 120)
  const hash = hashSeed(normalized)
  const initials = getInitials(normalized)
  const rankList = ['E', 'D', 'C', 'B', 'A', 'S']
  const rank = rankList[hash % rankList.length]

  const palettes = [
    { a: '#11081e', b: '#1f0a34', c: '#38bdf8', ring: '#a855f7' },
    { a: '#0b132b', b: '#1b0b2c', c: '#22d3ee', ring: '#7c3aed' },
    { a: '#0f172a', b: '#2a0a3d', c: '#67e8f9', ring: '#a78bfa' },
    { a: '#0a1020', b: '#1f1533', c: '#34d399', ring: '#6366f1' },
  ]

  const palette = palettes[hash % palettes.length]
  const orbit = (hash % 28) + 22
  const runeShift = (hash % 30) - 15
  const glowOpacity = ((hash % 20) + 35) / 100

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${palette.a}" />
      <stop offset="60%" stop-color="${palette.b}" />
      <stop offset="100%" stop-color="#05070f" />
    </linearGradient>
    <radialGradient id="aura" cx="50%" cy="45%" r="60%">
      <stop offset="0%" stop-color="${palette.c}" stop-opacity="${glowOpacity}" />
      <stop offset="100%" stop-color="${palette.c}" stop-opacity="0" />
    </radialGradient>
    <filter id="blurGlow">
      <feGaussianBlur stdDeviation="6" />
    </filter>
  </defs>

  <rect width="512" height="512" rx="92" fill="url(#bg)" />
  <rect x="14" y="14" width="484" height="484" rx="78" fill="none" stroke="${palette.ring}" stroke-opacity=".25" stroke-width="2" />

  <circle cx="256" cy="228" r="150" fill="url(#aura)" />
  <circle cx="256" cy="228" r="132" fill="none" stroke="${palette.ring}" stroke-opacity=".45" stroke-width="2.5" />
  <circle cx="256" cy="228" r="${orbit}" fill="none" stroke="${palette.c}" stroke-opacity=".75" stroke-width="2" />
  <path d="M138 330 C 190 285, 322 285, 374 330" fill="none" stroke="${palette.c}" stroke-opacity=".55" stroke-width="3" />
  <path d="M176 368 C 212 325, 300 325, 336 368" fill="none" stroke="${palette.ring}" stroke-opacity=".55" stroke-width="2.5" />

  <g transform="translate(256 ${250 + runeShift})">
    <text x="0" y="0" text-anchor="middle" dominant-baseline="middle" fill="#f8fafc" font-size="96" font-weight="800" font-family="Segoe UI, Arial, sans-serif" letter-spacing="3">${escapeSvgText(initials)}</text>
    <text x="0" y="78" text-anchor="middle" fill="${palette.c}" font-size="20" font-weight="700" font-family="Segoe UI, Arial, sans-serif" letter-spacing="8">RANK ${rank}</text>
  </g>

  <circle cx="256" cy="228" r="166" fill="none" stroke="${palette.c}" stroke-opacity=".2" stroke-width="1.5" filter="url(#blurGlow)" />
</svg>`.trim()

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}
