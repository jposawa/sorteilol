import clsx from "clsx";
import type React from "react";

import { LaneIcon, SLButton } from "@/components";
import { MAX_DRAW_ROLLS } from "@/constants";
import { getChampionPortraitUrl } from "@/helpers";
import { useMatch } from "@/hooks";
import { type BaseComponent, DrawStep, TeamKey } from "@/types";

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
    canRerollCurrentLane,
    resolvedPlayerNames,
    drawLane,
    rerollLane,
    confirmLane,
    drawChampion,
    rerollChampion,
    rerollLaneForCurrentPlayer,
    confirmChampion,
    goBackToRegistering,
    goBackToPreviousPlayer,
  } = useMatch();

  const canRerollChampion = drawState.championRollCount < MAX_DRAW_ROLLS;
  const canDrawChampion =
    !drawState.pendingChampion && drawState.championRollCount < MAX_DRAW_ROLLS;

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
            <div className={styles.championSelectionPreview}>
              <div className={styles.previewItem}>
                <span className={styles.previewCircle}>
                  <LaneIcon iconName={drawState.confirmedLane} size="1.6rem" />
                </span>
				<span className={styles.laneNameText}>{drawState.confirmedLane}</span>
              </div>
              <div className={styles.previewItem}>
                <span className={styles.previewCircle}>
                  {drawState.pendingChampion ? (
                    <img
                      className={styles.championPortrait}
                      src={getChampionPortraitUrl(
                        drawState.pendingChampion.key,
                      )}
                      alt={drawState.pendingChampion.name}
                    />
                  ) : (
                    <span className={styles.championPlaceholder}>?</span>
                  )}
                </span>
                {drawState.pendingChampion && (
                  <span className={styles.championNameText}>
                    {drawState.pendingChampion.name}
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              className="back-btn"
              onClick={rerollLaneForCurrentPlayer}
              disabled={!canRerollCurrentLane}
              title={`Rerolagens de lane: ${drawState.laneRollCount}/${MAX_DRAW_ROLLS}`}
            >
              🔀 Rerollar lane ({drawState.laneRollCount}/{MAX_DRAW_ROLLS})
            </button>
            <p className="draw-step-label">Sorteando Campeão</p>
            {drawState.pendingChampion ? (
              <>
                <div className="draw-actions">
                  <button
                    type="button"
                    className="action-btn action-btn--reroll"
                    onClick={rerollChampion}
                    disabled={!canRerollChampion}
                    title={`Rerolagens de campeão: ${drawState.championRollCount}/${MAX_DRAW_ROLLS}`}
                  >
                    🎲 Reroll ({drawState.championRollCount}/{MAX_DRAW_ROLLS})
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
              <SLButton onClick={drawChampion} disabled={!canDrawChampion}>
                Sortear Campeão ({drawState.championRollCount}/{MAX_DRAW_ROLLS})
              </SLButton>
            )}
            <button
              type="button"
              className="back-btn"
              onClick={goBackToRegistering}
            >
              ← Voltar para registrar jogadores
            </button>
          </div>
        )}
      </article>
    </section>
  );
};
