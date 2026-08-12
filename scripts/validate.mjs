// Validates the event bank. Run with `npm run validate`.
// Exits non-zero on errors so it can gate builds/CI (wired via `prebuild`).
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { EVENTS } from '../src/data/events.js'
import { MIN_GAP_DAYS, PUZZLE_SIZE, dailyPuzzle, dateKey } from '../src/game.js'

const CATEGORIES = ['worlds', 'msi', 'play', 'roster', 'league', 'story']
const TITLE_MAX = 48
const DESC_MAX = 160
const MS_PER_DAY = 86400000
const IMG_DIR = fileURLToPath(new URL('../public/img/', import.meta.url))

const errors = []
const warnings = []
const err = (id, msg) => errors.push(`  [${id}] ${msg}`)
const warn = (id, msg) => warnings.push(`  [${id}] ${msg}`)

// ---- per-event checks -------------------------------------------------------
const seenIds = new Map()
const seenTitles = new Map()
const seenDates = new Map()

for (const e of EVENTS) {
  const id = e.id ?? '<missing id>'

  if (!e.id || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(e.id))
    err(id, `id must be kebab-case, got "${e.id}"`)
  if (seenIds.has(e.id)) err(id, 'duplicate id')
  seenIds.set(e.id, true)

  if (!e.date || !/^\d{4}-\d{2}-\d{2}$/.test(e.date)) {
    err(id, `date must be yyyy-mm-dd, got "${e.date}"`)
  } else {
    const d = new Date(e.date + 'T00:00:00Z')
    const roundtrip = d.toISOString().slice(0, 10)
    if (roundtrip !== e.date) err(id, `date "${e.date}" is not a real calendar date`)
    else {
      if (e.date < '2009-10-27') err(id, `date "${e.date}" is before LoL existed`)
      if (d.getTime() > Date.now()) err(id, `date "${e.date}" is in the future`)
    }
    if (seenDates.has(e.date))
      warn(id, `same date as [${seenDates.get(e.date)}] — they can never be ordered against each other`)
    seenDates.set(e.date, e.id)
  }

  for (const field of ['title', 'desc']) {
    const v = e[field]
    if (!v || typeof v !== 'string' || !v.trim()) {
      err(id, `${field} is required`)
      continue
    }
    const max = field === 'title' ? TITLE_MAX : DESC_MAX
    if (v.length > max) err(id, `${field} is ${v.length} chars (max ${max})`)
    const year = v.match(/(19|20)\d{2}/)
    if (year) err(id, `${field} leaks a year ("${year[0]}") — that gives the answer away`)
  }

  if (!CATEGORIES.includes(e.category))
    err(id, `category must be one of ${CATEGORIES.join('|')}, got "${e.category}"`)

  if (!Number.isInteger(e.difficulty) || e.difficulty < 1 || e.difficulty > 3)
    err(id, `difficulty must be an integer 1–3, got "${e.difficulty}"`)

  if (e.image !== undefined) {
    if (typeof e.image !== 'string' || !/^[a-z0-9-]+\.(webp|png|jpg|svg)$/.test(e.image))
      err(id, `image must be a plain filename like "${e.id}.webp", got "${e.image}"`)
    else if (!existsSync(IMG_DIR + e.image))
      err(id, `image "${e.image}" not found in public/img/`)
    if (e.credit && !e.creditUrl) warn(id, 'image has credit but no creditUrl')
  }

  if (e.title && seenTitles.has(e.title)) warn(id, `same title as [${seenTitles.get(e.title)}]`)
  if (e.title) seenTitles.set(e.title, e.id)
}

// ---- bank-level checks ------------------------------------------------------
if (EVENTS.length < PUZZLE_SIZE) errors.push(`  bank has ${EVENTS.length} events, needs >= ${PUZZLE_SIZE}`)

// Simulate a year of puzzles: every day must yield a strictly ordered,
// gap-respecting selection (i.e. the picker never hits its fallback path).
const usage = new Map()
let badDays = 0
const start = new Date()
for (let i = 0; i < 365; i++) {
  const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
  const { solution } = dailyPuzzle(EVENTS, dateKey(d))
  for (const e of solution) usage.set(e.id, (usage.get(e.id) ?? 0) + 1)
  const ok = solution.every(
    (e, j) =>
      j === 0 ||
      (solution[j - 1].date < e.date &&
        (new Date(e.date) - new Date(solution[j - 1].date)) / MS_PER_DAY >= MIN_GAP_DAYS)
  )
  if (!ok) badDays++
}
if (badDays > 0)
  errors.push(`  ${badDays}/365 simulated days produced an invalid puzzle (gap rule violated — bank too clustered)`)

// ---- report -----------------------------------------------------------------
const tally = (fn) => {
  const m = new Map()
  for (const e of EVENTS) {
    const k = fn(e)
    m.set(k, (m.get(k) ?? 0) + 1)
  }
  return [...m.entries()].sort()
}
const bar = (n) => '█'.repeat(n)

console.log(`Event bank: ${EVENTS.length} events\n`)
console.log('By year:')
for (const [y, n] of tally((e) => String(e.date).slice(0, 4))) console.log(`  ${y}  ${String(n).padStart(2)} ${bar(n)}`)
console.log('\nBy category:')
for (const [c, n] of tally((e) => e.category)) console.log(`  ${String(c).padEnd(7)} ${String(n).padStart(2)} ${bar(n)}`)
console.log('\nBy difficulty:')
for (const [d, n] of tally((e) => e.difficulty)) console.log(`  ${d}  ${String(n).padStart(2)} ${bar(n)}`)
const counts = [...usage.values()]
console.log(
  `\n365-day simulation: ${usage.size}/${EVENTS.length} events used, appearances min ${Math.min(...counts)} / max ${Math.max(...counts)}`
)
const withImages = EVENTS.filter((e) => e.image).length
console.log(`Images: ${withImages}/${EVENTS.length} events have one\n`)

if (warnings.length) console.log(`Warnings:\n${warnings.join('\n')}\n`)
if (errors.length) {
  console.error(`Errors:\n${errors.join('\n')}\n`)
  console.error('❌ validation failed')
  process.exit(1)
}
console.log('✅ validation passed')
