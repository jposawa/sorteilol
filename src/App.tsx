import { useState } from 'react'
import { CHAMPIONS } from './constants'
import { Lane } from './types'
import type { Champion } from './types'
import './App.css'

const LANES = [Lane.Top, Lane.Jungle, Lane.Mid, Lane.ADC, Lane.Support]

const LANE_LABELS: Record<Lane, string> = {
  [Lane.Top]: 'Top',
  [Lane.Jungle]: 'Jungle',
  [Lane.Mid]: 'Mid',
  [Lane.ADC]: 'ADC',
  [Lane.Support]: 'Support',
}

const LANE_ICONS: Record<Lane, string> = {
  [Lane.Top]: '🛡️',
  [Lane.Jungle]: '🌿',
  [Lane.Mid]: '⚡',
  [Lane.ADC]: '🏹',
  [Lane.Support]: '💊',
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function randomChampionForLane(lane: Lane): Champion {
  const pool = Object.values(CHAMPIONS).filter(
    c => c.primaryLane === lane || c.secondaryLane === lane
  )
  return pool[Math.floor(Math.random() * pool.length)]
}

type PlayerResult = {
  name: string
  lane: Lane
  champion: Champion
}

function App() {
  const [players, setPlayers] = useState(['', '', '', '', ''])
  const [results, setResults] = useState<PlayerResult[]>([])

  function updatePlayer(i: number, value: string) {
    setPlayers(prev => prev.map((p, idx) => (idx === i ? value : p)))
  }

  function sortear() {
    const lanes = shuffle(LANES)
    const res: PlayerResult[] = players.map((name, i) => ({
      name: name.trim() || `Jogador ${i + 1}`,
      lane: lanes[i],
      champion: randomChampionForLane(lanes[i]),
    }))
    setResults(res)
  }

  return (
    <div className="app">
      <h1 className="title">Sorteio LoL</h1>

      <div className="players-form">
        {players.map((p, i) => (
          <input
            key={i}
            type="text"
            className="player-input"
            placeholder={`Jogador ${i + 1}`}
            value={p}
            onChange={e => updatePlayer(i, e.target.value)}
          />
        ))}
        <button className="sortear-btn" onClick={sortear}>
          Sortear
        </button>
      </div>

      {results.length > 0 && (
        <div className="results">
          {results.map((r, i) => (
            <div key={i} className="result-card">
              <span className="result-player">{r.name}</span>
              <span className="result-lane">
                {LANE_ICONS[r.lane]} {LANE_LABELS[r.lane]}
              </span>
              <span className="result-champion">{r.champion.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App
