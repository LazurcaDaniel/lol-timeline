import { useEffect, useMemo, useState } from 'react'
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
  const [dragFrom, setDragFrom] = useState(null)
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

  useEffect(() => {
    saveJSON(dayStateKey(key), {
      order: order.map((e) => e.id),
      attempts,
      status,
    })
  }, [key, order, attempts, status])

  function swap(i, j) {
    if (over || locked[i] || locked[j] || i === j) return
    setOrder((o) => {
      const next = o.slice()
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  function handleCardClick(i) {
    if (over || locked[i]) return
    if (selected === null) setSelected(i)
    else {
      swap(selected, i)
      setSelected(null)
    }
  }

  function finish(won) {
    setStatus(won ? 'won' : 'lost')
    setStats((prev) => {
      const consecutive = prev.lastKey != null && puzzleNumberFromKey(prev.lastKey) === number - 1
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
          <strong>latest (bottom)</strong>. Drag cards or tap two to swap.{' '}
          {MAX_ATTEMPTS} tries — correct spots lock in green.
        </p>
      </header>

      <ol className="cards">
        {order.map((e, i) => {
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
              className={`card ${state}`}
              draggable={!over && !locked[i]}
              onDragStart={() => setDragFrom(i)}
              onDragOver={(ev) => ev.preventDefault()}
              onDrop={() => {
                if (dragFrom !== null) swap(dragFrom, i)
                setDragFrom(null)
              }}
              onClick={() => handleCardClick(i)}
            >
              <span className="slot">{i + 1}</span>
              <div className="body">
                <div className="title">{e.title}</div>
                <div className="desc">{e.desc}</div>
                {over && <div className="date">{formatDate(e.date)}</div>}
              </div>
              {!over && !locked[i] && <span className="grip">⠿</span>}
              {locked[i] && !over && <span className="check">✓</span>}
            </li>
          )
        })}
      </ol>

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
            {MAX_ATTEMPTS - attempts.length} {MAX_ATTEMPTS - attempts.length === 1 ? 'try' : 'tries'} left
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
