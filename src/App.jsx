import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { EVENTS } from './data/events.js'
import {
  MAX_ATTEMPTS,
  checkOrder,
  dailyPuzzle,
  dateKey,
  formatDate,
  msUntilTomorrow,
  puzzleNumber,
  shareText,
} from './game.js'

const STATS_KEY = 'loltl-stats'
const dayStateKey = (key) => `loltl-day-${key}`
const DRAG_THRESHOLD = 6 // px of movement before a press becomes a drag

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage unavailable (private mode etc.) — game still works, just won't persist
  }
}

// Move the card at `from` so it lands at position `to`, shifting the cards in
// between. Locked positions keep their cards; only unlocked slots take part.
function moveWithLocks(arr, from, to, locked) {
  if (from === to) return arr
  const slots = arr.map((_, i) => i).filter((i) => !locked[i])
  const items = slots.map((i) => arr[i])
  const fromRank = slots.indexOf(from)
  const toRank = slots.indexOf(to)
  if (fromRank === -1 || toRank === -1) return arr
  const [moved] = items.splice(fromRank, 1)
  items.splice(toRank, 0, moved)
  const next = arr.slice()
  slots.forEach((slot, rank) => (next[slot] = items[rank]))
  return next
}

function useCountdown(active) {
  const [ms, setMs] = useState(msUntilTomorrow())
  useEffect(() => {
    if (!active) return
    const t = setInterval(() => setMs(msUntilTomorrow()), 1000)
    return () => clearInterval(t)
  }, [active])
  const h = String(Math.floor(ms / 3600000)).padStart(2, '0')
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, '0')
  const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')
  return `${h}:${m}:${s}`
}

function CardInner({ event, slot, showDate, grip, lockedCheck }) {
  return (
    <>
      <span className="slot">{slot}</span>
      <div className="body">
        <div className="title">{event.title}</div>
        <div className="desc">{event.desc}</div>
        {showDate && <div className="date">{formatDate(event.date)}</div>}
      </div>
      {grip && <span className="grip">⠿</span>}
      {lockedCheck && <span className="check">✓</span>}
    </>
  )
}

export default function App() {
  const key = dateKey()
  const number = puzzleNumber()
  const { solution, presented } = useMemo(() => dailyPuzzle(EVENTS, key), [key])
  const byId = useMemo(
    () => Object.fromEntries(solution.map((e) => [e.id, e])),
    [solution]
  )

  const saved = useMemo(() => loadJSON(dayStateKey(key), null), [key])
  const [order, setOrder] = useState(() =>
    saved ? saved.order.map((id) => byId[id]) : presented
  )
  const [attempts, setAttempts] = useState(() => saved?.attempts ?? [])
  const [status, setStatus] = useState(() => saved?.status ?? 'playing')
  const [selected, setSelected] = useState(null)
  const [drag, setDrag] = useState(null)
  const [copied, setCopied] = useState(false)
  const [stats, setStats] = useState(() =>
    loadJSON(STATS_KEY, { played: 0, wins: 0, streak: 0, maxStreak: 0, lastKey: null })
  )

  const over = status !== 'playing'
  const countdown = useCountdown(over)

  // Positions proven correct on a previous attempt are locked in place.
  const locked = useMemo(() => {
    const l = new Array(order.length).fill(false)
    for (const row of attempts) row.forEach((ok, i) => ok && (l[i] = true))
    return l
  }, [attempts, order.length])

  const itemRefs = useRef({})
  const orderRef = useRef(order)
  orderRef.current = order

  useEffect(() => {
    saveJSON(dayStateKey(key), {
      order: order.map((e) => e.id),
      attempts,
      status,
    })
  }, [key, order, attempts, status])

  // FLIP: when the order changes, slide each card from its old spot to its
  // new one instead of teleporting.
  const prevRects = useRef(new Map())
  useLayoutEffect(() => {
    const next = new Map()
    for (const e of order) {
      const el = itemRefs.current[e.id]
      if (!el) continue
      const rect = el.getBoundingClientRect()
      next.set(e.id, rect)
      const old = prevRects.current.get(e.id)
      if (old && Math.abs(old.top - rect.top) > 1) {
        const dy = old.top - rect.top
        el.style.transition = 'none'
        el.style.transform = `translateY(${dy}px)`
        requestAnimationFrame(() => {
          el.style.transition = 'transform 200ms cubic-bezier(0.2, 0, 0.2, 1)'
          el.style.transform = ''
        })
      }
    }
    prevRects.current = next
  }, [order])

  // Nearest unlocked slot to the pointer's y position.
  function slotAt(y) {
    let best = null
    let bestDist = Infinity
    orderRef.current.forEach((e, i) => {
      if (locked[i]) return
      const el = itemRefs.current[e.id]
      if (!el) return
      const r = el.getBoundingClientRect()
      const d = Math.abs(y - (r.top + r.height / 2))
      if (d < bestDist) {
        bestDist = d
        best = i
      }
    })
    return best
  }

  function handlePointerDown(e, index) {
    if (over || locked[index] || (e.pointerType === 'mouse' && e.button !== 0)) return
    e.preventDefault()
    const card = orderRef.current[index]
    const rect = itemRefs.current[card.id].getBoundingClientRect()
    const press = {
      id: card.id,
      index,
      startX: e.clientX,
      startY: e.clientY,
      offX: e.clientX - rect.left,
      offY: e.clientY - rect.top,
      width: rect.width,
      started: false,
    }

    const onMove = (ev) => {
      const dx = ev.clientX - press.startX
      const dy = ev.clientY - press.startY
      if (!press.started) {
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return
        press.started = true
        setSelected(null)
      }
      const target = slotAt(ev.clientY)
      if (target !== null && target !== press.index) {
        setOrder((o) => moveWithLocks(o, press.index, target, locked))
        press.index = target
      }
      setDrag({
        id: press.id,
        width: press.width,
        x: ev.clientX - press.offX,
        y: ev.clientY - press.offY,
        slot: press.index + 1,
        dropping: false,
      })
    }

    const onUp = () => {
      cleanup()
      if (!press.started) {
        handleTap(press.index)
        return
      }
      // Glide the floating clone into its slot, then remove it.
      const el = itemRefs.current[press.id]
      if (el) {
        const rect = el.getBoundingClientRect()
        setDrag((d) =>
          d ? { ...d, x: rect.left, y: rect.top, dropping: true } : d
        )
        setTimeout(() => setDrag(null), 200)
      } else {
        setDrag(null)
      }
    }

    const cleanup = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  // Tap flow: tap a card to pick it up, tap another slot to move it there.
  function handleTap(index) {
    if (over || locked[index]) return
    setSelected((sel) => {
      if (sel === null) return index
      if (sel !== index) setOrder((o) => moveWithLocks(o, sel, index, locked))
      return null
    })
  }

  function finish(won) {
    setStatus(won ? 'won' : 'lost')
    setStats((prev) => {
      const consecutive =
        prev.lastKey != null && puzzleNumberFromKey(prev.lastKey) === number - 1
      const streak = won ? (consecutive ? prev.streak + 1 : 1) : 0
      const next = {
        played: prev.played + 1,
        wins: prev.wins + (won ? 1 : 0),
        streak,
        maxStreak: Math.max(prev.maxStreak, streak),
        lastKey: key,
      }
      saveJSON(STATS_KEY, next)
      return next
    })
  }

  function puzzleNumberFromKey(k) {
    const y = Math.floor(k / 10000)
    const m = Math.floor((k % 10000) / 100) - 1
    const d = k % 100
    return puzzleNumber(new Date(y, m, d))
  }

  function submit() {
    if (over) return
    const result = checkOrder(order, solution)
    const newAttempts = [...attempts, result]
    setAttempts(newAttempts)
    setSelected(null)
    if (result.every(Boolean)) finish(true)
    else if (newAttempts.length >= MAX_ATTEMPTS) finish(false)
  }

  async function share() {
    const text = shareText(number, attempts, status === 'won')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copy your result:', text)
    }
  }

  const lastResult = attempts[attempts.length - 1]

  return (
    <div className="app">
      <header>
        <h1>
          <span className="hour">⏳</span> LoL Esports Timeline
        </h1>
        <p className="sub">
          Puzzle #{number} · Order the moments from <strong>earliest (top)</strong> to{' '}
          <strong>latest (bottom)</strong>. Drag a card where it belongs — or tap
          it, then tap its new slot. {MAX_ATTEMPTS} tries, correct spots lock in
          green.
        </p>
      </header>

      <ol className="cards">
        {order.map((e, i) => {
          const dragging = drag && drag.id === e.id
          const state = over
            ? status === 'won' || e.id === solution[i].id
              ? 'correct'
              : 'wrong'
            : locked[i]
              ? 'correct'
              : selected === i
                ? 'selected'
                : lastResult && !lastResult[i]
                  ? 'missed'
                  : ''
          return (
            <li
              key={e.id}
              ref={(el) => (itemRefs.current[e.id] = el)}
              className={`card ${state} ${dragging ? 'ghost' : ''}`}
              onPointerDown={(ev) => handlePointerDown(ev, i)}
            >
              <CardInner
                event={e}
                slot={i + 1}
                showDate={over}
                grip={!over && !locked[i]}
                lockedCheck={locked[i] && !over}
              />
            </li>
          )
        })}
      </ol>

      {drag && (
        <div
          className={`card drag-clone ${drag.dropping ? 'dropping' : ''}`}
          style={{
            width: drag.width,
            transform: `translate(${drag.x}px, ${drag.y}px)`,
          }}
        >
          <CardInner event={byId[drag.id]} slot={drag.slot} grip />
        </div>
      )}

      <div className="attempts">
        {attempts.map((row, i) => (
          <div key={i} className="attempt-row">
            {row.map((ok, j) => (
              <span key={j}>{ok ? '🟩' : '🟥'}</span>
            ))}
          </div>
        ))}
        {!over && (
          <div className="tries-left">
            {MAX_ATTEMPTS - attempts.length}{' '}
            {MAX_ATTEMPTS - attempts.length === 1 ? 'try' : 'tries'} left
          </div>
        )}
      </div>

      {!over && (
        <button className="primary" onClick={submit}>
          Submit
        </button>
      )}

      {over && (
        <div className="result">
          <p className="verdict">
            {status === 'won'
              ? `You got it in ${attempts.length}/${MAX_ATTEMPTS}!`
              : 'Out of tries — here’s the real order:'}
          </p>
          {status === 'lost' && (
            <ol className="reveal">
              {solution.map((e) => (
                <li key={e.id}>
                  <span className="reveal-date">{formatDate(e.date)}</span> {e.title}
                </li>
              ))}
            </ol>
          )}
          <button className="primary" onClick={share}>
            {copied ? 'Copied!' : 'Share result'}
          </button>
          <p className="countdown">Next puzzle in {countdown}</p>
          <div className="stats">
            <div>
              <b>{stats.played}</b>
              <span>played</span>
            </div>
            <div>
              <b>{stats.played ? Math.round((100 * stats.wins) / stats.played) : 0}%</b>
              <span>win rate</span>
            </div>
            <div>
              <b>{stats.streak}</b>
              <span>streak</span>
            </div>
            <div>
              <b>{stats.maxStreak}</b>
              <span>best streak</span>
            </div>
          </div>
        </div>
      )}

      <footer>
        A fan-made daily puzzle. Not affiliated with Riot Games or HLTV.
      </footer>
    </div>
  )
}
