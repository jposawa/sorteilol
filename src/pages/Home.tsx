import React from "react";
import { MdArrowForward, MdCasino, MdGavel } from "react-icons/md";
import { useAtom } from "jotai";

import { CHAMPIONS } from "@/constants";
import { getChampionPortraitUrl } from "@/helpers";
import { useDraftSession, useRegisteredTeams } from "@/hooks";
import { sessionsAtom } from "@/state";
import {
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

export const Home: React.FC = () => {
  const [sessions] = useAtom(sessionsAtom);
  const { teams } = useRegisteredTeams();
  const { setAppScreen } = useDraftSession();

  const recentSessions = React.useMemo(
    () =>
      [...sessions]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 4)
        .map(sessionRowOf),
    [sessions],
  );

  return (
    <section className={styles.home}>
      <div className={styles.hero}>
        <h1 className={styles.heroTitle}>
          Status do sistema: <span className={styles.heroStatus}>Operacional</span>
        </h1>

        <p className={styles.heroSubtitle}>
          Bem-vindo de volta, invocador. O Proto-Core v.2.04 está sincronizado.
        </p>
      </div>

      <div className={styles.bentoRowQuick}>
        <article
          className={styles.quickCard}
          onClick={() => setAppScreen("match")}
        >
          <div className={styles.quickCardIcon}>
            <MdCasino size={96} aria-hidden="true" />
          </div>

          <h3 className={styles.quickCardTitle}>Randomizador</h3>
          <p className={styles.quickCardDesc}>
            Deixe o núcleo Hextech decidir o seu destino. Geração completa de
            times com restrições táticas.
          </p>

          <span className={styles.quickCardCta}>
            Iniciar sorteio <MdArrowForward size={16} aria-hidden="true" />
          </span>
        </article>

        <article
          className={`${styles.quickCard} ${styles.quickCardSecondary}`}
          onClick={() => setAppScreen("sessions")}
        >
          <div className={styles.quickCardIcon}>
            <MdGavel size={96} aria-hidden="true" />
          </div>

          <h3 className={styles.quickCardTitle}>Sala de Draft</h3>
          <p className={styles.quickCardDesc}>
            Entre na arena competitiva. Simulação de drafting em tempo real com
            regra fearless.
          </p>

          <span className={styles.quickCardCta}>
            Entrar no draft <MdArrowForward size={16} aria-hidden="true" />
          </span>
        </article>

        <article className={styles.logsCard}>
          <div className={styles.logsHead}>
            <span className={styles.logsHeadLabel}>Proto-logs</span>
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
            Ver todos os logs
          </button>
        </article>
      </div>

      <div className={styles.bentoRowDrafts}>
        <article className={styles.draftsCard}>
          <div className={styles.draftsHead}>
            <h2 className={styles.draftsTitle}>Drafts recentes</h2>
            <span className={styles.draftsMeta}>Últimas sessões</span>
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
                    <h4 className={styles.draftTitle}>{row.title}</h4>
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

        <article className={styles.eventCard}>
          <img
            className={styles.eventBg}
            src={getChampionPortraitUrl("jhin")}
            alt=""
            aria-hidden="true"
            loading="lazy"
          />
          <div className={styles.eventBgShade} aria-hidden="true" />

          <div className={styles.eventContent}>
            <span className={styles.eventBadge}>Competição suíça</span>

            <h3 className={styles.eventTitle}>Torneio Hextech Open</h3>
            <p className={styles.eventDesc}>
              Registre sua equipe e dispute no formato suiço: 3 vitórias
              avançam, 3 derrotas eliminam. Prêmio: 50.000 Núcleos Hextech.
            </p>

            <button
              type="button"
              className={styles.eventCta}
              onClick={() => setAppScreen("competition")}
            >
              Criar agora
            </button>
          </div>
        </article>
      </div>

      <div className={styles.statsBar}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Status de sync</span>
          <span className={`${styles.statValue} ${styles.statValuePrimary}`}>
            100% seguro
          </span>
        </div>

        <div className={styles.statItem}>
          <span className={styles.statLabel}>Times registrados</span>
          <span className={styles.statValue}>{teams.length}</span>
        </div>

        <div className={styles.statItem}>
          <span className={styles.statLabel}>Drafts registrados</span>
          <span className={styles.statValue}>{sessions.length}</span>
        </div>

        <div className={`${styles.statItem} ${styles.statItemFirmware}`}>
          <span className={styles.statLabel}>Firmware</span>
          <span className={`${styles.statValue} ${styles.statValueSecondary}`}>
            v.2.04 archive
          </span>
        </div>
      </div>
    </section>
  );
};