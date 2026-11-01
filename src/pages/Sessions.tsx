import React from "react";

import { SLButton, SLSelect } from "@/components";
import { DraftBoard } from "@/fragments";
import {
  getLockedChampionKeys,
  useDraftSession,
} from "@/hooks";
import { type SessionFormat, TeamKey } from "@/types";

import styles from "./Sessions.module.css";

type SessionFormatOption = {
  value: SessionFormat;
  label: string;
};

const FORMAT_OPTIONS: SessionFormatOption[] = [
  { value: 1, label: "Bo1" },
  { value: 3, label: "Bo3" },
  { value: 5, label: "Bo5" },
];

export const Sessions: React.FC = () => {
  const {
    sessions,
    activeSession,
    setAppScreen,
    createSession,
    openSession,
    leaveSession,
    deleteSession,
    banChampion,
    skipBanTurn,
    setPick,
    moveSessionPick,
    swapSessionPicks,
    finishGame,
  } = useDraftSession();

  const [format, setFormat] = React.useState<SessionFormat>(5);

  const handleFormatChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFormat(Number(event.target.value ?? "5") as SessionFormat);
  };

  if (activeSession) {
    return (
      <DraftBoard
        title={
          activeSession.status === "done"
            ? `Série Bo${activeSession.format} — finalizada`
            : `Série Bo${activeSession.format}`
        }
        subtitle={`Game ${Math.min(activeSession.games.length + 1, activeSession.format)} de ${activeSession.format} · fearless entre os games`}
        sideLabels={activeSession.teams}
        onSwapPicks={(side, fromLane, toLane) =>
          swapSessionPicks(side, fromLane, toLane)
        }
        onMovePick={(side, fromLane, toLane) =>
          moveSessionPick(side, fromLane, toLane)
        }
        score={{
          [TeamKey.TeamA]: activeSession.games.filter(
            (game) => game.winner === TeamKey.TeamA,
          ).length,
          [TeamKey.TeamB]: activeSession.games.filter(
            (game) => game.winner === TeamKey.TeamB,
          ).length,
        }}
        lockedKeys={getLockedChampionKeys(activeSession)}
        draftGame={activeSession.currentGame}
        hasResult={activeSession.status === "done"}
        onLeave={leaveSession}
        onBan={banChampion}
        onSkipTurn={skipBanTurn}
        onPick={setPick}
        onFinish={finishGame}
      />
    );
  }

  return (
    <section className={styles.sessionsScreen}>
      <header className={styles.sessionsHeader}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => setAppScreen("home")}
        >
          ← Início
        </button>

        <h2 className={styles.sessionsTitle}>Sessões de Draft</h2>
      </header>

      <div className={styles.createRow}>
        <SLSelect
          label="Formato da série: "
          value={format}
          onChange={handleFormatChange}
        >
          {FORMAT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SLSelect>

        <SLButton onClick={() => createSession(format)}>Nova sessão</SLButton>
      </div>

      {sessions.length === 0 && (
        <p className={styles.emptyState}>
          Nenhuma sessão ainda. Crie uma série Bo1, Bo3 ou Bo5 e faça o draft
          como em uma partida de LoL — os campeões escolhidos ficam na lista
          fearless para as próximas partidas.
        </p>
      )}

      <div className={styles.sessionList}>
        {sessions.map((session) => (
          <article key={session.id} className={styles.sessionCard}>
            <div className={styles.sessionInfo}>
              <h3 className={styles.sessionTitle}>Série Bo{session.format}</h3>

              <span className={styles.sessionTeams}>
                {session.teams?.[TeamKey.TeamA] ?? "Time A"} vs{" "}
                {session.teams?.[TeamKey.TeamB] ?? "Time B"}
              </span>

              <span className={styles.sessionMeta}>
                {new Date(session.createdAt).toLocaleString("pt-BR")}
              </span>

              <span className={styles.sessionStatus}>
                {session.status === "active"
                  ? `Game ${Math.min(session.games.length + 1, session.format)} de ${session.format} em andamento`
                  : `Finalizada · ${session.games.length} games`}
              </span>
            </div>

            <div className={styles.sessionActions}>
              <SLButton variant="text" onClick={() => openSession(session.id)}>
                Abrir
              </SLButton>

              <SLButton
                variant="text"
                role="danger"
                onClick={() => deleteSession(session.id)}
              >
                Excluir
              </SLButton>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};