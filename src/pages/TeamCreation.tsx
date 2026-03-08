import React from "react";

import { PhaseRegistering, PhaseSetup } from "@/fragments";
import { LaneIcon, SLButton } from "../components";
import { useMatch } from "../hooks";
import { DrawStep, Phase, TeamKey } from "../types";

import styles from "./TeamCreation.module.css";

export const TeamCreation: React.FC = () => {
	const {
		teamSize,
		teamCount,
		resolvedPlayerNames,
		teamRegistry,
		activeTeamKey,
		matchPhase,
		currentPlayerIndex,
		currentPlayerName,
		currentTeam,
		drawState,
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
			{matchPhase === Phase.Setup && <PhaseSetup />}

			{matchPhase === Phase.Registering && <PhaseRegistering />}

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
									<SLButton onClick={drawLane}>Sortear Lane</SLButton>
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

						{drawState.step === DrawStep.Champion &&
							drawState.confirmedLane && (
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
                    <SLButton onClick={drawChampion}>Sortear Campeão</SLButton>
										
									)}
									<button
										type="button"
										className="back-btn"
										onClick={goBackToLane}
									>
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
												<span className="result-champion">
													{r.champion.name}
												</span>
												<button
													type="button"
													className="champion-reroll-btn"
													title="Reroll campeão"
													onClick={() =>
														rerollChampionForPlayer(TeamKey.TeamA, i)
													}
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
												<span className="result-champion">
													{r.champion.name}
												</span>
												<button
													type="button"
													className="champion-reroll-btn"
													title="Reroll campeão"
													onClick={() =>
														rerollChampionForPlayer(TeamKey.TeamB, i)
													}
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

					<SLButton variant="outlined" onClick={resetDraw}>
					  Novo Sorteio
					</SLButton>
				</section>
			)}
		</section>
	);
};
