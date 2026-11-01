import {
  ALL_LANES,
  BANS_PER_TEAM,
  DRAFT_TURNS,
  TOTAL_BANS,
  TOTAL_TURNS,
} from "@/constants";
import {
  type DraftGame,
  type DraftTurn,
  Lane,
  TeamKey,
} from "@/types";

export const emptyLanePicks = (): Record<Lane, string | null> => {
  return ALL_LANES.reduce(
    (picks, lane) => ({ ...picks, [lane]: null }),
    {} as Record<Lane, string | null>,
  );
};

export const createEmptyGame = (): DraftGame => ({
  bans: {
    [TeamKey.TeamA]: Array<string | null>(BANS_PER_TEAM).fill(null),
    [TeamKey.TeamB]: Array<string | null>(BANS_PER_TEAM).fill(null),
  },
  picks: {
    [TeamKey.TeamA]: emptyLanePicks(),
    [TeamKey.TeamB]: emptyLanePicks(),
  },
  turnIndex: 0,
  winner: null,
});

/**
 * Turno corrente na agenda do draft: bans/picks turnados por lado ou draft
 * completo. Drafts persistidos no formato antigo (banCursor) são migrados:
 * a sequência de bans alternada das posições 0-9 é idêntica à nova agenda.
 */
export const currentTurnIndexOf = (game: DraftGame): number => {
  if (game.turnIndex != null) {
    return game.turnIndex;
  }

  return game.banCursor != null && game.banCursor >= TOTAL_BANS
    ? TOTAL_TURNS
    : (game.banCursor ?? 0);
};

/** Turno corrente do draft: ban/pick turnado (com fase) ou draft completo. */
export const draftTurnOf = (game: DraftGame): DraftTurn => {
  const turnIndex = currentTurnIndexOf(game);

  if (turnIndex >= TOTAL_TURNS) {
    return { kind: "ready" };
  }

  return DRAFT_TURNS[turnIndex];
};

/** Quantos bans/picks foram consumidos até agora (para os contadores). */
export const draftCountersOf = (game: DraftGame) => {
  const turnIndex = currentTurnIndexOf(game);

  return DRAFT_TURNS.slice(0, turnIndex).reduce(
    (counters, turn) => ({
      bans: counters.bans + (turn.kind === "ban" ? 1 : 0),
      picks: counters.picks + (turn.kind === "pick" ? 1 : 0),
    }),
    { bans: 0, picks: 0 },
  );
};

export const championKeysUsedInGame = (game: DraftGame): Set<string> => {
  return new Set([
    ...game.bans[TeamKey.TeamA].filter((ban): ban is string => Boolean(ban)),
    ...game.bans[TeamKey.TeamB].filter((ban): ban is string => Boolean(ban)),
    ...Object.values(game.picks)
      .flatMap((sidePicks) => Object.values(sidePicks))
      .filter((pick): pick is string => Boolean(pick)),
  ]);
};

/**
 * Bane o campeão no turno corrente da agenda (só turnos de ban). Ignora
 * silenciosamente chamadas inválidas (turno não é ban do lado chamador,
 * campeão já usado na partida ou no pool locked externo).
 */
export const banChampionInGame = (
  game: DraftGame,
  championKey: string,
  lockedKeys: Set<string> = new Set(),
): DraftGame => {
  const turn = draftTurnOf(game);

  if (turn.kind !== "ban") {
    return game;
  }

  if (lockedKeys.has(championKey) || championKeysUsedInGame(game).has(championKey)) {
    return game;
  }

  const side = turn.side;
  const nextTeamBans = [...game.bans[side]];
  const slotIndex = nextTeamBans.findIndex((ban) => ban === null);

  if (slotIndex === -1) {
    return skipTurnInGame(game);
  }

  nextTeamBans[slotIndex] = championKey;

  return {
    ...game,
    bans: { ...game.bans, [side]: nextTeamBans } as typeof game.bans,
    turnIndex: currentTurnIndexOf(game) + 1,
  };
};

/** Avança um turno da agenda sem preencher (pula a vez). */
export const skipTurnInGame = (game: DraftGame): DraftGame => {
  const turnIndex = currentTurnIndexOf(game);

  if (turnIndex >= TOTAL_TURNS) {
    return game;
  }

  return { ...game, turnIndex: turnIndex + 1 };
};

/**
 * Preenche/limpa um slot de pick. Aceito apenas no turno corrente da agenda
 * (fase de pick do lado do turno); validado contra o pool locked externo e
 * contra campeões já usados na partida (exceto o pick que está sendo trocado).
 */
export const setPickInGame = (
  game: DraftGame,
  side: TeamKey,
  lane: Lane,
  championKey: string | null,
  lockedKeys: Set<string> = new Set(),
): DraftGame => {
  const turnOfGame = DRAFT_TURNS[currentTurnIndexOf(game)];

  if (!turnOfGame || turnOfGame.kind !== "pick" || turnOfGame.side !== side) {
    return game;
  }

  if (championKey) {
    if (lockedKeys.has(championKey)) {
      return game;
    }

    const used = championKeysUsedInGame(game);
    const isReplacingCurrentPick = game.picks[side][lane] === championKey;

    if (used.has(championKey) && !isReplacingCurrentPick) {
      return game;
    }
  }

  const picks = {
    ...game.picks,
    [side]: {
      ...game.picks[side],
      [lane]: championKey,
    },
  } as typeof game.picks;

  return { ...game, turnIndex: currentTurnIndexOf(game) + 1, picks };
};

/**
 * Move o pick de uma rota para outra vazia do MESMO lado (ajuste pós-pick
 * entre slots de rota; inválido se o destino já tem pick).
 */
export const movePickInGame = (
  game: DraftGame,
  side: TeamKey,
  fromLane: Lane,
  toLane: Lane,
): DraftGame => {
  const championKey = game.picks[side][fromLane];

  if (!championKey && fromLane !== toLane) {
    return game;
  }
  if (game.picks[side][toLane]) {
    return game;
  }

  return {
    ...game,
    picks: {
      ...game.picks,
      [side]: {
        ...game.picks[side],
        [fromLane]: null,
        [toLane]: championKey,
      },
    },
  };
};

/**
 * Troca os picks entre duas rotas do MESMO lado (correção de rota): se o
 * destino está vazio, vira um move; senão, troca os dois campeões.
 */
export const swapPicksInGame = (
  game: DraftGame,
  side: TeamKey,
  fromLane: Lane,
  toLane: Lane,
): DraftGame => {
  if (fromLane === toLane) {
    return game;
  }

  const fromPick = game.picks[side][fromLane];
  const toPick = game.picks[side][toLane];

  if (!toPick) {
    return movePickInGame(game, side, fromLane, toLane);
  }

  return {
    ...game,
    picks: {
      ...game.picks,
      [side]: {
        ...game.picks[side],
        [fromLane]: toPick,
        [toLane]: fromPick,
      },
    },
  };
};

export type ChampionUsage = {
  picks: number;
  wins: number;
  losses: number;
};

/**
 * Estatísticas de uso de campeões sobre drafts persistidos. "Mais jogados"
 * conta picks; "melhor winrate" considera apenas partidas com vencedor
 * marcado (pick do lado vencedor = win; do lado perdedor = loss).
 */
export const getChampionUsageStats = (
  games: DraftGame[],
): Map<string, ChampionUsage> => {
  const stats = new Map<string, ChampionUsage>();

  games.forEach((game) => {
    ([TeamKey.TeamA, TeamKey.TeamB] as TeamKey[]).forEach((side) => {
      ALL_LANES.forEach((lane) => {
        const championKey = game.picks[side][lane];

        if (!championKey) {
          return;
        }

        const entry =
          stats.get(championKey) ?? { picks: 0, wins: 0, losses: 0 };

        entry.picks += 1;

        if (game.winner === side) {
          entry.wins += 1;
        } else if (game.winner) {
          entry.losses += 1;
        }

        stats.set(championKey, entry);
      });
    });
  });

  return stats;
};