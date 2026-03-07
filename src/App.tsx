import { useState } from "react";
import {
	type Champion,
	Lane,
	Phase,
	DrawStep,
	type PlayerResult,
} from "./types";
import "./App.css";
import { pickRandom, randomChampionForLane } from "./helpers";
import { LaneIcon } from "./components";

const LANES = [Lane.Top, Lane.Jungle, Lane.Mid, Lane.ADC, Lane.Support];

const laneLabels = Object.fromEntries(
	Object.entries(Lane).map(([k, v]) => [v, k]),
);

function App() {
	const [players, setPlayers] = useState(["", "", "", "", ""]);
	const [phase, setPhase] = useState<Phase>(Phase.Setup);
	const [confirmed, setConfirmed] = useState<PlayerResult[]>([]);
	const [usedLanes, setUsedLanes] = useState<Lane[]>([]);
	const [currentIdx, setCurrentIdx] = useState(0);
	const [drawStep, setDrawStep] = useState<DrawStep>(DrawStep.Lane);
	const [pendingLane, setPendingLane] = useState<Lane | null>(null);
	const [confirmedLane, setConfirmedLane] = useState<Lane | null>(null);
	const [pendingChampion, setPendingChampion] = useState<Champion | null>(null);

	const playerNames = players.map((p, i) => p.trim() || `Jogador ${i + 1}`);

	function updatePlayer(i: number, value: string) {
		setPlayers((prev) => prev.map((p, idx) => (idx === i ? value : p)));
	}

	const iniciarSorteio = () => {
		setPhase(Phase.Drawing);
		setConfirmed([]);
		setUsedLanes([]);
		setCurrentIdx(0);
		setDrawStep(DrawStep.Lane);
		setPendingLane(null);
		setConfirmedLane(null);
		setPendingChampion(null);
	};

	const handleSortearLane = () => {
		const available = LANES.filter((l) => !usedLanes.includes(l));
		setPendingLane(pickRandom(available));
	};

	const handleRerollLane = () => {
		const available = LANES.filter((l) => !usedLanes.includes(l));
		setPendingLane(pickRandom(available));
	};

	const handleConfirmarLane = () => {
		if (!pendingLane) return;
		setConfirmedLane(pendingLane);
		setUsedLanes((prev) => [...prev, pendingLane]);
		setPendingLane(null);
		setDrawStep(DrawStep.Champion);
	};

	const handleSortearChampion = () => {
		if (!confirmedLane) return;
		setPendingChampion(randomChampionForLane(confirmedLane));
	};

	const handleRerollChampion = () => {
		if (!confirmedLane) return;
		setPendingChampion(randomChampionForLane(confirmedLane));
	};

	const handleVoltarParaLane = () => {
		setUsedLanes((prev) => prev.filter((l) => l !== confirmedLane));
		setPendingLane(confirmedLane);
		setConfirmedLane(null);
		setPendingChampion(null);
		setDrawStep(DrawStep.Lane);
	};

	const handleVoltarParaJogadorAnterior = () => {
		if (currentIdx === 0) return;
		const prev = confirmed[confirmed.length - 1];
		setConfirmed((c) => c.slice(0, -1));
		setUsedLanes((l) => l.filter((lane) => lane !== prev.lane));
		setCurrentIdx((i) => i - 1);
		setDrawStep(DrawStep.Champion);
		setConfirmedLane(prev.lane);
		setPendingChampion(prev.champion);
		setPendingLane(null);
	};

	const handleConfirmarChampion = () => {
		if (!confirmedLane || !pendingChampion) return;
		const newResult: PlayerResult = {
			name: playerNames[currentIdx],
			lane: confirmedLane,
			champion: pendingChampion,
		};
		setConfirmed((prev) => [...prev, newResult]);
		if (currentIdx < 4) {
			setCurrentIdx((prev) => prev + 1);
			setDrawStep(DrawStep.Lane);
			setConfirmedLane(null);
			setPendingChampion(null);
		} else {
			setPhase(Phase.Done);
		}
	};

	const rerollChampionDone = (i: number) => {
		setConfirmed((prev) =>
			prev.map((r, idx) =>
				idx === i ? { ...r, champion: randomChampionForLane(r.lane) } : r,
			),
		);
	};

	const resetar = () => {
		setPhase(Phase.Setup);
		setPlayers(["", "", "", "", ""]);
		setConfirmed([]);
		setUsedLanes([]);
		setCurrentIdx(0);
		setDrawStep(DrawStep.Lane);
		setPendingLane(null);
		setConfirmedLane(null);
		setPendingChampion(null);
	};

	return (
		<div className="app">
			<h1 className="title">Sorteio LoL</h1>

			{phase === Phase.Setup && (
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

			{phase === Phase.Drawing && (
				<div className="drawing-phase">
					{confirmed.length > 0 && (
						<div className="results">
							{confirmed.map((r, i) => (
								<div key={i} className="result-card result-card--done">
									<span className="result-player">{r.name}</span>
									<span className="result-lane">
										<LaneIcon lane={r.lane} /> {laneLabels[r.lane]}
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

						{drawStep === DrawStep.Lane && (
							<div className="draw-step">
								<span className="draw-step-label">Sorteando Lane</span>
								{pendingLane ? (
									<>
										<span className="draw-value">
											<LaneIcon lane={pendingLane} /> {laneLabels[pendingLane]}
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
									<button className="sortear-btn" onClick={handleSortearLane}>
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

						{drawStep === DrawStep.Champion && confirmedLane && (
							<div className="draw-step">
								<span className="draw-confirmed-lane">
									<LaneIcon lane={confirmedLane} />
									{laneLabels[confirmedLane]}
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

			{phase === Phase.Done && (
				<div className="done-phase">
					<div className="results">
						{confirmed.map((r, i) => (
							<div key={i} className="result-card">
								<span className="result-player">{r.name}</span>
								<span className="result-lane">
									<LaneIcon lane={r.lane} /> {laneLabels[r.lane]}
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
	);
}

export default App;
