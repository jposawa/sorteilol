import React from "react";
import {
  MdBalance,
  MdCheckCircle,
  MdGavel,
  MdMilitaryTech,
  MdSchedule,
  MdVisibility,
  MdWarning,
} from "react-icons/md";
import clsx from "clsx";

import { ADVANCE_WINS, ELIMINATION_LOSSES } from "@/constants";
import {
  getStandings,
  isCompetitionResolved,
  matchRefKey,
  useCompetition,
} from "@/hooks/useCompetition";
import { type TeamStanding } from "@/hooks/useCompetition";
import { type CompetitionMatch } from "@/types";

import styles from "./Competition.module.css";

type CompetitionRoundsProps = {
  activeRound: number;
  onActiveRoundChange: (round: number) => void;
  onOpenDraft: (matchKey: string) => void;
  onOpenPairModal: () => void;
};

const teamTag = (name: string) => {
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

const recordOf = (
  standingsBySeed: Map<number, TeamStanding>,
  seed: number,
): { wins: number; losses: number; standing: TeamStanding | null } => {
  const standing = standingsBySeed.get(seed) ?? null;

  return {
    wins: standing?.wins ?? 0,
    losses: standing?.losses ?? 0,
    standing,
  };
};

/** Chave do confronto = record do lado com pior campanha (pairing down cai na chave de baixo). */
const poolKeyOfMatch = (
  standingsBySeed: Map<number, TeamStanding>,
  match: CompetitionMatch,
): string | null => {
  const sideA = recordOf(standingsBySeed, match.seedA);
  const sideB =
    match.seedB === -1
      ? null
      : recordOf(standingsBySeed, match.seedB);

  if (!sideA.standing) {
    return sideB ? `${sideB.wins}-${sideB.losses}` : null;
  }

  if (!sideB) {
    return `${sideA.wins}-${sideA.losses}`;
  }

  const weaker =
    sideA.wins !== sideB.wins
      ? sideA.wins < sideB.wins
        ? sideA
        : sideB
      : sideA.losses !== sideB.losses
        ? sideA.losses > sideB.losses
          ? sideA
          : sideB
        : sideA;

  return `${weaker.wins}-${weaker.losses}`;
};

/** Placar da série: sem lista de jogos no match, series decididas mostram 1-0. */

type PoolGroup = {
  key: string;
  matches: CompetitionMatch[];
};

export const CompetitionRounds: React.FC<CompetitionRoundsProps> = ({
  activeRound,
  onActiveRoundChange,
  onOpenDraft,
  onOpenPairModal,
}) => {
  const { activeCompetition, canGenerateNextRound, nextRoundNumber, reportWinner } =
    useCompetition();

  const rounds = React.useMemo(() => {
    if (!activeCompetition) {
      return [];
    }

    return [...new Set(activeCompetition.matches.map((match) => match.round))].sort(
      (a, b) => a - b,
    );
  }, [activeCompetition]);

  if (!activeCompetition) {
    return null;
  }

  const resolved = isCompetitionResolved(activeCompetition);

  /** Record PRÉ-rodada: só séries de rodadas anteriores contam nas chaves. */
  const standingsBySeed = new Map(
    getStandings({
      ...activeCompetition,
      matches: activeCompetition.matches.filter(
        (match) => match.round < activeRound,
      ),
    }).map((standing) => [standing.team.seed, standing]),
  );

  const recordsOfRound = (round: number) => {
    const preStandings = getStandings({
      ...activeCompetition,
      matches: activeCompetition.matches.filter(
        (candidate) => candidate.round < round,
      ),
    });
    const bySeed = new Map(
      preStandings.map((standing) => [standing.team.seed, standing]),
    );

    const keys = new Set(
      activeCompetition.matches
        .filter((match) => match.round === round)
        .map((match) => poolKeyOfMatch(bySeed, match)),
    );

    return [...keys].filter(Boolean).join(" / ") || "-";
  };

  const roundMatches = activeCompetition.matches
    .filter((match) => match.round === activeRound)
    .sort((a, b) => a.seedA - b.seedA || a.seedB - b.seedB);

  const pools: PoolGroup[] = (() => {
    const poolsMap = new Map<string, CompetitionMatch[]>();

    roundMatches.forEach((match) => {
      const poolKey = poolKeyOfMatch(standingsBySeed, match);

      if (!poolKey) {
        return;
      }

      poolsMap.set(poolKey, [...(poolsMap.get(poolKey) ?? []), match]);
    });

    return [...poolsMap.entries()]
      .sort(([keyA], [keyB]) => {
        const [winsA, lossesA] = keyA.split("-").map(Number);
        const [winsB, lossesB] = keyB.split("-").map(Number);

        return winsB - winsA || lossesA - lossesB;
      })
      .map(([key, matches]) => ({ key, matches }));
  })();

  const seriesLength = roundMatches[0]?.seriesLength ?? 1;

  return (
    <section className={styles.roundsScreen}>
      <div className={styles.arenaHead}>
        <div>
          <span className={styles.arenaTag}>Formato oficial suíço</span>
          <h2 className={styles.arenaTitle}>Arena de confrontos por chaves</h2>
        </div>

        <div className={styles.switcher}>
          {rounds.map((round) => (
            <button
              key={round}
              type="button"
              className={clsx(
                styles.switchTab,
                round === activeRound && styles.switchTabActive,
              )}
              onClick={() => onActiveRoundChange(round)}
            >
              Rodada {round} ({recordsOfRound(round)})
            </button>
          ))}

          {!resolved && !rounds.includes(nextRoundNumber) && (
            <button
              type="button"
              disabled
              className={clsx(styles.switchTab, styles.switchTabSoon)}
            >
              Rodada {nextRoundNumber}
            </button>
          )}
        </div>
      </div>

      <div className={styles.pools}>
        {pools.map((pool, index) => {
          const [poolWins, poolLosses] = pool.key.split("-").map(Number);
          const poolStyle =
            pools.length === 1
              ? "poolPrimary"
              : index === 0
                ? "poolGold"
                : index === pools.length - 1
                  ? "poolError"
                  : "poolPrimary";

          const isLast = index === pools.length - 1 && pools.length > 1;
          const poolTitle =
            index === 0
              ? poolWins + 1 >= ADVANCE_WINS
                ? `Chave da Vaga (${pool.key})`
                : `Chave Superior (${pool.key})`
              : isLast
                ? poolLosses + 1 >= ELIMINATION_LOSSES
                  ? `Chave de Eliminação (${pool.key})`
                  : `Chave Inferior (${pool.key})`
                : `Chave Intermediária (${pool.key})`;

          const poolSub =
            index === 0 && poolWins + 1 >= ADVANCE_WINS
              ? "Vencer avança"
              : isLast && poolLosses + 1 >= ELIMINATION_LOSSES
                ? "Derrota elimina"
                : `Série Bo${seriesLength}`;

          const poolIcon =
            poolStyle === "poolGold"
              ? MdMilitaryTech
              : poolStyle === "poolError"
                ? MdWarning
                : MdBalance;

          const PoolIcon = poolIcon;

          return (
            <div key={pool.key} className={styles.poolPanel}>
              <header className={clsx(styles.poolHeader, styles[poolStyle])}>
                <div className={styles.poolIcon}>
                  <PoolIcon size={18} aria-hidden="true" />
                  <span className={styles.poolTitle}>{poolTitle}</span>
                </div>

                <span
                  className={clsx(
                    styles.poolSub,
                    poolStyle !== "poolPrimary" && styles.poolSubAccent,
                  )}
                >
                  {poolSub}
                </span>
              </header>

              {pool.matches.map((match) => {
                if (match.seedB === -1) {
                  const byeTeam = recordOf(standingsBySeed, match.seedA);

                  return (
                    <div key={matchRefKey(match)} className={styles.matchCard}>
                      <div className={styles.matchTop}>
                        <span className={styles.matchLabel}>
                          Série Bo{match.seriesLength} · Rodada {match.round}
                        </span>

                        <span className={clsx(styles.statusBadge, styles.statusDone)}>
                          <MdCheckCircle size={12} aria-hidden="true" />
                          Concluído
                        </span>
                      </div>

                      <div className={styles.byeRow}>
                        <MdCheckCircle size={14} aria-hidden="true" />
                        <span>
                          Vitória administrativa (bye) —{" "}
                          <b>{byeTeam.standing?.team.name ?? "Time"}</b>
                        </span>
                      </div>
                    </div>
                  );
                }

                const status = match.winner
                  ? "done"
                  : match.draftState
                    ? "live"
                    : "wait";
                const sideA = recordOf(standingsBySeed, match.seedA);
                const sideB = recordOf(standingsBySeed, match.seedB);

                return (
                  <div
                    key={matchRefKey(match)}
                    className={clsx(
                      styles.matchCard,
                      status === "live" && styles.matchCardLive,
                    )}
                  >
                    <div className={styles.matchTop}>
                      <span className={styles.matchLabel}>
                        Série Bo{match.seriesLength} ·{" "}
                        {status === "done"
                          ? "Finalizado"
                          : status === "live"
                            ? "Draft em andamento"
                            : "Confronto"}
                      </span>

                      {status === "done" && (
                        <span className={clsx(styles.statusBadge, styles.statusDone)}>
                          <MdCheckCircle size={12} aria-hidden="true" />
                          Concluído
                        </span>
                      )}

                      {status === "live" && (
                        <span className={clsx(styles.statusBadge, styles.statusLive)}>
                          <span className={styles.pulseDot} aria-hidden="true" />
                          Em andamento
                        </span>
                      )}

                      {status === "wait" && (
                        <span className={clsx(styles.statusBadge, styles.statusWait)}>
                          <MdSchedule size={12} aria-hidden="true" />
                          Aguardando resultado
                        </span>
                      )}
                    </div>

                    <div className={styles.teamsWrap}>
                      {[sideA, sideB].map((side, sideIndex) => {
                        const seed = sideIndex === 0 ? match.seedA : match.seedB;
                        const isWinner =
                          match.winner === (sideIndex === 0 ? "seedA" : "seedB");
                        const nextEdge = side.losses + 1 >= ELIMINATION_LOSSES;

                        let sub: string;

                        if (!match.winner) {
                          sub = `Seed #${seed} (${side.wins}-${side.losses})`;
                        } else if (isWinner) {
                          const nextWins = side.wins + 1;

                          sub =
                            nextWins >= ADVANCE_WINS
                              ? `Avançou (${nextWins}-${side.losses})`
                              : side.losses >= 2
                                ? `Sobrevive (${nextWins}-${side.losses})`
                                : `Avança para (${nextWins}-${side.losses})`;
                        } else {
                          const nextLosses = side.losses + 1;

                          sub =
                            nextLosses >= ELIMINATION_LOSSES
                              ? `Eliminado (${side.wins}-${nextLosses})`
                              : `Cai para (${side.wins}-${nextLosses})`;
                        }

                        return (
                          <button
                            key={seed}
                            type="button"
                            className={clsx(styles.teamRow, styles.teamRowClickable)}
                            title="Marcar/desmarcar vencedor da série"
                            onClick={() =>
                              reportWinner(
                                match,
                                sideIndex === 0 ? "seedA" : "seedB",
                              )
                            }
                          >
                            <div className={styles.teamLeft}>
                              <div
                                className={clsx(
                                  styles.teamTag,
                                  isWinner && styles.teamTagGold,
                                  sub.startsWith("Eliminado") && styles.teamTagError,
                                )}
                              >
                                {teamTag(side.standing?.team.name ?? `Time ${seed}`)}
                              </div>

                              <div className={styles.teamInfo}>
                                <div
                                  className={clsx(
                                    styles.teamName,
                                    isWinner && styles.teamNameGold,
                                    match.winner && !isWinner && styles.teamNameStruck,
                                  )}
                                >
                                  {side.standing?.team.name ?? `Time ${seed}`}
                                </div>

                                <div
                                  className={clsx(
                                    styles.teamSub,
                                    ((!match.winner && nextEdge) ||
                                      sub.startsWith("Eliminado")) &&
                                      styles.teamSubError,
                                  )}
                                >
                                  {sub}
                                </div>
                              </div>
                            </div>

                            <span
                              className={clsx(
                                styles.teamScore,
                                isWinner && styles.scoreGold,
                              )}
                            >
                              {match.winner ? (isWinner ? "1" : "0") : "-"}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {match.winner ? (
                      match.draftState && (
                        <button
                          type="button"
                          className={clsx(styles.matchCta, styles.ctaGhost)}
                          onClick={() => onOpenDraft(matchRefKey(match))}
                        >
                          <MdVisibility size={14} aria-hidden="true" />
                          Rever picks &amp; bans
                        </button>
                      )
                    ) : (
                      <button
                        type="button"
                        className={clsx(styles.matchCta, styles.ctaGradient)}
                        onClick={() => onOpenDraft(matchRefKey(match))}
                      >
                        <MdGavel size={14} aria-hidden="true" />
                        {match.draftState ? "Continuar draft" : "Abrir sala de draft"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {resolved ? (
        <aside className={styles.resolvedNote}>
          Competição encerrada — os avanços e eliminações fecharam o chaveamento.
          Confira o ranking completo abaixo.
        </aside>
      ) : canGenerateNextRound ? (
        <aside className={styles.pairPrompt}>
          <p className={styles.pairPromptText}>
            Todas as séries da rodada {activeRound} fecharam — a rodada{" "}
            {nextRoundNumber} (suíço) está pronta para emparelhamento.
          </p>

          <button
            type="button"
            className={clsx(styles.matchCta, styles.ctaGradient, styles.pairCta)}
            onClick={onOpenPairModal}
          >
            <MdSchedule size={14} aria-hidden="true" />
            Emparelhar rodada {nextRoundNumber}
          </button>
        </aside>
      ) : (
        <aside className={styles.matchSideNote} style={{ padding: "0.25rem 0.5rem" }}>
          A rodada {activeRound} tem séries em aberto — marque o vencedor de cada
          série (clique no time) ou abra o draft dela.
        </aside>
      )}
    </section>
  );
};

export default CompetitionRounds;