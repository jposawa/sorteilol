import React from "react";

import { PhaseDrawing, PhaseRegistering, PhaseSetup } from "@/fragments";
import { LaneIcon, SLButton } from "../components";
import { useMatch } from "../hooks";
import { Phase, TeamKey } from "../types";

export const TeamCreation: React.FC = () => {
	const {
		teamCount,
		teamRegistry,
		matchPhase,
		rerollChampionForPlayer,
		resetDraw,
	} = useMatch();

	return (
		<>
			{matchPhase === Phase.Setup && <PhaseSetup />}

			{matchPhase === Phase.Registering && <PhaseRegistering />}

			{matchPhase === Phase.Drawing && <PhaseDrawing />}

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
		</>
	);
};
