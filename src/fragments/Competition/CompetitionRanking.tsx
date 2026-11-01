import React from "react";
import clsx from "clsx";

import { ADVANCE_WINS, ELIMINATION_LOSSES } from "@/constants";
import { getRanking, useCompetition } from "@/hooks/useCompetition";
import { type TeamStanding } from "@/hooks/useCompetition";

import styles from "./Competition.module.css";

/** Sigla curta (até 3 letras) — mesmo algoritmo do quad de time dos cards. */
const tagOfName = (name: string) => {
  const words = name.split(/[^\p{L}\p{N}]+/u).filter(Boolean);

  if (words.length === 0) {
    return "???";
  }

  if (words.length === 1) {
    return words[0].slice(0, 3).toUpperCase();
  }

  if (words.length === 2) {
    return `${words[0][0]}${words[1].slice(0, 2)}`.toUpperCase();
  }

  return words
    .slice(0, 3)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
};

type StatusChip = { label: string; className: string };

const statusChipOf = (standing: TeamStanding): StatusChip => {
  if (standing.status === "advanced") {
    return { label: "Avançou (3W)", className: styles.chipGold };
  }

  if (standing.status === "eliminated") {
    return { label: "Eliminado", className: styles.chipEliminated };
  }

  if (standing.losses + 1 >= ELIMINATION_LOSSES) {
    return { label: "Risco Crítico", className: styles.chipError };
  }

  if (standing.wins + 1 >= ADVANCE_WINS) {
    return { label: "Disputa Vaga", className: styles.chipGold };
  }

  return { label: "Na Corrida", className: styles.chipPrimary };
};

const posColorClass = (chip: StatusChip) => {
  if (chip.className === styles.chipGold) {
    return styles.rankPosGold;
  }

  if (
    chip.className === styles.chipError ||
    chip.className === styles.chipEliminated
  ) {
    return styles.rankPosError;
  }

  return null;
};

export const CompetitionRanking: React.FC = () => {
  const { activeCompetition } = useCompetition();

  const ranking = React.useMemo(() => {
    if (!activeCompetition) {
      return [];
    }

    return getRanking(activeCompetition);
  }, [activeCompetition]);

  if (!activeCompetition || ranking.length === 0) {
    return null;
  }

  return (
    <section className={clsx(styles.panel, styles.rankPanel)}>
      <div className={styles.panelHead}>
        <div>
          <span className={styles.panelTag}>Classificação do Suíço</span>
          <h3 className={styles.panelTitle}>Ranking geral das equipes</h3>
        </div>

        <span className={styles.panelSideMeta}>
          Critério: avanço · séries · Buchholz
        </span>
      </div>

      <div className={styles.rankTableWrap}>
        <table className={styles.rankTable}>
          <thead>
            <tr>
              <th># Rank</th>
              <th>Equipe</th>
              <th className={styles.center}>Pts</th>
              <th className={styles.center}>W - L</th>
              <th className={styles.center}>Saldo</th>
              <th className={styles.center}>Buchholz</th>
              <th className={styles.right}>Status</th>
            </tr>
          </thead>

          <tbody>
            {ranking.map((standing, index) => {
              const chip = statusChipOf(standing);
              const diff = standing.wins - standing.losses;

              return (
                <tr
                  key={standing.team.seed}
                  className={clsx(
                    styles.rankRow,
                    standing.status === "eliminated" && styles.rankRowEliminated,
                  )}
                >
                  <td
                    className={clsx(
                      styles.rankPos,
                      posColorClass(chip),
                    )}
                  >
                    #{String(index + 1).padStart(2, "0")}
                  </td>

                  <td>
                    <div className={styles.rankTeamCell}>
                      <span className={styles.rankTagMini}>
                        {tagOfName(standing.team.name)}
                      </span>

                      <span
                        className={clsx(
                          styles.rankName,
                          standing.status === "eliminated" && styles.rankStruck,
                        )}
                      >
                        {standing.team.name}
                      </span>
                    </div>
                  </td>

                  <td className={clsx(styles.rankPts, styles.center)}>
                    {standing.wins * 3}
                  </td>

                  <td
                    className={clsx(
                      styles.rankWl,
                      styles.center,
                      standing.losses + 1 >= ELIMINATION_LOSSES &&
                        standing.status === "active" &&
                        styles.rankWlError,
                    )}
                  >
                    {standing.wins} - {standing.losses}
                  </td>

                  <td className={clsx(styles.rankDiff, styles.center)}>
                    <span
                      className={clsx(
                        diff > 0 && styles.diffPos,
                        diff < 0 && styles.diffNeg,
                      )}
                    >
                      {diff > 0 ? `+${diff}` : diff}
                    </span>
                  </td>

                  <td className={clsx(styles.rankBuch, styles.center)}>
                    {standing.buchholz}
                  </td>

                  <td className={styles.right}>
                    <span className={clsx(styles.statusChip, chip.className)}>
                      {chip.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};