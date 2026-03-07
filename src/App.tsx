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

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomChampionForLane(lane: Lane): Champion {
  const pool = Object.values(CHAMPIONS).filter(
    c => c.primaryLane === lane || c.secondaryLane === lane
  )
  return pickRandom(pool)
}

type PlayerResult = {
  name: string
  lane: Lane
  champion: Champion
}

type Phase = 'setup' | 'drawing' | 'done'
type DrawStep = 'lane' | 'champion'

function App() {
  const [players, setPlayers] = useState(['', '', '', '', ''])
  const [phase, setPhase] = useState<Phase>('setup')
  const [confirmed, setConfirmed] = useState<PlayerResult[]>([])
  const [usedLanes, setUsedLanes] = useState<Lane[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [drawStep, setDrawStep] = useState<DrawStep>('lane')
  const [pendingLane, setPendingLane] = useState<Lane | null>(null)
  const [confirmedLane, setConfirmedLane] = useState<Lane | null>(null)
  const [pendingChampion, setPendingChampion] = useState<Champion | null>(null)

  const playerNames = players.map((p, i) => p.trim() || `Jogador ${i + 1}`)

  function updatePlayer(i: number, value: string) {
    setPlayers(prev => prev.map((p, idx) => (idx === i ? value : p)))
  }

  function iniciarSorteio() {
    setPhase('drawing')
    setConfirmed([])
    setUsedLanes([])
    setCurrentIdx(0)
    setDrawStep('lane')
    setPendingLane(null)
    setConfirmedLane(null)
    setPendingChampion(null)
  }

  function handleSortearLane() {
    const available = LANES.filter(l => !usedLanes.includes(l))
    setPendingLane(pickRandom(available))
  }

  function handleRerollLane() {
    const available = LANES.filter(l => !usedLanes.includes(l))
    setPendingLane(pickRandom(available))
  }

  function handleConfirmarLane() {
    if (!pendingLane) return
    setConfirmedLane(pendingLane)
    setUsedLanes(prev => [...prev, pendingLane])
    setPendingLane(null)
    setDrawStep('champion')
  }

  function handleSortearChampion() {
    if (!confirmedLane) return
    setPendingChampion(randomChampionForLane(confirmedLane))
  }

  function handleRerollChampion() {
    if (!confirmedLane) return
    setPendingChampion(randomChampionForLane(confirmedLane))
  }

  function handleVoltarParaLane() {
    setUsedLanes(prev => prev.filter(l => l !== confirmedLane))
    setPendingLane(confirmedLane)
    setConfirmedLane(null)
    setPendingChampion(null)
    setDrawStep('lane')
  }

  function handleVoltarParaJogadorAnterior() {
    if (currentIdx === 0) return
    const prev = confirmed[confirmed.length - 1]
    setConfirmed(c => c.slice(0, -1))
    setUsedLanes(l => l.filter(lane => lane !== prev.lane))
    setCurrentIdx(i => i - 1)
    setDrawStep('champion')
    setConfirmedLane(prev.lane)
    setPendingChampion(prev.champion)
    setPendingLane(null)
  }

  function handleConfirmarChampion() {
    if (!confirmedLane || !pendingChampion) return
    const newResult: PlayerResult = {
      name: playerNames[currentIdx],
      lane: confirmedLane,
      champion: pendingChampion,
    }
    setConfirmed(prev => [...prev, newResult])
    if (currentIdx < 4) {
      setCurrentIdx(prev => prev + 1)
      setDrawStep('lane')
      setConfirmedLane(null)
      setPendingChampion(null)
    } else {
      setPhase('done')
    }
  }

  function rerollChampionDone(i: number) {
    setConfirmed(prev =>
      prev.map((r, idx) =>
        idx === i ? { ...r, champion: randomChampionForLane(r.lane) } : r
      )
    )
  }

  function resetar() {
    setPhase('setup')
    setPlayers(['', '', '', '', ''])
    setConfirmed([])
    setUsedLanes([])
    setCurrentIdx(0)
    setDrawStep('lane')
    setPendingLane(null)
    setConfirmedLane(null)
    setPendingChampion(null)
  }

  return (
    <div className="app">
      <h1 className="title">Sorteio LoL</h1>

      {phase === 'setup' && (
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
          <button className="sortear-btn" onClick={iniciarSorteio}>
            Iniciar Sorteio
          </button>
        </div>
      )}

      {phase === 'drawing' && (
        <div className="drawing-phase">
          {confirmed.length > 0 && (
            <div className="results">
              {confirmed.map((r, i) => (
                <div key={i} className="result-card result-card--done">
                  <span className="result-player">{r.name}</span>
                  <span className="result-lane">
                    {LANE_ICONS[r.lane]} {LANE_LABELS[r.lane]}
                  </span>
                  <span className="result-champion">{r.champion.name}</span>
                </div>
              ))}
            </div>
          )}

          <div className="draw-card">
            <span className="draw-player">{playerNames[currentIdx]}</span>
            <span className="draw-progress">
              {currentIdx + 1} / {playerNames.length}
            </span>

            {drawStep === 'lane' && (
              <div className="draw-step">
                <span className="draw-step-label">Sorteando Lane</span>
                {pendingLane ? (
                  <>
                    <span className="draw-value">
                      {LANE_ICONS[pendingLane]} {LANE_LABELS[pendingLane]}
                    </span>
                    <div className="draw-actions">
                      <button className="action-btn action-btn--reroll" onClick={handleRerollLane}>
                        🔀 Reroll
                      </button>
                      <button className="action-btn action-btn--confirm" onClick={handleConfirmarLane}>
                        ✓ Confirmar
                      </button>
                    </div>
                  </>
                ) : (
                  <button className="sortear-btn" onClick={handleSortearLane}>
                    Sortear Lane
                  </button>
                )}
                {currentIdx > 0 && (
                  <button className="back-btn" onClick={handleVoltarParaJogadorAnterior}>
                    ← Voltar para {playerNames[currentIdx - 1]}
                  </button>
                )}
              </div>
            )}

            {drawStep === 'champion' && confirmedLane && (
              <div className="draw-step">
                <span className="draw-confirmed-lane">
                  {LANE_ICONS[confirmedLane]} {LANE_LABELS[confirmedLane]}
                </span>
                <span className="draw-step-label">Sorteando Campeão</span>
                {pendingChampion ? (
                  <>
                    <span className="draw-value draw-value--champion">
                      {pendingChampion.name}
                    </span>
                    <div className="draw-actions">
                      <button className="action-btn action-btn--reroll" onClick={handleRerollChampion}>
                        🎲 Reroll
                      </button>
                      <button className="action-btn action-btn--confirm" onClick={handleConfirmarChampion}>
                        ✓ Confirmar
                      </button>
                    </div>
                  </>
                ) : (
                  <button className="sortear-btn" onClick={handleSortearChampion}>
                    Sortear Campeão
                  </button>
                )}
                <button className="back-btn" onClick={handleVoltarParaLane}>
                  ← Voltar para Lane
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div className="done-phase">
          <div className="results">
            {confirmed.map((r, i) => (
              <div key={i} className="result-card">
                <span className="result-player">{r.name}</span>
                <span className="result-lane">
                  {LANE_ICONS[r.lane]} {LANE_LABELS[r.lane]}
                </span>
                <div className="result-champion-group">
                  <span className="result-champion">{r.champion.name}</span>
                  <button
                    className="champion-reroll-btn"
                    title="Reroll campeão"
                    onClick={() => rerollChampionDone(i)}
                  >
                    🎲
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button className="sortear-btn resetar-btn" onClick={resetar}>
            Novo Sorteio
          </button>
        </div>
      )}
    </div>
  )
}

export default App
