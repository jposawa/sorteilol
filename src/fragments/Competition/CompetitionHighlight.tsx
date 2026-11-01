import React from "react";
import clsx from "clsx";

import { ALL_LANES, CHAMPIONS } from "@/constants";
import { getChampionPortraitUrl } from "@/helpers";
import { matchRefKey, useCompetition } from "@/hooks/useCompetition";
import { Lane, TeamKey } from "@/types";

import styles from "./Competition.module.css";

const LANE_SHORT: Record<Lane, string> = {
  [Lane.Top]: "TOP",
  [Lane.Jungle]: "JUG",
  [Lane.Mid]: "MID",
  [Lane.ADC]: "ADC",
  [Lane.Support]: "SUP",
};

export const CompetitionHighlight: React.FC = () => {
  const { activeCompetition } = useCompetition();

  const highlight = React.useMemo(() => {
    if (!activeCompetition) {
      return null;
    }

    return (
      activeCompetition.matches
        .filter((match) => match.winner !== null && match.draftState !== null)
        .sort((a, b) => b.round - a.round)[0] ?? null
    );
  }, [activeCompetition]);

  if (!activeCompetition || !highlight || !highlight.draftState) {
    return null;
  }

  const draftState = highlight.draftState;
  const teamA = activeCompetition.teams.find(
    (team) => team.seed === highlight.seedA,
  );
  const teamB = activeCompetition.teams.find(
    (team) => team.seed === highlight.seedB,
  );

  const renderSide = (side: TeamKey) => {
    const isBlue = side === TeamKey.TeamA;
    const isWinner = highlight.winner === (isBlue ? "seedA" : "seedB");
    const team = isBlue ? teamA : teamB;
    const picks = ALL_LANES.map((lane) => ({
      lane,
      championKey: draftState.picks[side][lane] ?? null,
    })).filter((pick): pick is { lane: Lane; championKey: string } =>
      Boolean(pick.championKey),
    );
    const bans = draftState.bans[side]
      .filter((ban): ban is string => Boolean(ban))
      .map((key) => CHAMPIONS[key]?.name ?? key);

    return (
      <div
        key={side}
        className={clsx(styles.sidePanel, !isWinner && styles.sidePanelLoser)}
      >
        <div className={styles.sideHead}>
          <div className={styles.sideHeadLeft}>
            <span
              className={clsx(styles.sideDot, isBlue ? styles.dotBlue : styles.dotRed)}
            />

            <span
              className={clsx(
                styles.sideTitle,
                isWinner ? (isBlue ? styles.sideTitleBlue : styles.sideTitleRed) : null,
              )}
            >
              {team?.name ?? "Time"} — {isWinner ? "Vitória" : "Derrota"}
            </span>
          </div>

          <span className={styles.panelSideMeta}>
            {isBlue ? "Lado Azul" : "Lado Vermelho"}
          </span>
        </div>

        {picks.length > 0 && (
          <div className={styles.picksGrid}>
            {picks.map(({ lane, championKey }) => (
              <div key={lane} className={styles.pickCell}>
                <img
                  className={styles.pickImg}
                  src={getChampionPortraitUrl(championKey)}
                  alt={CHAMPIONS[championKey]?.name ?? championKey}
                  loading="lazy"
                />
                <span className={styles.pickName}>
                  {CHAMPIONS[championKey]?.name ?? championKey}
                </span>
                <span
                  className={clsx(
                    styles.pickLane,
                    !isBlue && styles.pickLaneRed,
                  )}
                >
                  {LANE_SHORT[lane]}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className={styles.sideBansRow}>
          <span>Bans do time: {bans.length > 0 ? bans.join(", ") : "nenhum"}</span>
        </div>
      </div>
    );
  };

  return (
    <section className={clsx(styles.panel, styles.panelLow)}>
      <div className={styles.panelHead}>
        <div>
          <span className={styles.panelTag}>Análise Tática Pós-Jogo</span>
          <h3 className={styles.highlightTitle}>
            Destaque recente: {teamA?.name ?? "—"} vs {teamB?.name ?? "—"} · Série
            Bo{highlight.seriesLength}
          </h3>
        </div>

        <div className={styles.panelSideMeta}>
          <span>
            Vencedor:{" "}
            <strong data-match-key={matchRefKey(highlight)}>
              {highlight.winner === "seedA"
                ? teamA?.name ?? "—"
                : teamB?.name ?? "—"}
            </strong>
          </span>
        </div>
      </div>

      <div className={styles.sidePanels}>
        {renderSide(TeamKey.TeamA)}
        {renderSide(TeamKey.TeamB)}
      </div>
    </section>
  );
};