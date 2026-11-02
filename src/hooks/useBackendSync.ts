/**
 * Hidrata as 12 tabelas do appbackend no boot e espelha nos atoms locais
 * (jotai): equipes e competições remotas entram como cadastro; o estado
 * local de draft (draftState em andamento, sessões do Randomizer) NUNCA
 * é sobrescrito — as ações dos hooks fazem write-through no backend.
 */
import React from "react";
import { useAtom } from "jotai";

import type {
  CompetitionRow,
  CompetitionTeamRow,
  MatchRow as BackendMatchRow,
} from "@/services/appBackend";
import { competitionsAtom, registeredTeamsAtom } from "@/state";
import {
  ALL_BACKEND_STORES,
  useBackendCompetitions,
  useBackendCompetitionTeams,
  useBackendMatches,
  useBackendTeams,
} from "@/stores/remoteTables";
import type {
  Competition,
  CompetitionMatch,
  CompetitionTeam,
  DraftFormat,
  RegisteredTeam,
} from "@/types";

const parseMembers = (text: string) =>
  (text ?? "")
    .split(";")
    .map((member) => member.trim())
    .filter(Boolean);

const parseDate = (text: string) => {
  const parsed = Date.parse((text ?? "").replace(" ", "T"));

  return Number.isFinite(parsed) ? parsed : Date.now();
};

const draftFormatOf = (value: string): DraftFormat =>
  value === "fearless" ? "fearless" : "standard";

/** Monta a Competition local (formato dos atoms) a partir das tabelas. */
export const assembleRemoteCompetition = (
  row: CompetitionRow,
  registrations: CompetitionTeamRow[],
  teamNameById: Map<string, string>,
  teamMembersById: Map<string, string>,
  matchRows: BackendMatchRow[],
): Competition => {
  const teams: CompetitionTeam[] = registrations
    .slice()
    .sort((a, b) => a.seed - b.seed)
    .map((registration) => ({
      seed: registration.seed,
      teamId: registration.teamid,
      name: teamNameById.get(registration.teamid) ?? registration.teamid,
      players: parseMembers(teamMembersById.get(registration.teamid) ?? ""),
    }));

  const matches: CompetitionMatch[] = matchRows
    .filter((match) => match.competitionid === row.competitionid)
    .map((match) => ({
      round: match.round,
      seedA: match.teamaseed,
      seedB: match.teambseed,
      winner: match.winnerteamid
        ? (match.teamaid === match.winnerteamid ? "seedA" : "seedB")
        : null,
      seriesLength: match.seriesformat === 1 ? 1 : 3,
      draftFormat: draftFormatOf(row.draftformat),
      draftState: null,
    }));

  return {
    id: row.competitionid,
    name: row.name,
    draftFormat: draftFormatOf(row.draftformat),
    createdAt: parseDate(row.createdat),
    status: row.status === "active" ? "active" : "registration",
    teams,
    matches,
  };
};

export const useBackendSync = () => {
  const [, setTeams] = useAtom(registeredTeamsAtom);
  const [, setCompetitions] = useAtom(competitionsAtom);
  const [syncState, setSyncState] = React.useState<"loading" | "ready" | "error">(
    "loading",
  );

  React.useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        // 1) carrega as 12 tabelas (chamadas em paralelo, com paginação)
        await Promise.all(
          ALL_BACKEND_STORES.map((store) => store.getState().load()),
        );

        if (cancelled) {
          return;
        }

        const remoteTeams = useBackendTeams.getState().rows;
        const competitionRows = useBackendCompetitions.getState().rows;
        const compTeamRows = useBackendCompetitionTeams.getState().rows;
        const matchRows = useBackendMatches.getState().rows;

        const teamNameById = new Map(
          remoteTeams.map((team) => [team.teamid, team.teamname]),
        );
        const teamMembersById = new Map(
          remoteTeams.map((team) => [team.teamid, team.teammembers]),
        );

        const compTeamsByCompetition = new Map<string, CompetitionTeamRow[]>();

        compTeamRows.forEach((registration) => {
          const list =
            compTeamsByCompetition.get(registration.competitionid) ?? [];

          list.push(registration);
          compTeamsByCompetition.set(registration.competitionid, list);
        });

        // 2) equipes: locais vencem; remotas novas entram (dedupe id/nome)
        setTeams((prev) => {
          const seenIds = new Set(
            prev.map((team) => team.id.toLowerCase()),
          );
          const seenNames = new Set(
            prev.map((team) => team.name.trim().toLowerCase()),
          );

          const remote: RegisteredTeam[] = remoteTeams
            .filter(
              (team) =>
                !seenIds.has(team.teamid.toLowerCase()) &&
                !seenNames.has(team.teamname.trim().toLowerCase()),
            )
            .map((team) => ({
              id: team.teamid,
              name: team.teamname,
              players: parseMembers(team.teammembers),
            }));

          return [...prev, ...remote];
        });

        // 3) competições: locais vencem (protege draftState em andamento)
        setCompetitions((prev) => {
          const seenIds = new Set(
            prev.map((competition) => competition.id),
          );

          const remote = competitionRows
            .filter((row) => !seenIds.has(row.competitionid))
            .map((row) =>
              assembleRemoteCompetition(
                row,
                compTeamsByCompetition.get(row.competitionid) ?? [],
                teamNameById,
                teamMembersById,
                matchRows,
              ),
            );

          return [...remote, ...prev];
        });

        if (!cancelled) {
          setSyncState("ready");
        }
      } catch (error) {
        if (!cancelled) {
          setSyncState("error");
          console.error("[backendSync]", error);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setCompetitions, setTeams]);

  return syncState;
};