import React from "react";
import { useAtom } from "jotai";

import {
  ADVANCE_WINS,
  ELIMINATION_LOSSES,
  NULL_OPPONENT_SEED,
  seriesLengthForRound,
} from "@/constants";
import { saveStorage, secureShuffle } from "@/helpers";
import {
  banChampionInGame,
  createEmptyGame,
  movePickInGame,
  setPickInGame,
  skipTurnInGame,
  swapPicksInGame,
} from "@/helpers/draftGame";
import {
  activeCompetitionIdAtom,
  appScreenAtom,
  competitionsAtom,
} from "@/state";
import {
  type Competition,
  type CompetitionMatch,
  type CompetitionTeam,
  type DraftFormat,
  type DraftGame,
  Lane,
  type MatchWinner,
  type RegisteredTeam,
  TeamKey,
} from "@/types";

const COMPETITIONS_STORAGE_KEY = "competitions";

export type TeamStandingStatus = "active" | "advanced" | "eliminated";

export type TeamStanding = {
  team: CompetitionTeam;
  wins: number;
  losses: number;
  playedAgainst: number[];
  buchholz: number;
  status: TeamStandingStatus;
};

const pairKey = (seedA: number, seedB: number) => {
  return seedA < seedB ? `${seedA}-${seedB}` : `${seedB}-${seedA}`;
};

/** Identidade de um match dentro da competição. */
export const matchRefKey = (match: CompetitionMatch) =>
  `${match.round}:${match.seedA}:${match.seedB}`;

/**
 * Records e status derivam de `matches` (1 clique / 1 draft encerrado = 1 série,
 * como nos standings do suíço da Riot). Buchholz = soma das séries vencidas
 * pelos adversários enfrentados (força de agenda, tiebreak suíço).
 */
export const getStandings = (competition: Competition): TeamStanding[] => {
  const bySeed = new Map<number, TeamStanding>(
    competition.teams.map((team) => [
      team.seed,
      {
        team,
        wins: 0,
        losses: 0,
        playedAgainst: [],
        buchholz: 0,
        status: "active" as TeamStandingStatus,
      },
    ]),
  );

  competition.matches.forEach((match) => {
    if (!match.winner) {
      return;
    }

    const standingA = bySeed.get(match.seedA);

    if (!standingA) {
      return;
    }

    // bye: vitória administrativa, sem impacto na força de agenda
    if (match.seedB === NULL_OPPONENT_SEED) {
      standingA.wins += 1;
      return;
    }

    const standingB = bySeed.get(match.seedB);

    if (!standingB) {
      return;
    }

    if (match.winner === "seedA") {
      standingA.wins += 1;
      standingB.losses += 1;
    } else {
      standingB.wins += 1;
      standingA.losses += 1;
    }

    standingA.playedAgainst.push(match.seedB);
    standingB.playedAgainst.push(match.seedA);
  });

  for (const standing of bySeed.values()) {
    standing.buchholz = standing.playedAgainst.reduce(
      (sum, seed) => sum + (bySeed.get(seed)?.wins ?? 0),
      0,
    );

    standing.status =
      standing.wins >= ADVANCE_WINS
        ? "advanced"
        : standing.losses >= ELIMINATION_LOSSES
          ? "eliminated"
          : "active";
  }

  return [...bySeed.values()];
};

export const isCompetitionResolved = (competition: Competition): boolean => {
  return getStandings(competition).every(
    (standing) => standing.status !== "active",
  );
};

const RANKED_STATUSES: TeamStanding["status"][] = [
  "advanced",
  "active",
  "eliminated",
];

/** Ranking final/in-progress: avançados primeiro, W desc, L asc,
 * força de agenda desc, seed asc. O [0] é o campeão. */
export const getRanking = (competition: Competition): TeamStanding[] => {
  return [...getStandings(competition)].sort(
    (a, b) =>
      RANKED_STATUSES.indexOf(a.status) - RANKED_STATUSES.indexOf(b.status) ||
      b.wins - a.wins ||
      a.losses - b.losses ||
      b.buchholz - a.buchholz ||
      a.team.seed - b.team.seed,
  );
};

/** Suíço padrão: mesmo record, top-half vs bottom-half, evitando reencontro. */
const pairGroupBySeed = (
  group: CompetitionTeam[],
  played: Set<string>,
): [CompetitionTeam, CompetitionTeam][] => {
  const half = group.length / 2;
  const top = group.slice(0, half);
  const bottom = group.slice(half);

  const usedBottomSeeds = new Set<number>();
  const pairs: [CompetitionTeam, CompetitionTeam][] = [];

  for (const teamA of top) {
    let teamB = bottom.find(
      (candidate) =>
        !usedBottomSeeds.has(candidate.seed) &&
        !played.has(pairKey(teamA.seed, candidate.seed)),
    );

    if (!teamB) {
      teamB = bottom.find(
        (candidate) => !usedBottomSeeds.has(candidate.seed),
      );
    }

    if (!teamB) {
      continue;
    }

    usedBottomSeeds.add(teamB.seed);
    pairs.push([teamA, teamB]);
  }

  return pairs;
};

/**
 * Pareamento da rodada: agrupa times ativos por record (série W-L), pareia
 * top vs bottom dentro do grupo e evita reencontros. Grupo ímpar: o pior seed
 * desce para o próximo grupo ("pairing down"); se ainda sobrar um sem par no
 * último grupo, recebe bye (vitória administrativa, pontua automaticamente).
 */
export const buildRoundPairings = (
  competition: Competition,
  round: number,
): CompetitionMatch[] => {
  const standings = getStandings(competition);
  const actives = standings.filter(
    (standing) => standing.status === "active",
  );

  const groups = new Map<string, CompetitionTeam[]>();

  for (const standing of actives) {
    const recordKey = `${standing.wins}-${standing.losses}`;

    groups.set(recordKey, [...(groups.get(recordKey) ?? []), standing.team]);
  }

  const orderedRecordKeys = [...groups.keys()].sort((keyA, keyB) => {
    const [winsA, lossesA] = keyA.split("-").map(Number);
    const [winsB, lossesB] = keyB.split("-").map(Number);

    return winsB - winsA || lossesA - lossesB;
  });

  const playedPairs = new Set(
    competition.matches
      .filter((match) => match.winner)
      .map((match) => pairKey(match.seedA, match.seedB)),
  );

  let carry: CompetitionTeam | null = null;
  const pairs: [CompetitionTeam, CompetitionTeam][] = [];

  for (const recordKey of orderedRecordKeys) {
    const group = [...(groups.get(recordKey) ?? [])];

    if (carry) {
      group.unshift(carry);
      carry = null;
    }

    if (group.length % 2 === 1) {
      carry = group.pop() ?? null;
    }

    pairs.push(...pairGroupBySeed(group, playedPairs));
  }

  const matches: CompetitionMatch[] = pairs.map(([teamA, teamB]) => ({
    round,
    seedA: teamA.seed,
    seedB: teamB.seed,
    winner: null,
    seriesLength: seriesLengthForRound(round),
    draftFormat: competition.draftFormat,
    draftState: null,
  }));

  if (carry) {
    matches.push({
      round,
      seedA: carry.seed,
      seedB: NULL_OPPONENT_SEED,
      winner: "seedA",
      seriesLength: 1,
      draftFormat: competition.draftFormat,
      draftState: null,
    });
  }

  return matches;
};

/**
 * Rodada 1: pareamento aleatório com fonte criptográfica do app; número
 * ímpar de times: o último sorteado recebe bye (pré-marcado como vitória
 * administrativa, sem clique).
 */
const buildFirstRoundPairings = (
  teams: CompetitionTeam[],
  draftFormat: DraftFormat,
): CompetitionMatch[] => {
  const shuffled = secureShuffle(teams);
  const matches: CompetitionMatch[] = [];

  for (let index = 0; index + 1 < shuffled.length; index += 2) {
    matches.push({
      round: 1,
      seedA: shuffled[index].seed,
      seedB: shuffled[index + 1].seed,
      winner: null,
      seriesLength: seriesLengthForRound(1),
      draftFormat,
      draftState: null,
    });
  }

  if (shuffled.length % 2 === 1) {
    matches.push({
      round: 1,
      seedA: shuffled[shuffled.length - 1].seed,
      seedB: NULL_OPPONENT_SEED,
      winner: "seedA",
      seriesLength: 1,
      draftFormat,
      draftState: null,
    });
  }

  return matches;
};

/**
 * Pool fearless ENTRE as partidas da competição: picks de drafts de partidas
 * anteriores ficam bloqueados quando a competição é fearless.
 */
export const getCompetitionLockedKeys = (
  competition: Competition,
  matchKey: string,
): Set<string> => {
  const targetMatch = competition.matches.find(
    (match) => matchRefKey(match) === matchKey,
  );

  if (!targetMatch || targetMatch.draftFormat !== "fearless") {
    return new Set<string>();
  }

  return new Set(
    competition.matches
      .filter(
        (match) =>
          matchRefKey(match) !== matchKey &&
          match.round < targetMatch.round &&
          match.draftState,
      )
      .flatMap((match) =>
        Object.values(match.draftState!.picks).flatMap((sidePicks) =>
          Object.values(sidePicks).filter((key): key is string =>
            Boolean(key),
          ),
        ),
      ),
  );
};

export const useCompetition = () => {
  const [competitions, setCompetitions] = useAtom(competitionsAtom);
  const [activeCompetitionId, setActiveCompetitionId] = useAtom(
    activeCompetitionIdAtom,
  );
  const [appScreen, setAppScreen] = useAtom(appScreenAtom);

  const persistCompetitions = React.useCallback(
    (nextCompetitions: Competition[]) => {
      saveStorage(COMPETITIONS_STORAGE_KEY, nextCompetitions, {
        needParse: true,
        isPersistent: true,
      });
    },
    [],
  );

  const mutateCompetitions = React.useCallback(
    (updater: (prev: Competition[]) => Competition[]) => {
      setCompetitions((prev) => {
        const nextCompetitions = updater(prev);

        persistCompetitions(nextCompetitions);

        return nextCompetitions;
      });
    },
    [persistCompetitions, setCompetitions],
  );

  const activeCompetition = React.useMemo(() => {
    return (
      competitions.find(
        (competition) => competition.id === activeCompetitionId,
      ) ?? null
    );
  }, [activeCompetitionId, competitions]);

  /**
   * Registra a competição: os times vêm das EQUIPES já registradas
   * (nome + elenco snapshotado no momento da inscrição).
   */
  const createCompetition = React.useCallback(
    (
      name: string,
      draftFormat: DraftFormat,
      participatingTeams: RegisteredTeam[],
    ) => {
      const teams: CompetitionTeam[] = participatingTeams.map(
        (equipe, index) => ({
          seed: index + 1,
          teamId: equipe.id,
          name: equipe.name,
          players: [...equipe.players],
        }),
      );

      const competition: Competition = {
        id: crypto.randomUUID(),
        name: name.trim() || "Competição suiça",
        draftFormat,
        createdAt: Date.now(),
        status: "active",
        teams,
        matches: buildFirstRoundPairings(teams, draftFormat),
      };

      mutateCompetitions((prev) => [competition, ...prev]);
      setActiveCompetitionId(competition.id);
    },
    [mutateCompetitions, setActiveCompetitionId],
  );

  const openCompetition = React.useCallback(
    (competitionId: string) => {
      setActiveCompetitionId(competitionId);
    },
    [setActiveCompetitionId],
  );

  const leaveCompetition = React.useCallback(() => {
    setActiveCompetitionId(null);
  }, [setActiveCompetitionId]);

  const deleteCompetition = React.useCallback(
    (competitionId: string) => {
      mutateCompetitions((prev) =>
        prev.filter((competition) => competition.id !== competitionId),
      );
      setActiveCompetitionId((prev) =>
        prev === competitionId ? null : prev,
      );
    },
    [mutateCompetitions, setActiveCompetitionId],
  );

  /** Marca o vencedor direto (sem draft) — desfaz ao clicar no lado já marcado. */
  const reportWinner = React.useCallback(
    (match: CompetitionMatch, winner: MatchWinner) => {
      mutateCompetitions((prev) =>
        prev.map((competition) => {
          if (competition.id !== activeCompetitionId) {
            return competition;
          }

          return {
            ...competition,
            matches: competition.matches.map((candidate) =>
              matchRefKey(candidate) === matchRefKey(match)
                ? { ...candidate, winner: candidate.winner === winner ? null : winner }
                : candidate,
            ),
          };
        }),
      );
    },
    [activeCompetitionId, mutateCompetitions],
  );

  const updateMatchDraft = React.useCallback(
    (matchKey: string, updater: (game: DraftGame) => DraftGame) => {
      mutateCompetitions((prev) =>
        prev.map((competition) => {
          if (competition.id !== activeCompetitionId || competition.matches.every(
            (match) => matchRefKey(match) !== matchKey || match.winner,
          )) {
            return competition;
          }

          return {
            ...competition,
            matches: competition.matches.map((match) =>
              matchRefKey(match) === matchKey
                ? {
                    ...match,
                    draftState: updater(match.draftState ?? createEmptyGame()),
                  }
                : match,
            ),
          };
        }),
      );
    },
    [activeCompetitionId, mutateCompetitions],
  );

  /**
   * Troca os champions entre duas rotas do mesmo lado no draft da partida
   * (ajuste pós-pick: o jogador realoca os campeões entre slots).
   */
  const swapMatchPicks = React.useCallback(
    (_matchKey: string, side: TeamKey, fromLane: Lane, toLane: Lane) => {
      updateMatchDraft(_matchKey, (game) =>
        swapPicksInGame(game, side, fromLane, toLane),
      );
    },
    [updateMatchDraft],
  );

  const moveMatchPick = React.useCallback(
    (_matchKey: string, side: TeamKey, fromLane: Lane, toLane: Lane) => {
      updateMatchDraft(_matchKey, (game) =>
        movePickInGame(game, side, fromLane, toLane),
      );
    },
    [updateMatchDraft],
  );

  /** Encerra o draft da partida e define o resultado da série. */
  const finishMatch = React.useCallback(
    (matchKey: string, winner: TeamKey | null) => {
      mutateCompetitions((prev) =>
        prev.map((competition) => {
          if (competition.id !== activeCompetitionId) {
            return competition;
          }

          return {
            ...competition,
            matches: competition.matches.map((match) =>
              matchRefKey(match) === matchKey
                ? {
                    ...match,
                    winner:
                      winner === TeamKey.TeamA
                        ? ("seedA" as MatchWinner)
                        : winner === TeamKey.TeamB
                          ? ("seedB" as MatchWinner)
                          : null,
                  }
                : match,
            ),
          };
        }),
      );
    },
    [activeCompetitionId, mutateCompetitions],
  );

  /** Ban no turno corrente do draft da partida (auto-cria o draftState). */
  const banMatchChampion = React.useCallback(
    (matchKey: string, championKey: string, lockedKeys: Set<string>) => {
      updateMatchDraft(matchKey, (game) =>
        banChampionInGame(game, championKey, lockedKeys),
      );
    },
    [updateMatchDraft],
  );

  /** Pula a vez na fase de bans do draft da partida. */
  const skipMatchTurn = React.useCallback(
    (matchKey: string) => {
      updateMatchDraft(matchKey, (game) => skipTurnInGame(game));
    },
    [updateMatchDraft],
  );

  /** Preenche/limpa um slot de pick do draft da partida. */
  const setMatchPick = React.useCallback(
    (
      matchKey: string,
      side: TeamKey,
      lane: Lane,
      championKey: string | null,
      lockedKeys: Set<string>,
    ) => {
      updateMatchDraft(matchKey, (game) =>
        setPickInGame(game, side, lane, championKey, lockedKeys),
      );
    },
    [updateMatchDraft],
  );

  const nextRoundNumber = React.useMemo(() => {
    if (!activeCompetition) {
      return 1;
    }

    return (
      Math.max(0, ...activeCompetition.matches.map((match) => match.round)) + 1
    );
  }, [activeCompetition]);

  const canGenerateNextRound = React.useMemo(() => {
    if (!activeCompetition || isCompetitionResolved(activeCompetition)) {
      return false;
    }

    return activeCompetition.matches
      .filter((match) => match.round === nextRoundNumber - 1)
      .every((match) => match.winner);
  }, [activeCompetition, nextRoundNumber]);

  const generateNextRound = React.useCallback(() => {
    if (!activeCompetition || !canGenerateNextRound) {
      return;
    }

    const nextMatches = buildRoundPairings(
      activeCompetition,
      nextRoundNumber,
    );

    mutateCompetitions((prev) =>
      prev.map((competition) =>
        competition.id !== activeCompetition.id
          ? competition
          : {
              ...competition,
              matches: [...competition.matches, ...nextMatches],
            },
      ),
    );
  }, [activeCompetition, canGenerateNextRound, mutateCompetitions, nextRoundNumber]);

  return {
    appScreen,
    setAppScreen,
    competitions,
    activeCompetition,
    activeCompetitionId,
    createCompetition,
    openCompetition,
    leaveCompetition,
    deleteCompetition,
    reportWinner,
    banMatchChampion,
    skipMatchTurn,
    setMatchPick,
    swapMatchPicks,
    moveMatchPick,
    finishMatch,
    nextRoundNumber,
    canGenerateNextRound,
    generateNextRound,
  };
};