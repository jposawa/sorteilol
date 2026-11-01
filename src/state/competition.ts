import { atom } from "jotai";

import { loadStorage } from "@/helpers";
import {
  type Competition,
  type CompetitionMatch,
  type CompetitionTeam,
  type DraftFormat,
} from "@/types";

const storedCompetitions = loadStorage("competitions", {
  needParse: true,
  isPersistent: true,
}) as unknown;

/**
 * Dados persistidos podem ter sido criados com schemas anteriores
 * (CompetitionTeam sem players/teamId, matches sem draftFormat/draftState,
 * Competition sem draftFormat). Normaliza na carga para o app não quebrar
 * com registros legados.
 */
const migrateCompetition = (raw: unknown): Competition | null => {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }

  const candidate = raw as Partial<Competition>;

  if (!Array.isArray(candidate.teams) || !Array.isArray(candidate.matches)) {
    return null;
  }

  const draftFormat: DraftFormat =
    candidate.draftFormat === "fearless" ? "fearless" : "standard";

  const legacyTeams = candidate.teams as unknown[];

  const teams: CompetitionTeam[] = legacyTeams
    .filter(
      (team) => typeof team === "object" && team !== null,
    )
    .map((team, index) => {
      const legacy = team as Partial<CompetitionTeam>;

      return {
        seed: legacy.seed ?? index + 1,
        teamId: legacy.teamId ?? `legacy-${legacy.seed ?? index + 1}`,
        name: legacy.name ?? `Time ${index + 1}`,
        players: Array.isArray(legacy.players) ? [...legacy.players] : [],
      };
    });

  const legacyMatches = candidate.matches as unknown[];

  const matches: CompetitionMatch[] = legacyMatches
    .filter(
      (match) => typeof match === "object" && match !== null,
    )
    .map((match) => {
      const legacy = match as Partial<CompetitionMatch>;

      return {
        round: legacy.round ?? 1,
        seedA: legacy.seedA ?? -1,
        seedB: legacy.seedB ?? -1,
        winner: legacy.winner ?? null,
        seriesLength: legacy.seriesLength === 3 ? 3 : 1,
        draftFormat:
          legacy.draftFormat === "fearless" ? "fearless" : "standard",
        draftState: legacy.draftState ?? null,
      };
    });

  return {
    id: candidate.id ?? crypto.randomUUID(),
    name: candidate.name ?? "Competição suiça",
    draftFormat,
    createdAt: candidate.createdAt ?? Date.now(),
    status: candidate.status ?? "active",
    teams,
    matches,
  };
};

export const competitionsAtom = atom<Competition[]>(
  Array.isArray(storedCompetitions)
    ? storedCompetitions
        .map(migrateCompetition)
        .filter((competition): competition is Competition => competition !== null)
    : [],
);

export const activeCompetitionIdAtom = atom<string | null>(null);