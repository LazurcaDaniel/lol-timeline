// Deterministic daily-puzzle logic. Everyone who opens the site on the same
// local date gets the same five events in the same presented order.

const MS_PER_DAY = 86400000
// Two events closer together than this can't appear in the same puzzle,
// so the ordering is never ambiguous or unfairly hard.
const MIN_GAP_DAYS = 45
export const MAX_ATTEMPTS = 3
export const PUZZLE_SIZE = 5

// First day the site "launched" — puzzle #1.
const LAUNCH = { y: 2026, m: 8, d: 12 }

function mulberry32(seed) {
  let a = seed | 0
  return function () {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function localEpochDay(date = new Date()) {
  return Math.floor(
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())) / MS_PER_DAY
  )
}

// Stable key for "today" used for storage and seeding, e.g. 20260812.
export function dateKey(date = new Date()) {
  return (
    date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate()
  )
}

export function puzzleNumber(date = new Date()) {
  const launch = Date.UTC(LAUNCH.y, LAUNCH.m - 1, LAUNCH.d) / MS_PER_DAY
  return localEpochDay(date) - launch + 1
}

export function msUntilTomorrow(now = new Date()) {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  return next - now
}

function shuffled(arr, rng) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function gapOk(a, b) {
  return Math.abs(new Date(a.date) - new Date(b.date)) / MS_PER_DAY >= MIN_GAP_DAYS
}

// Returns { solution, presented }: the five events in true chronological
// order, and the shuffled order they're first shown in.
export function dailyPuzzle(events, key) {
  const rng = mulberry32((key * 2654435761) % 2147483647)

  let picked = null
  for (let attempt = 0; attempt < 100 && !picked; attempt++) {
    const pool = shuffled(events, rng)
    const chosen = []
    for (const e of pool) {
      if (chosen.every((p) => gapOk(p, e))) chosen.push(e)
      if (chosen.length === PUZZLE_SIZE) break
    }
    if (chosen.length === PUZZLE_SIZE) picked = chosen
  }
  // Bank too small/clustered for the gap rule — take any five distinct events.
  if (!picked) picked = shuffled(events, rng).slice(0, PUZZLE_SIZE)

  const solution = picked.slice().sort((a, b) => (a.date < b.date ? -1 : 1))
  let presented = shuffled(picked, rng)
  let guard = 0
  while (
    presented.every((e, i) => e.id === solution[i].id) &&
    guard++ < 10
  ) {
    presented = shuffled(picked, rng)
  }
  return { solution, presented }
}

export function checkOrder(order, solution) {
  return order.map((e, i) => e.id === solution[i].id)
}

export function formatDate(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function shareText(number, attempts, won) {
  const score = won ? `${attempts.length}/${MAX_ATTEMPTS}` : `X/${MAX_ATTEMPTS}`
  const grid = attempts
    .map((row) => row.map((ok) => (ok ? '🟩' : '🟥')).join(''))
    .join('\n')
  return `LoL Esports Timeline #${number} ${score}\n${grid}`
}
