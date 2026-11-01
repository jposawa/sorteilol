import React from "react";
import { useAtom } from "jotai";

import { TOTAL_TURNS } from "@/constants";
import { saveStorage } from "@/helpers";
import {
  banChampionInGame,
  createEmptyGame,
  movePickInGame,
  setPickInGame,
  skipTurnInGame,
  swapPicksInGame,
} from "@/helpers/draftGame";
import { activeSessionIdAtom, appScreenAtom, sessionsAtom } from "@/state";
import {
  type DraftGame,
  type DraftSession,
  Lane,
  type SessionFormat,
  TeamKey,
} from "@/types";

const SESSIONS_STORAGE_KEY = "sessions";

/**
 * Campeões pickados em partidas anteriores da sessão — o pool fearless,
 * indisponível para pickar a partir do game corrente.
 */
export const getLockedChampionKeys = (session: DraftSession): Set<string> => {
  return new Set(
    session.games.flatMap((game) =>
      Object.values(game.picks).flatMap((sidePicks) =>
        Object.values(sidePicks).filter((key): key is string => Boolean(key)),
      ),
    ),
  );
};

export const useDraftSession = () => {
  const [sessions, setSessions] = useAtom(sessionsAtom);
  const [activeSessionId, setActiveSessionId] = useAtom(activeSessionIdAtom);
  const [appScreen, setAppScreen] = useAtom(appScreenAtom);

  const persistSessions = React.useCallback(
    (nextSessions: DraftSession[]) => {
      saveStorage(SESSIONS_STORAGE_KEY, nextSessions, {
        needParse: true,
        isPersistent: true,
      });
    },
    [],
  );

  const mutateSessions = React.useCallback(
    (updater: (prev: DraftSession[]) => DraftSession[]) => {
      setSessions((prev) => {
        const nextSessions = updater(prev);

        persistSessions(nextSessions);

        return nextSessions;
      });
    },
    [persistSessions, setSessions],
  );

  const activeSession = React.useMemo(() => {
    return (
      sessions.find((session) => session.id === activeSessionId) ?? null
    );
  }, [activeSessionId, sessions]);

  const createSession = React.useCallback(
    (format: SessionFormat) => {
      const session: DraftSession = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        format,
        games: [],
        currentGame: createEmptyGame(),
        status: "active",
      };

      mutateSessions((prev) => [session, ...prev]);
      setActiveSessionId(session.id);
    },
    [mutateSessions, setActiveSessionId],
  );

  /**
   * Cria a sessão JÁ com os picks preenchidos (Randomizer → Sala de Draft).
   * Uma única mutação, para não depender do activeSessionId de um render
   * futuro — os setPick individuais fecham sobre o id anterior e são
   * descartados pelo filtro de sessão ativa.
   */
  const createSessionWithPicks = React.useCallback(
    (
      format: SessionFormat,
      pickList: { side: TeamKey; lane: Lane; championKey: string }[],
      teamNames?: Partial<Record<TeamKey, string>>,
    ) => {
      // Picks embutidos fora da agenda: o draft do Randomizer já vem
      // "completo" (turnIndex final), senão o guard de turno faria os picks
      // serem descartados (cada setPick aceita só o lado do turno corrente).
      const base = createEmptyGame();
      const picks = {
        ...base.picks,
        [TeamKey.TeamA]: { ...base.picks[TeamKey.TeamA] },
        [TeamKey.TeamB]: { ...base.picks[TeamKey.TeamB] },
      };

      pickList.forEach((pick) => {
        picks[pick.side][pick.lane] = pick.championKey;
      });

      const game: DraftGame = {
        ...base,
        picks,
        turnIndex: TOTAL_TURNS,
      };
      const session: DraftSession = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        format,
        ...(teamNames ? { teams: teamNames } : {}),
        games: [],
        currentGame: game,
        status: "active",
      };

      mutateSessions((prev) => [session, ...prev]);
      setActiveSessionId(session.id);
    },
    [mutateSessions, setActiveSessionId],
  );

  const openSession = React.useCallback(
    (sessionId: string) => {
      setActiveSessionId(sessionId);
    },
    [setActiveSessionId],
  );

  const leaveSession = React.useCallback(() => {
    setActiveSessionId(null);
  }, [setActiveSessionId]);

  const deleteSession = React.useCallback(
    (sessionId: string) => {
      mutateSessions((prev) =>
        prev.filter((session) => session.id !== sessionId),
      );
      setActiveSessionId((prev) => (prev === sessionId ? null : prev));
    },
    [mutateSessions, setActiveSessionId],
  );

  const banChampion = React.useCallback(
    (championKey: string) => {
      mutateSessions((prev) =>
        prev.map((session) => {
          if (session.id !== activeSessionId || session.status === "done") {
            return session;
          }

          const lockedKeys = getLockedChampionKeys(session);

          return {
            ...session,
            currentGame: banChampionInGame(
              session.currentGame,
              championKey,
              lockedKeys,
            ),
          };
        }),
      );
    },
    [activeSessionId, mutateSessions],
  );

  const skipBanTurn = React.useCallback(() => {
    mutateSessions((prev) =>
      prev.map((session) => {
        if (session.id !== activeSessionId || session.status === "done") {
          return session;
        }

        return {
          ...session,
          currentGame: skipTurnInGame(session.currentGame),
        };
      }),
    );
  }, [activeSessionId, mutateSessions]);

  const setPick = React.useCallback(
    (side: TeamKey, lane: Lane, championKey: string | null) => {
      mutateSessions((prev) =>
        prev.map((session) => {
          if (session.id !== activeSessionId) {
            return session;
          }

          const lockedKeys = getLockedChampionKeys(session);

          return {
            ...session,
            currentGame: setPickInGame(
              session.currentGame,
              side,
              lane,
              championKey,
              lockedKeys,
            ),
          };
        }),
      );
    },
    [activeSessionId, mutateSessions],
  );

  const finishGame = React.useCallback(
    (winner: TeamKey | null = null) => {
      mutateSessions((prev) =>
        prev.map((session) => {
          if (session.id !== activeSessionId || session.status === "done") {
            return session;
          }

          const games = [...session.games, { ...session.currentGame, winner }];
          const isSeriesDone = games.length >= session.format;

          return {
            ...session,
            games,
            currentGame: isSeriesDone
              ? session.currentGame
              : createEmptyGame(),
            status: isSeriesDone ? "done" : "active",
          };
        }),
      );
    },
    [activeSessionId, mutateSessions],
  );

  /**
   * Move o pick de uma rota para outra vazia do MESMO lado na sessão ativa
   * (só vale na partida em andamento; o destino já ocupado é ignorado).
   */
  const moveSessionPick = React.useCallback(
    (side: TeamKey, fromLane: Lane, toLane: Lane) => {
      mutateSessions((prev) =>
        prev.map((session) => {
          if (session.id !== activeSessionId || session.status === "done") {
            return session;
          }

          return {
            ...session,
            currentGame: movePickInGame(session.currentGame, side, fromLane, toLane),
          };
        }),
      );
    },
    [activeSessionId, mutateSessions],
  );

  /**
   * Troca os picks entre duas rotas do MESMO lado na sessão ativa.
   */
  const swapSessionPicks = React.useCallback(
    (side: TeamKey, fromLane: Lane, toLane: Lane) => {
      mutateSessions((prev) =>
        prev.map((session) => {
          if (session.id !== activeSessionId || session.status === "done") {
            return session;
          }

          return {
            ...session,
            currentGame: swapPicksInGame(session.currentGame, side, fromLane, toLane),
          };
        }),
      );
    },
    [activeSessionId, mutateSessions],
  );

  return {
    appScreen,
    setAppScreen,
    sessions,
    activeSession,
    activeSessionId,
    createSession,
    createSessionWithPicks,
    openSession,
    leaveSession,
    deleteSession,
    banChampion,
    skipBanTurn,
    setPick,
    moveSessionPick,
    swapSessionPicks,
    finishGame,
  };
};