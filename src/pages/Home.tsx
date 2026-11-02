import React from "react";
import {
  MdArrowForward,
  MdCasino,
  MdEmojiEvents,
  MdGavel,
  MdWorkspacePremium,
} from "react-icons/md";
import { useAtom } from "jotai";

import { CHAMPIONS } from "@/constants";
import { getChampionPortraitUrl } from "@/helpers";
import { getChampionUsageStats } from "@/helpers/draftGame";
import {
  useCompetition,
  useDraftSession,
  useRegisteredTeams,
} from "@/hooks";
import { sessionsAtom } from "@/state";
import { useBackendCompetitions } from "@/stores/remoteTables";
import {
  type Competition,
  type DraftGame,
  type DraftSession,
  TeamKey,
} from "@/types";

import styles from "./Home.module.css";

/** Logs de sistema temáticos (voz do Proto-Core). */
const PROTO_LOGS = [
  {
    time: "14:02",
    text: "Dados do núcleo: Patch 14.12 integrado aos módulos de draft.",
  },
  {
    time: "11:45",
    text: "Constantes de escala recalibradas em todos os módulos.",
  },
  {
    time: "09:12",
    text: 'Torneio comunitário: "Hextech Open" começa em 48 horas.',
  },
] as const;

type CompetitionStatusChip = "active" | "registration" | "done";

const STATUS_CHIPS: Record<CompetitionStatusChip, string> = {
  active: "EM ANDAMENTO",
  registration: "EM INSCRIÇÃO",
  done: "ENCERRADO",
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const picksOfSide = (game: DraftGame, side: TeamKey): string[] => {
  return Object.values(game.picks[side]).filter(
    (key): key is string => Boolean(key),
  );
};

const winsOfSide = (session: DraftSession, side: TeamKey): number => {
  return session.games.filter((game) => game.winner === side).length;
};

/**
 * Jogo em destaque da sessão: último jogo concluído; se a série está em
 * aberto, o último jogo jogado (para reter os picks); fallback no jogo
 * corrente.
 */
const featuredGameOf = (session: DraftSession): DraftGame => {
  const completed = session.games.filter((game) => game.winner !== null);
  return (
    completed[completed.length - 1] ??
    session.games[session.games.length - 1] ??
    session.currentGame
  );
};

const portraitKeysOfSession = (session: DraftSession): string[] => {
  const game = featuredGameOf(session);
  const teamAPicks = picksOfSide(game, TeamKey.TeamA);
  const teamBPicks = picksOfSide(game, TeamKey.TeamB);
  const side: TeamKey =
    game.winner ??
    (teamBPicks.length > teamAPicks.length ? TeamKey.TeamB : TeamKey.TeamA);

  return picksOfSide(game, side);
};

type SessionRow = {
  id: string;
  title: string;
  meta: string;
  badge: string;
  badgeVariant: "primary" | "secondary" | "muted";
  portraits: string[];
};

const sessionRowOf = (session: DraftSession): SessionRow => {
  const winsA = winsOfSide(session, TeamKey.TeamA);
  const winsB = winsOfSide(session, TeamKey.TeamB);
  const total = session.games.length;
  const seriesDecided = session.status === "done" && winsA !== winsB;

  let badge: string;
  let badgeVariant: SessionRow["badgeVariant"];
  let meta: string;

  if (session.games.length === 0) {
    badge = "EM ANDAMENTO";
    badgeVariant = "muted";
    meta = `Série em preparação • melhor de ${session.format}`;
  } else if (seriesDecided) {
    const blueWins = winsA > winsB;
    badge = `${blueWins ? "Azul" : "Vermelho"} ${Math.max(winsA, winsB)}–${Math.min(winsA, winsB)}`;
    badgeVariant = blueWins ? "primary" : "secondary";
    meta = `Série ${Math.max(winsA, winsB)}–${Math.min(winsA, winsB)} • ${total} partida(s)`;
  } else if (winsA === 0 && winsB === 0) {
    badge = "SEM RESULTADO";
    badgeVariant = "muted";
    meta = `${total} partida(s) • resultado não marcado`;
  } else {
    badge = "EM ANDAMENTO";
    badgeVariant = "muted";
    meta = `Série ${winsA}–${winsB} • melhor de ${session.format}`;
  }

  return {
    id: session.id,
    title: `Draft ${dateFormatter.format(session.createdAt)}`,
    meta,
    badge,
    badgeVariant,
    portraits: portraitKeysOfSession(session),
  };
};

type ChampionSpotlight = {
  key: string;
  picks: number;
  winRate: number | null;
};

/** Campeão mais pickado entre todos os drafts salvos do app. */
const championSpotlightOf = (
  competitions: Competition[],
  sessions: DraftSession[],
): ChampionSpotlight | null => {
  const games: DraftGame[] = [
    ...competitions.flatMap((competition) =>
      competition.matches
        .map((match) => match.draftState)
        .filter((game): game is DraftGame => Boolean(game)),
    ),
    ...sessions.flatMap((session) => [session.currentGame, ...session.games]),
  ];

  const stats = getChampionUsageStats(games);
  const top = [...stats.entries()].sort((a, b) => b[1].picks - a[1].picks)[0];

  if (!top) {
    return null;
  }

  const [key, usage] = top;

  return {
    key,
    picks: usage.picks,
    winRate:
      usage.picks > 0
        ? Math.round(((usage.wins / usage.picks) * 100) * 10) / 10
        : null,
  };
};

const statusChipOf = (
  competition: Competition,
): { text: string; variant: CompetitionStatusChip } => {
  // Encerrada = todas as séries já resolvidas (status "done" derivado).
  const resolved =
    competition.matches.length > 0 &&
    competition.matches.every((match) => match.winner !== null);

  if (resolved) {
    return { text: STATUS_CHIPS.done, variant: "done" };
  }

  if (competition.status === "active") {
    return { text: STATUS_CHIPS.active, variant: "active" };
  }

  return { text: STATUS_CHIPS.registration, variant: "registration" };
};

const currentRoundOf = (competition: Competition): string => {
  const rounds = competition.matches.map((match) => match.round);

  if (rounds.length === 0) {
    return "Chave não iniciada";
  }

  const live = rounds.filter(
    (round) =>
      !competition.matches
        .filter((match) => match.round === round)
        .every((match) => match.winner !== null),
  );

  const round = live.length > 0 ? live[0] : Math.max(...rounds);

  return `Rodada ${round} • ${competition.teams.length} equipes concorrentes`;
};

export const Home: React.FC = () => {
  const [sessions] = useAtom(sessionsAtom);
  const { teams } = useRegisteredTeams();
  const { competitions, openCompetition } = useCompetition();
  const { setAppScreen } = useDraftSession();
  const backendStatus = useBackendCompetitions((state) => state.status);

  const recentSessions = React.useMemo(
    () =>
      [...sessions]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 4)
        .map(sessionRowOf),
    [sessions],
  );

  const spotlight = React.useMemo(
    () => championSpotlightOf(competitions, sessions),
    [competitions, sessions],
  );

  const monitoredCompetitions = React.useMemo(
    () =>
      [...competitions]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 3),
    [competitions],
  );

  return (
    <section className={styles.home}>
      <div className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.heroTags}>
            <span className={styles.heroBadge}>Core Protocol v.2.04</span>
            <span className={styles.heroOnline}>
              <span className={styles.heroDot} aria-hidden="true" />
              {backendStatus === "ready" ? "Núcleo conectado" : "Núcleo offline"}
            </span>
          </div>

          <h1 className={styles.heroTitle}>
            Protocolo Hextech:{" "}
            <span className={styles.heroAccent}>painel competitivo</span>
          </h1>

          <p className={styles.heroSubtitle}>
            Central tática de League of Legends • fearless draft &amp;
            análise de torneios
          </p>
        </div>

        <div className={styles.heroActions}>
          <button
            type="button"
            className={styles.heroCta}
            onClick={() => setAppScreen("sessions")}
          >
            <MdGavel size={18} aria-hidden="true" />
            <span>
              Novo draft
              <em>fearless</em>
            </span>
          </button>

          <button
            type="button"
            className={`${styles.heroCta} ${styles.heroCtaSecondary}`}
            onClick={() => setAppScreen("match")}
          >
            <MdCasino size={18} aria-hidden="true" />
            <span>
              Sorteio
              <em>rápido</em>
            </span>
          </button>
        </div>
      </div>

      <div className={styles.monitorGrid}>
        <article className={styles.monitorCard}>
          <header className={styles.monitorHead}>
            <div className={styles.monitorHeadInfo}>
              <h2 className={styles.monitorTitle}>
                Campeonatos ativos &amp; passados
              </h2>
              <p className={styles.monitorMeta}>
                Circuito oficial SorteioLoL
              </p>
            </div>

            <span className={styles.monitorBadge}>
              {competitions.length} eventos em monitoramento
            </span>
          </header>

          {monitoredCompetitions.length === 0 ? (
            <p className={styles.monitorEmpty}>
              Nenhum campeonato registrado — crie o primeiro Competição.
            </p>
          ) : (
            <div className={styles.compList}>
              {monitoredCompetitions.map((competition) => {
                const chip = statusChipOf(competition);

                return (
                  <div key={competition.id} className={styles.compRow}>
                    <div className={styles.compInfo}>
                      <div className={styles.compStatusRow}>
                        <span className={`${styles.compStatus} ${styles[`compStatus${chip.variant.charAt(0).toUpperCase() + chip.variant.slice(1)}`]}`}>
                          {chip.text}
                        </span>
                        <span className={styles.compFormat}>
                          formato suiço •{" "}
                          {competition.draftFormat === "fearless"
                            ? "fearless draft"
                            : "draft padrão"}
                        </span>
                      </div>

                      <h3 className={styles.compTitle}>{competition.name}</h3>
                      <p className={styles.compMeta}>
                        {currentRoundOf(competition)}
                      </p>
                    </div>

                    <button
                      type="button"
                      className={styles.compAction}
                      onClick={() => openCompetition(competition.id)}
                    >
                      Ver chave
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </article>

        <article className={styles.championCard}>
          <header className={styles.championHead}>
            <span className={styles.championBadge}>Campeões do torneio</span>
            <MdWorkspacePremium size={18} aria-hidden="true" />
          </header>

          {spotlight ? (
            <div className={styles.championMain}>
              <div className={styles.championPortrait}>
                <img
                  src={getChampionPortraitUrl(spotlight.key)}
                  alt={CHAMPIONS[spotlight.key]?.name ?? spotlight.key}
                  loading="lazy"
                />
              </div>

              <div className={styles.championInfo}>
                <span className={styles.championLabel}>Mais pickado</span>
                <h3 className={styles.championName}>
                  {CHAMPIONS[spotlight.key]?.name ?? spotlight.key}
                </h3>
              </div>
            </div>
          ) : (
            <p className={styles.championEmpty}>
              Nenhum draft registrado ainda — o destaque aparece com partidas
              concluídas.
            </p>
          )}

          {spotlight && (
            <ul className={styles.championMetrics}>
              <li className={styles.championMetric}>
                <span className={styles.championMetricLabel}>Picks no circuito</span>
                <strong className={styles.championMetricValue}>
                  {spotlight.picks}
                </strong>
              </li>
              <li className={styles.championMetric}>
                <span className={styles.championMetricLabel}>Taxa de vitória</span>
                <strong
                  className={`${styles.championMetricValue} ${styles.championMetricValueGold}`}
                >
                  {spotlight.winRate === null
                    ? "—"
                    : `${spotlight.winRate}%`}
                </strong>
              </li>
            </ul>
          )}

          <button
            type="button"
            className={styles.championCta}
            onClick={() => setAppScreen("arena")}
          >
            <MdEmojiEvents size={16} aria-hidden="true" />
            Galeria de troféus
          </button>
        </article>
      </div>

      <div className={styles.bentoRowDrafts}>
        <article className={styles.draftsCard}>
          <div className={styles.draftsHead}>
            <h2 className={styles.draftsTitle}>Drafts recentes &amp; simulações</h2>
            <span className={styles.draftsMeta}>
              Tempo real • sessões do núcleo
            </span>
          </div>

          {recentSessions.length === 0 ? (
            <p className={styles.draftsEmpty}>
              Nenhuma sessão de draft registrada ainda. Abra a Sala de Draft
              para começar.
            </p>
          ) : (
            <div className={styles.draftRows}>
              {recentSessions.map((row) => (
                <div
                  key={row.id}
                  className={styles.draftRow}
                  onClick={() => setAppScreen("sessions")}
                >
                  <div className={styles.draftPortraits}>
                    {(row.portraits.length > 0
                      ? row.portraits
                      : [null]
                    )
                      .slice(0, 5)
                      .map((championKey, index) => (
                        <div key={`${row.id}-${index}`} className={styles.draftPortrait}>
                          {championKey && (
                            <img
                              src={getChampionPortraitUrl(championKey)}
                              alt={
                                CHAMPIONS[championKey]?.name ?? championKey
                              }
                              loading="lazy"
                            />
                          )}
                        </div>
                      ))}
                  </div>

                  <div className={styles.draftInfo}>
                    <h4 className={styles.draftTitle}>
                      {row.title}
                      <span className={styles.draftTitleArrow} aria-hidden="true">
                        <MdArrowForward size={13} />
                      </span>
                    </h4>
                    <p className={styles.draftMeta}>{row.meta}</p>
                  </div>

                  <span
                    className={`${styles.draftBadge} ${styles[`draftBadge${row.badgeVariant === "primary" ? "Primary" : row.badgeVariant === "secondary" ? "Secondary" : "Muted"}`]}`}
                  >
                    {row.badge}
                  </span>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className={styles.logsCard}>
          <div className={styles.logsHead}>
            <span className={styles.logsHeadLabel}>Proto-logs &amp; meta</span>
            <span className={styles.logsPulse} aria-hidden="true" />
          </div>

          <ul className={styles.logList}>
            {PROTO_LOGS.map((log) => (
              <li key={log.time} className={styles.logItem}>
                <span className={styles.logTime}>{log.time}</span>
                <span className={styles.logText}>{log.text}</span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            className={styles.logsButton}
            onClick={() => setAppScreen("sessions")}
          >
            Expandir logs do servidor
          </button>
        </article>
      </div>

      <div className={styles.statsBar}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Status do núcleo</span>
          <span className={`${styles.statValue} ${styles.statValuePrimary}`}>
            {backendStatus === "ready" ? "Conectado & sincronizado" : "Offline"}
          </span>
        </div>

        <div className={styles.statItem}>
          <span className={styles.statLabel}>Times registrados</span>
          <span className={styles.statValue}>{teams.length} equipes</span>
        </div>

        <div className={styles.statItem}>
          <span className={styles.statLabel}>Drafts registrados</span>
          <span className={styles.statValue}>{sessions.length}</span>
        </div>

        <div className={`${styles.statItem} ${styles.statItemFirmware}`}>
          <span className={styles.statLabel}>Versão de protocolo</span>
          <span className={`${styles.statValue} ${styles.statValueSecondary}`}>
            v.2.04 archive
          </span>
        </div>
      </div>
    </section>
  );
};