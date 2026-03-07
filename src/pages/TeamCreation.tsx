import React from "react";

import { LaneIcon } from "../components";
import { useMatch } from "../hooks";
import { DrawStep, Phase, TeamKey } from "../types";

import styles from "./TeamCreation.module.css";

export const TeamCreation: React.FC = () => {
	const {
		teamSize,
		teamCount,
		playerNames,
		resolvedPlayerNames,
		teamRegistry,
		activeTeamKey,
		matchPhase,
		currentPlayerIndex,
		currentPlayerName,
		currentTeam,
		drawState,
		updateTeamSize,
		updateTeamCount,
		updatePlayerName,
		startDraw,
		drawLane,
		rerollLane,
		confirmLane,
		drawChampion,
		rerollChampion,
		confirmChampion,
		goBackToLane,
		goBackToPreviousPlayer,
		rerollChampionForPlayer,
		resetDraw,
	} = useMatch();

	return (
		<section className={styles.mainContainer}>
			{matchPhase === Phase.Setup && (
				<form
					className="players-form"
					onSubmit={(e) => {
						e.preventDefault();
						startDraw();
					}}
				>
					<fieldset className="config-fieldset">
						<legend>Configuração da Partida</legend>

						<div className="config-row">
							<label htmlFor="team-count">Número de times</label>
							<select
								id="team-count"
								value={teamCount}
								onChange={(e) => updateTeamCount(Number(e.target.value) as 1 | 2)}
							>
								<option value={1}>1 time</option>
								<option value={2}>2 times</option>
							</select>
						</div>

						<div className="config-row">
							<label htmlFor="team-size">Jogadores por time</label>
							<input
								id="team-size"
								type="number"
								min={1}
								max={5}
								value={teamSize}
								onChange={(e) => updateTeamSize(Number(e.target.value))}
							/>
						</div>
					</fieldset>

					<fieldset className="players-fieldset">
						<legend>{teamCount === 2 ? "Time A" : "Jogadores"}</legend>
						<ol className="player-list">
							{playerNames.teamA.map((name, i) => (
								<li key={i}>
									<label htmlFor={`player-a-${i}`}>Jogador {i + 1}</label>
									<input
										id={`player-a-${i}`}
										type="text"
										className="player-input"
										placeholder={`Jogador ${i + 1}`}
										value={name}
										onChange={(e) =>
											updatePlayerName(TeamKey.TeamA, i, e.target.value)
										}
									/>
								</li>
							))}
						</ol>
					</fieldset>

					{teamCount === 2 && (
						<fieldset className="players-fieldset">
							<legend>Time B</legend>
							<ol className="player-list">
								{playerNames.teamB.map((name, i) => (
									<li key={i}>
										<label htmlFor={`player-b-${i}`}>Jogador {i + 1}</label>
										<input
											id={`player-b-${i}`}
											type="text"
											className="player-input"
											placeholder={`Jogador ${i + 1}`}
											value={name}
											onChange={(e) =>
												updatePlayerName(TeamKey.TeamB, i, e.target.value)
											}
										/>
									</li>
								))}
							</ol>
						</fieldset>
					)}

					<button type="submit" className="sortear-btn">
						Iniciar Sorteio
					</button>
				</form>
			)}

			{matchPhase === Phase.Drawing && (
				<section className="drawing-phase">
					{teamCount === 2 && (
						<p className="active-team-label">
							{activeTeamKey === TeamKey.TeamA ? "Time A" : "Time B"}
						</p>
					)}

					{currentTeam.length > 0 && (
						<ol className="results">
							{currentTeam.map((r, i) => (
								<li key={i} className="result-card result-card--done">
									<span className="result-player">{r.name}</span>
									<span className="result-lane">
										<LaneIcon iconName={r.lane} /> {r.lane}
									</span>
									<span className="result-champion">{r.champion.name}</span>
								</li>
							))}
						</ol>
					)}

					<article className="draw-card">
						<header className="draw-header">
							<span className="draw-player">{currentPlayerName}</span>
							<span className="draw-progress">
								{currentPlayerIndex + 1} / {teamSize}
							</span>
						</header>

						{drawState.step === DrawStep.Lane && (
							<div className="draw-step">
								<p className="draw-step-label">Sorteando Lane</p>
								{drawState.pendingLane ? (
									<>
										<span className="draw-value">
											<LaneIcon iconName={drawState.pendingLane} />{" "}
											{drawState.pendingLane}
										</span>
										<div className="draw-actions">
											<button
												type="button"
												className="action-btn action-btn--reroll"
												onClick={rerollLane}
											>
												🔀 Reroll
											</button>
											<button
												type="button"
												className="action-btn action-btn--confirm"
												onClick={confirmLane}
											>
												✓ Confirmar
											</button>
										</div>
									</>
								) : (
									<button type="button" className="sortear-btn" onClick={drawLane}>
										Sortear Lane
									</button>
								)}
								{currentPlayerIndex > 0 && (
									<button
										type="button"
										className="back-btn"
										onClick={goBackToPreviousPlayer}
									>
										← Voltar para{" "}
										{resolvedPlayerNames[activeTeamKey][currentPlayerIndex - 1]}
									</button>
								)}
							</div>
						)}

						{drawState.step === DrawStep.Champion && drawState.confirmedLane && (
							<div className="draw-step">
								<span className="draw-confirmed-lane">
									<LaneIcon iconName={drawState.confirmedLane} />{" "}
									{drawState.confirmedLane}
								</span>
								<p className="draw-step-label">Sorteando Campeão</p>
								{drawState.pendingChampion ? (
									<>
										<span className="draw-value draw-value--champion">
											{drawState.pendingChampion.name}
										</span>
										<div className="draw-actions">
											<button
												type="button"
												className="action-btn action-btn--reroll"
												onClick={rerollChampion}
											>
												🎲 Reroll
											</button>
											<button
												type="button"
												className="action-btn action-btn--confirm"
												onClick={confirmChampion}
											>
												✓ Confirmar
											</button>
										</div>
									</>
								) : (
									<button
										type="button"
										className="sortear-btn"
										onClick={drawChampion}
									>
										Sortear Campeão
									</button>
								)}
								<button type="button" className="back-btn" onClick={goBackToLane}>
									← Voltar para Lane
								</button>
							</div>
						)}
					</article>
				</section>
			)}

			{matchPhase === Phase.Done && (
				<section className="done-phase">
					{teamCount === 2 ? (
						<>
							<article className="team-results">
								<h2>Time A</h2>
								<ol className="results">
									{teamRegistry.teamA.map((r, i) => (
										<li key={i} className="result-card">
											<span className="result-player">{r.name}</span>
											<span className="result-lane">
												<LaneIcon iconName={r.lane} /> {r.lane}
											</span>
											<div className="result-champion-group">
												<span className="result-champion">{r.champion.name}</span>
												<button
													type="button"
													className="champion-reroll-btn"
													title="Reroll campeão"
													onClick={() => rerollChampionForPlayer(TeamKey.TeamA, i)}
												>
													🎲
												</button>
											</div>
										</li>
									))}
								</ol>
							</article>
							<article className="team-results">
								<h2>Time B</h2>
								<ol className="results">
									{teamRegistry.teamB.map((r, i) => (
										<li key={i} className="result-card">
											<span className="result-player">{r.name}</span>
											<span className="result-lane">
												<LaneIcon iconName={r.lane} /> {r.lane}
											</span>
											<div className="result-champion-group">
												<span className="result-champion">{r.champion.name}</span>
												<button
													type="button"
													className="champion-reroll-btn"
													title="Reroll campeão"
													onClick={() => rerollChampionForPlayer(TeamKey.TeamB, i)}
												>
													🎲
												</button>
											</div>
										</li>
									))}
								</ol>
							</article>
						</>
					) : (
						<ol className="results">
							{teamRegistry.teamA.map((r, i) => (
								<li key={i} className="result-card">
									<span className="result-player">{r.name}</span>
									<span className="result-lane">
										<LaneIcon iconName={r.lane} /> {r.lane}
									</span>
									<div className="result-champion-group">
										<span className="result-champion">{r.champion.name}</span>
										<button
											type="button"
											className="champion-reroll-btn"
											title="Reroll campeão"
											onClick={() => rerollChampionForPlayer(TeamKey.TeamA, i)}
										>
											🎲
										</button>
									</div>
								</li>
							))}
						</ol>
					)}

					<button
						type="button"
						className="sortear-btn resetar-btn"
						onClick={resetDraw}
					>
						Novo Sorteio
					</button>
				</section>
			)}
		</section>
	);
};
