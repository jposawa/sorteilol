import React from "react";
import { GiTrophy } from "react-icons/gi";
import {
  MdAdd,
  MdCalendarMonth,
  MdFormatListNumbered,
  MdSensors,
  MdSportsMartialArts,
  MdStars,
} from "react-icons/md";
import { MdBolt } from "react-icons/md";
import { useAtom } from "jotai";

import { SLButton } from "@/components";
import { CHAMPIONS, TOTAL_TURNS } from "@/constants";
import { getChampionUsageStats } from "@/helpers/draftGame";
import { useDraftSession, useRegisteredTeams } from "@/hooks";
import { getRanking, matchRefKey } from "@/hooks/useCompetition";
import { competitionsAtom, sessionsAtom } from "@/state";
import { type Competition,TeamKey } from "@/types";

import styles from "./Arena.module.css";

type LiveRow = {
  key: string;
  labelA: string;
  labelB: string;
  scoreA: number;
  scoreB: number;
  meta: string;
  turnHint: string;
  sessionKey?: string;
  hasDraftRunning: boolean;
};

const POINTS_PER_WIN = 20;
const POINTS_PER_LOSS = 5;

export const Arena: React.FC = () => {
  const { setAppScreen, openSession } = useDraftSession();
  const { teams: registeredTeams } = useRegisteredTeams();
  const [sessions] = useAtom(sessionsAtom);
  const [competitions] = useAtom(competitionsAtom);

  const liveSessions = React.useMemo(
    () => sessions.filter((session) => session.status === "active"),
    [sessions],
  );

  const doneSessions = React.useMemo(
    () => sessions.filter((session) => session.status === "done"),
    [sessions],
  );

  const activeCompetition = React.useMemo(
    () => competitions.find((competitions) => competitions.status === "active") ?? competitions[0] ?? null,
    [competitions],
  );

  // Matches com draft aberto (live) e com o confronto aguardando draft.
  const [{ liveMatches, scheduledMatches }] = React.useMemo(() => {
    if (!activeCompetition) {
      return [{ liveMatches: [], scheduledMatches: [] }] as const;
    }

    const live: LiveRow[] = [];
    const scheduled: LiveRow[] = [];

    activeCompetition.matches.forEach((match) => {
      if (match.seedB === -1 || match.winner) {
        return;
      }

      const teamNameOf = (seed: number) =>
        activeCompetition.teams.find((team) => team.seed === seed)?.name ?? "Time";

      const key = matchRefKey(match);
      const base = {
        key,
        labelA: teamNameOf(match.seedA),
        labelB: teamNameOf(match.seedB),
        scoreA: 0,
        scoreB: 0,
        meta: `Rodada ${match.round} • Bo${match.seriesLength}`,
      };

      if (match.draftState) {
        live.push({
          ...base,
          turnHint: `Draft em andamento (turno ${Math.min(match.draftState.turnIndex + 1, TOTAL_TURNS)}/${TOTAL_TURNS})`,
          hasDraftRunning: true,
        });
      } else {
        scheduled.push({
          ...base,
          turnHint: "Confronto aguardando draft",
          hasDraftRunning: false,
        });
      }
    });

    return [{ liveMatches: live, scheduledMatches: scheduled }] as const;
  }, [activeCompetition]);

  // Meta: uso de campeões sobre todos os drafts persistidos (séries + matches).
  const metaRows = React.useMemo(() => {
    const games = [
      ...sessions.flatMap((session) => [...session.games, session.currentGame]),
      ...(activeCompetition?.matches
        .map((match) => match.draftState)
        .filter((game) => Boolean(game)) ?? []),
    ];

    const stats = getChampionUsageStats(games as never);
    const totalDrafts = Math.max(games.length, 1);

    return [...stats.entries()]
      .map(([championKey, usage]) => {
        const presence = usage.wins + usage.losses;
        const winRate =
          presence > 0 ? Math.round((usage.wins / presence) * 1000) / 10 : null;

        return {
          championKey,
          picks: usage.picks,
          bansCount: presence,
          banRate:
            Math.round(
              (presence / totalDrafts) * 1000,
            ) / 10,
          presence:
            Math.round(
              ((usage.picks + presence) / (totalDrafts * 20)) * 1000,
            ) / 10,
          winRate,
        };
      })
      .sort((a, b) => b.picks + b.bansCount - (a.picks + a.bansCount))
      .slice(0, 4);
  }, [sessions, activeCompetition]);

  // Ranking agregado das equipes (todas as competições).
  const ranking = React.useMemo(() => {
    const rows: { name: string; wins: number; losses: number }[] = [];

    competitions.forEach((competition: Competition) => {
      getRanking(competition).forEach((standing) => {
        const row = rows.find((candidate) => candidate.name === standing.team.name);

        if (row) {
          row.wins += standing.wins;
          row.losses += standing.losses;
        } else {
          rows.push({
            name: standing.team.name,
            wins: standing.wins,
            losses: standing.losses,
          });
        }
      });
    });

    return rows
      .map((row) => ({
        ...row,
        balance: row.wins - row.losses,
        points: row.wins * POINTS_PER_WIN - row.losses * POINTS_PER_LOSS,
      }))
      .sort(
        (a, b) =>
          b.points - a.points || b.wins - a.wins || a.name.localeCompare(b.name),
      )
      .slice(0, 5);
  }, [competitions]);

  // Hall da fama: jogadores dos elencos registrados (proxy p/ abates, que o
  // app não registra — vitórias do elenco).
  const elites = React.useMemo(() => {
    const rankingByName = new Map(
      ranking.map((row) => [row.name, row] as const),
    );

    const rows: {
      name: string;
      team: string;
      wins: number;
      rate: string;
    }[] = [];

    registeredTeams.forEach((team) => {
      const row = rankingByName.get(team.name);

      if (!row) {
        return;
      }

      team.players.forEach((player) => {
        if (!player.trim()) {
          return;
        }

        rows.push({
          name: player.trim(),
          team: team.name,
          wins: row.wins,
          rate:
            row.wins + row.losses > 0
              ? Math.round((row.wins / (row.wins + row.losses)) * 100) + "%"
              : "—",
        });
      });
    });

    return rows
      .sort((a, b) => b.wins - a.wins)
      .slice(0, 3);
  }, [registeredTeams, ranking]);

  const activeSessionsCount = liveSessions.length + liveMatches.length;

  return (
    <div className={styles.arenaScreen}>
      <header className={styles.hero}>
        <div>
          <p className={styles.heroBreadcrumb}>
            <span className={styles.heroLine} aria-hidden="true" />
            Hextech Circuit • Season 2025
          </p>
          <h1 className={styles.heroTitle}>Arena Overview</h1>
        </div>

        <div className={styles.heroActions}>
          <div className={styles.heroSessions}>
            <span className={styles.heroPulse} aria-hidden="true" />
            <div>
              <span className={styles.heroSessionsLabel}>Sessões ativas</span>
              <span className={styles.heroSessionsValue}>{activeSessionsCount}</span>
            </div>
          </div>
          <SLButton onClick={() => setAppScreen("match")}>
            <MdAdd size={16} />
            Criar sessão competitiva
          </SLButton>
        </div>
      </header>

      <section className={styles.metaPanel}>
        <header className={styles.panelHead}>
          <h2 className={styles.panelTitle}>
            <MdSportsMartialArts size={16} />
            Campeões mais contestados &amp; fearless meta
          </h2>
          <span className={styles.panelMeta}>Fearless draft — regra ativa</span>
        </header>

        <div className={styles.metaGrid}>
          {metaRows.map((row) => (
            <article key={row.championKey} className={styles.metaCard}>
              <div>
                <h3 className={styles.metaName}>
                  {CHAMPIONS[row.championKey]?.name ?? row.championKey}
                </h3>
                <span className={styles.metaSub}>
                  Contest: {row.presence}% • Ban: {row.banRate}%
                </span>
              </div>
              <div className={styles.metaSide}>
                <span className={styles.metaWinrate}>
                  {row.winRate !== null ? `${row.winRate}% WR` : "—"}
                </span>
                <span className={styles.metaLocks}>
                  {row.bansCount} fearless locks
                </span>
              </div>
            </article>
          ))}
          {metaRows.length === 0 && (
            <p className={styles.emptyRow}>
              Sem drafts registrados ainda — a meta aparece com as partidas
              encerradas.
            </p>
          )}
        </div>
      </section>

      <div className={styles.board}>
        <div className={styles.boardLeft}>
          <section className={styles.liveSection}>
            <header className={styles.liveHead}>
              <h2 className={styles.sectionTitle}>
                <MdSensors size={16} />
                Partidas ao vivo
              </h2>
              <span className={styles.liveBadge}>
                <span className={styles.liveDot} aria-hidden="true" />
                Transmissão em tempo real
              </span>
            </header>

            {liveMatches.map((row) => (
              <article key={row.key} className={styles.liveCard}>
                <header className={styles.liveCardHead}>
                  <span className={styles.liveCardStage}>{row.meta}</span>
                  <span className={styles.liveCardSid}>{row.turnHint}</span>
                </header>
                <div className={styles.liveCardBody}>
                  <div className={styles.liveSide}>
                    <span className={styles.liveTeam}>{row.labelA}</span>
                    <span className={styles.liveScore}>Placar: {row.scoreA}</span>
                  </div>
                  <span className={styles.liveVs}>VS</span>
                  <div className={styles.liveSide}>
                    <span className={styles.liveTeam}>{row.labelB}</span>
                    <span className={styles.liveScore}>Placar: {row.scoreB}</span>
                  </div>
                  <SLButton role="secondary" onClick={() => setAppScreen("competition")}>
                    Assistir draft
                  </SLButton>
                </div>
              </article>
            ))}

            {liveSessions.map((session) => {
              const labelA =
                session.teams?.[TeamKey.TeamA] ?? "Time A";
              const labelB =
                session.teams?.[TeamKey.TeamB] ?? "Time B";
              const picksDone = [
                ...Object.values(session.currentGame.picks[TeamKey.TeamA]),
                ...Object.values(session.currentGame.picks[TeamKey.TeamB]),
              ].filter(Boolean).length;

              return (
                <article key={session.id} className={styles.liveCard}>
                  <header className={styles.liveCardHead}>
                    <span className={styles.liveCardStage}>
                      Série de draft • Bo{session.format}
                    </span>
                    <span className={styles.liveCardSid}>
                      Sala em andamento — turno{" "}
                      {Math.min(session.currentGame.turnIndex + 1, TOTAL_TURNS)}/
                      {TOTAL_TURNS} · {picksDone}/10 picks
                    </span>
                  </header>
                  <div className={styles.liveCardBody}>
                    <div className={styles.liveSide}>
                      <span className={styles.liveTeam}>{labelA}</span>
                      <span className={styles.liveScore}>
                        Placar: {session.games.length}
                      </span>
                    </div>
                    <span className={styles.liveVs}>VS</span>
                    <div className={styles.liveSide}>
                      <span className={styles.liveTeam}>{labelB}</span>
                      <span className={styles.liveScore}>
                        Placar: 0
                      </span>
                    </div>
                    <SLButton role="secondary" onClick={() => openSession(session.id)}>
                      <MdStars size={14} />
                      Assistir draft
                    </SLButton>
                  </div>
                </article>
              );
            })}

            {liveMatches.length === 0 && liveSessions.length === 0 && (
              <p className={styles.emptyRow}>
                Nenhum draft em andamento — abra uma sala pela Competição ou pelo Sorteio.
              </p>
            )}

            <div className={styles.doneStrip}>
              <span className={styles.doneLabel}>
                <MdFormatListNumbered size={13} />
                Drafts encerrados: {doneSessions.length}
              </span>
              <SLButton variant="text" role="secondary" onClick={() => setAppScreen("sessions")}>
                Ver salas
              </SLButton>
            </div>
          </section>

          <section className={styles.scheduledSection}>
            <header className={styles.liveHead}>
              <h2 className={styles.sectionTitle}>
                <MdCalendarMonth size={16} />
                Próximos confrontos marcados
              </h2>
              <span className={styles.sectionMetaLabel}>Horário oficial UTC-3</span>
            </header>

            <ul className={styles.scheduledList}>
              {scheduledMatches.map((row) => (
                <li key={row.key} className={styles.scheduledRow}>
                  <div className={styles.scheduledWhen}>
                    <span className={styles.scheduledDay}>AGENDADO</span>
                  </div>
                  <div>
                    <span className={styles.scheduledTeams}>
                      {row.labelA} vs {row.labelB}
                    </span>
                    <span className={styles.scheduledMeta}>
                      {row.meta} • {row.turnHint}
                    </span>
                  </div>
                  <SLButton variant="text" onClick={() => setAppScreen("competition")}>
                    <MdBolt size={13} />
                    Entrar na fila
                  </SLButton>
                </li>
              ))}
              {scheduledMatches.length === 0 && (
                <li className={styles.emptyRow}>
                  Nenhum confronto aguardando draft na competição ativa.
                </li>
              )}
            </ul>
          </section>
        </div>

        <div className={styles.boardRight}>
          <section className={styles.rankingPanel}>
            <header className={styles.panelHead}>
              <h2 className={styles.panelTitle}>
                <GiTrophy size={16} />
                Ranking de equipes
              </h2>
              <span className={styles.panelMeta}>Circuito pro</span>
            </header>

            <table className={styles.rankingTable}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Equipe</th>
                  <th className={styles.rankingCenter}>W / L</th>
                  <th className={styles.rankingCenter}>Saldo</th>
                  <th className={styles.rankingRight}>Pts</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((row, index) => (
                  <tr key={row.name}>
                    <td className={styles.rankingPos}>{String(index + 1).padStart(2, "0")}</td>
                    <td className={styles.rankingTeam}>{row.name}</td>
                    <td className={styles.rankingCenter}>
                      {row.wins} - {row.losses}
                    </td>
                    <td
                      className={`${styles.rankingCenter} ${
                        row.balance > 0
                          ? styles.rankingPositive
                          : row.balance < 0
                            ? styles.rankingNegative
                            : styles.rankingNeutral
                      }`}
                    >
                      {row.balance > 0 ? `+${row.balance}` : row.balance}
                    </td>
                    <td className={styles.rankingRight}>{row.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {ranking.length === 0 && (
              <p className={styles.emptyRow}>
                Sem competições registradas — o ranking aparece com resultados.
              </p>
            )}
          </section>

          <section className={styles.elitesPanel}>
            <header className={styles.panelHead}>
              <h2 className={styles.panelTitle}>
                <MdStars size={16} />
                Elites da arena (hall da fama)
              </h2>
              <span className={styles.panelMeta}>Modo draft &amp; random</span>
            </header>

            <ul className={styles.elitesList}>
              {elites.map((elite, index) => (
                <li key={`${elite.team}-${elite.name}`} className={styles.eliteRow}>
                  <span
                    className={`${styles.eliteBadge} ${
                      index === 0
                        ? styles.eliteBadgeGold
                        : index === 1
                          ? styles.eliteBadgeCyan
                          : styles.eliteBadgeDim
                    }`}
                  >
                    #{index + 1}
                  </span>
                  <div className={styles.eliteMain}>
                    <span className={styles.eliteName}>{elite.name}</span>
                    <span className={styles.eliteMeta}>
                      {elite.wins} vitórias • {elite.rate} win rate
                    </span>
                  </div>
                  <span className={styles.eliteTeam}>{elite.team}</span>
                </li>
              ))}
              {elites.length === 0 && (
                <li className={styles.emptyRow}>
                  Sem elencos com resultados — cadastre equipes e registre séries.
                </li>
              )}
            </ul>
          </section>
        </div>
      </div>

      <button
        type="button"
        className={styles.fab}
        onClick={() => setAppScreen("match")}
      >
        <MdBolt size={20} />
        <span>Join queue</span>
      </button>
    </div>
  );
};