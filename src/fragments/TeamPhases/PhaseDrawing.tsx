import type React from "react";
import clsx from "clsx";

import { LaneIcon, SLButton } from "@/components";
import { useMatch } from "@/hooks";
import { type BaseComponent,DrawStep,TeamKey } from "@/types";

import styles from "./TeamPhases.module.css";

type PhaseDrawingProps = BaseComponent;

export const PhaseDrawing: React.FC<PhaseDrawingProps> = ({
  className = "",
  style = {},
}) => {
  const { 
    teamCount, 
    activeTeamKey, 
    currentTeam, 
    teamSize,
    currentPlayerIndex,
    currentPlayerName,
    drawState,
    resolvedPlayerNames,
    drawLane,
    rerollLane,
    confirmLane,
    drawChampion,
    rerollChampion,
    confirmChampion,
    goBackToLane,
    goBackToPreviousPlayer,
  } = useMatch();

	return (
		<section className={clsx(styles.phaseBlock, className)} style={style}>
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

			<article className={styles.drawCardContainer}>
				<header className="draw-header">
					<span className="draw-player">{currentPlayerName}</span>
					<span className="draw-progress">
						{currentPlayerIndex + 1} / {teamSize}
					</span>
				</header>

				{drawState.step === DrawStep.Lane && (
					<div className={styles.drawStepContainer}>
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
							<SLButton onClick={drawChampion}>Sortear Campeão</SLButton>
						)}
						<button type="button" className="back-btn" onClick={goBackToLane}>
							← Voltar para Lane
						</button>
					</div>
				)}
			</article>
		</section>
	);
};
