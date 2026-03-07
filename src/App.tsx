import { useState } from "react";
import "./App.css";
import { CHAMPIONS } from "./constants";
import type { Champion } from "./types";
import { Lane } from "./types";

const LANES = [Lane.Top, Lane.Jungle, Lane.Mid, Lane.ADC, Lane.Support];

const LANE_LABELS: Record<Lane, string> = {
  [Lane.Top]: "Top",
  [Lane.Jungle]: "Jungle",
  [Lane.Mid]: "Mid",
  [Lane.ADC]: "ADC",
  [Lane.Support]: "Support",
};

const LANE_ICONS: Record<Lane, string> = {
  [Lane.Top]: "🛡️",
  [Lane.Jungle]: "🌿",
  [Lane.Mid]: "⚡",
  [Lane.ADC]: "🏹",
  [Lane.Support]: "💊",
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomChampionForLane(lane: Lane): Champion {
  const pool = Object.values(CHAMPIONS).filter(
    (c) => c.primaryLane === lane || c.secondaryLane === lane,
  );
  return pickRandom(pool);
}

type PlayerResult = {
  name: string;
  lane: Lane;
  champion: Champion;
};

type Phase = "setup" | "drawing" | "done";
type DrawStep = "lane" | "champion";
type TabMode = "one-team" | "two-teams";

function App() {
  const [tabMode, setTabMode] = useState<TabMode>("one-team");

  // States para modo 1 time
  const [players, setPlayers] = useState(["", "", "", "", ""]);
  const [phase, setPhase] = useState<Phase>("setup");
  const [confirmed, setConfirmed] = useState<PlayerResult[]>([]);
  const [usedLanes, setUsedLanes] = useState<Lane[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [drawStep, setDrawStep] = useState<DrawStep>("lane");
  const [pendingLane, setPendingLane] = useState<Lane | null>(null);
  const [confirmedLane, setConfirmedLane] = useState<Lane | null>(null);
  const [pendingChampion, setPendingChampion] = useState<Champion | null>(null);

  // States para modo 2 times
  const [twoTeamsPlayers, setTwoTeamsPlayers] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [team1, setTeam1] = useState<PlayerResult[]>([]);
  const [team2, setTeam2] = useState<PlayerResult[]>([]);
  const [twoTeamsPhase, setTwoTeamsPhase] = useState<"setup" | "done">("setup");

  const playerNames = players.map((p, i) => p.trim() || `Jogador ${i + 1}`);

  function updatePlayer(i: number, value: string) {
    setPlayers((prev) => prev.map((p, idx) => (idx === i ? value : p)));
  }

  function iniciarSorteio() {
    setPhase("drawing");
    setConfirmed([]);
    setUsedLanes([]);
    setCurrentIdx(0);
    setDrawStep("lane");
    setPendingLane(null);
    setConfirmedLane(null);
    setPendingChampion(null);
  }

  function handleSortearLane() {
    const available = LANES.filter((l) => !usedLanes.includes(l));
    setPendingLane(pickRandom(available));
  }

  function handleRerollLane() {
    const available = LANES.filter((l) => !usedLanes.includes(l));
    setPendingLane(pickRandom(available));
  }

  function handleConfirmarLane() {
    if (!pendingLane) return;
    setConfirmedLane(pendingLane);
    setUsedLanes((prev) => [...prev, pendingLane]);
    setPendingLane(null);
    setDrawStep("champion");
  }

  function handleSortearChampion() {
    if (!confirmedLane) return;
    setPendingChampion(randomChampionForLane(confirmedLane));
  }

  function handleRerollChampion() {
    if (!confirmedLane) return;
    setPendingChampion(randomChampionForLane(confirmedLane));
  }

  function handleVoltarParaLane() {
    setUsedLanes((prev) => prev.filter((l) => l !== confirmedLane));
    setPendingLane(confirmedLane);
    setConfirmedLane(null);
    setPendingChampion(null);
    setDrawStep("lane");
  }

  function handleVoltarParaJogadorAnterior() {
    if (currentIdx === 0) return;
    const prev = confirmed[confirmed.length - 1];
    setConfirmed((c) => c.slice(0, -1));
    setUsedLanes((l) => l.filter((lane) => lane !== prev.lane));
    setCurrentIdx((i) => i - 1);
    setDrawStep("champion");
    setConfirmedLane(prev.lane);
    setPendingChampion(prev.champion);
    setPendingLane(null);
  }

  function handleConfirmarChampion() {
    if (!confirmedLane || !pendingChampion) return;
    const newResult: PlayerResult = {
      name: playerNames[currentIdx],
      lane: confirmedLane,
      champion: pendingChampion,
    };
    setConfirmed((prev) => [...prev, newResult]);
    if (currentIdx < 4) {
      setCurrentIdx((prev) => prev + 1);
      setDrawStep("lane");
      setConfirmedLane(null);
      setPendingChampion(null);
    } else {
      setPhase("done");
    }
  }

  function rerollChampionDone(i: number) {
    setConfirmed((prev) =>
      prev.map((r, idx) =>
        idx === i ? { ...r, champion: randomChampionForLane(r.lane) } : r,
      ),
    );
  }

  function resetar() {
    setPhase("setup");
    setPlayers(["", "", "", "", ""]);
    setConfirmed([]);
    setUsedLanes([]);
    setCurrentIdx(0);
    setDrawStep("lane");
    setPendingLane(null);
    setConfirmedLane(null);
    setPendingChampion(null);
  }

  // Funções para modo 2 times
  function updateTwoTeamsPlayer(i: number, value: string) {
    setTwoTeamsPlayers((prev) => prev.map((p, idx) => (idx === i ? value : p)));
  }

  function addTwoTeamsPlayer() {
    if (twoTeamsPlayers.length >= 10) return;
    setTwoTeamsPlayers((prev) => [...prev, ""]);
  }

  function removeTwoTeamsPlayer(i: number) {
    if (twoTeamsPlayers.length <= 2) return;
    setTwoTeamsPlayers((prev) => prev.filter((_, idx) => idx !== i));
  }

  function sortearDoisTimes() {
    const validPlayers = twoTeamsPlayers
      .map((p, i) => p.trim() || `Jogador ${i + 1}`)
      .filter((p) => p);

    if (validPlayers.length < 2) return;

    // Embaralhar jogadores
    const shuffled = [...validPlayers].sort(() => Math.random() - 0.5);
    const midPoint = Math.ceil(shuffled.length / 2);

    const team1Players = shuffled.slice(0, midPoint);
    const team2Players = shuffled.slice(midPoint);

    // Distribuir lanes para cada time
    const team1Results = distribuirLanesParaTime(team1Players);
    const team2Results = distribuirLanesParaTime(team2Players);

    setTeam1(team1Results);
    setTeam2(team2Results);
    setTwoTeamsPhase("done");
  }

  function distribuirLanesParaTime(players: string[]): PlayerResult[] {
    const availableLanes = [...LANES];
    const results: PlayerResult[] = [];

    for (const playerName of players) {
      let lane: Lane;
      if (availableLanes.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableLanes.length);
        lane = availableLanes[randomIndex];
        availableLanes.splice(randomIndex, 1);
      } else {
        lane = pickRandom(LANES);
      }

      const champion = randomChampionForLane(lane);
      results.push({ name: playerName, lane, champion });
    }

    return results;
  }

  function rerollTime(teamNumber: 1 | 2) {
    const currentTeam = teamNumber === 1 ? team1 : team2;
    const playerNames = currentTeam.map((p) => p.name);
    const newResults = distribuirLanesParaTime(playerNames);

    if (teamNumber === 1) {
      setTeam1(newResults);
    } else {
      setTeam2(newResults);
    }
  }

  function rerollChampionInTeam(teamNumber: 1 | 2, playerIndex: number) {
    const setterFunc = teamNumber === 1 ? setTeam1 : setTeam2;
    setterFunc((prev) =>
      prev.map((r, idx) =>
        idx === playerIndex
          ? { ...r, champion: randomChampionForLane(r.lane) }
          : r,
      ),
    );
  }

  function resetarDoisTimes() {
    setTwoTeamsPhase("setup");
    setTeam1([]);
    setTeam2([]);
  }

  return (
    <div className="app">
      <h1 className="title">Sorteio LoL</h1>

      {/* Abas */}
      <div className="tabs">
        <button
          className={`tab ${tabMode === "one-team" ? "tab--active" : ""}`}
          onClick={() => setTabMode("one-team")}
        >
          1 Time
        </button>
        <button
          className={`tab ${tabMode === "two-teams" ? "tab--active" : ""}`}
          onClick={() => setTabMode("two-teams")}
        >
          2 Times
        </button>
      </div>

      {/* Modo 1 Time */}
      {tabMode === "one-team" && (
        <div className="mode-container">
          {phase === "setup" && (
            <div className="players-form">
              {players.map((p, i) => (
                <input
                  key={i}
                  type="text"
                  className="player-input"
                  placeholder={`Jogador ${i + 1}`}
                  value={p}
                  onChange={(e) => updatePlayer(i, e.target.value)}
                />
              ))}
              <button className="sortear-btn" onClick={iniciarSorteio}>
                Iniciar Sorteio
              </button>
            </div>
          )}

          {phase === "drawing" && (
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

                {drawStep === "lane" && (
                  <div className="draw-step">
                    <span className="draw-step-label">Sorteando Lane</span>
                    {pendingLane ? (
                      <>
                        <span className="draw-value">
                          {LANE_ICONS[pendingLane]} {LANE_LABELS[pendingLane]}
                        </span>
                        <div className="draw-actions">
                          <button
                            className="action-btn action-btn--reroll"
                            onClick={handleRerollLane}
                          >
                            🔀 Reroll
                          </button>
                          <button
                            className="action-btn action-btn--confirm"
                            onClick={handleConfirmarLane}
                          >
                            ✓ Confirmar
                          </button>
                        </div>
                      </>
                    ) : (
                      <button
                        className="sortear-btn"
                        onClick={handleSortearLane}
                      >
                        Sortear Lane
                      </button>
                    )}
                    {currentIdx > 0 && (
                      <button
                        className="back-btn"
                        onClick={handleVoltarParaJogadorAnterior}
                      >
                        ← Voltar para {playerNames[currentIdx - 1]}
                      </button>
                    )}
                  </div>
                )}

                {drawStep === "champion" && confirmedLane && (
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
                          <button
                            className="action-btn action-btn--reroll"
                            onClick={handleRerollChampion}
                          >
                            🎲 Reroll
                          </button>
                          <button
                            className="action-btn action-btn--confirm"
                            onClick={handleConfirmarChampion}
                          >
                            ✓ Confirmar
                          </button>
                        </div>
                      </>
                    ) : (
                      <button
                        className="sortear-btn"
                        onClick={handleSortearChampion}
                      >
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

          {phase === "done" && (
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
      )}

      {/* Modo 2 Times */}
      {tabMode === "two-teams" && (
        <div className="mode-container">
          {twoTeamsPhase === "setup" && (
            <div className="players-form">
              <div className="players-list">
                {twoTeamsPlayers.map((p, i) => (
                  <div key={i} className="player-input-row">
                    <input
                      type="text"
                      className="player-input"
                      placeholder={`Jogador ${i + 1}`}
                      value={p}
                      onChange={(e) => updateTwoTeamsPlayer(i, e.target.value)}
                    />
                    {twoTeamsPlayers.length > 2 && (
                      <button
                        className="remove-player-btn"
                        onClick={() => removeTwoTeamsPlayer(i)}
                        title="Remover jogador"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                className="add-player-btn"
                onClick={addTwoTeamsPlayer}
                disabled={twoTeamsPlayers.length >= 10}
              >
                + Adicionar Jogador{" "}
                {twoTeamsPlayers.length >= 10 && "(Máx. 10)"}
              </button>
              <button className="sortear-btn" onClick={sortearDoisTimes}>
                Sortear Times
              </button>
            </div>
          )}

          {twoTeamsPhase === "done" && (
            <div className="two-teams-results">
              <div className="team-container">
                <div className="team-header">
                  <h2 className="team-title">Time 1</h2>
                  <button
                    className="team-reroll-btn"
                    onClick={() => rerollTime(1)}
                    title="Sortear novamente time completo"
                  >
                    🔄 Roletar Time
                  </button>
                </div>
                <div className="results">
                  {team1.map((r, i) => (
                    <div key={i} className="result-card">
                      <span className="result-player">{r.name}</span>
                      <span className="result-lane">
                        {LANE_ICONS[r.lane]} {LANE_LABELS[r.lane]}
                      </span>
                      <div className="result-champion-group">
                        <span className="result-champion">
                          {r.champion.name}
                        </span>
                        <button
                          className="champion-reroll-btn"
                          title="Reroll campeão"
                          onClick={() => rerollChampionInTeam(1, i)}
                        >
                          🎲
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="team-container">
                <div className="team-header">
                  <h2 className="team-title">Time 2</h2>
                  <button
                    className="team-reroll-btn"
                    onClick={() => rerollTime(2)}
                    title="Sortear novamente time completo"
                  >
                    🔄 Roletar Time
                  </button>
                </div>
                <div className="results">
                  {team2.map((r, i) => (
                    <div key={i} className="result-card">
                      <span className="result-player">{r.name}</span>
                      <span className="result-lane">
                        {LANE_ICONS[r.lane]} {LANE_LABELS[r.lane]}
                      </span>
                      <div className="result-champion-group">
                        <span className="result-champion">
                          {r.champion.name}
                        </span>
                        <button
                          className="champion-reroll-btn"
                          title="Reroll campeão"
                          onClick={() => rerollChampionInTeam(2, i)}
                        >
                          🎲
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                className="sortear-btn resetar-btn"
                onClick={resetarDoisTimes}
              >
                Novo Sorteio
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
