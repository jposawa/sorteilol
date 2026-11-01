import React from "react";
import { useAtom } from "jotai";

import { saveStorage } from "@/helpers";
import { getStandings } from "@/hooks/useCompetition";
import { competitionsAtom, registeredTeamsAtom } from "@/state";
import type { RegisteredTeam } from "@/types";

const TEAMS_STORAGE_KEY = "registered-teams";

export type TeamAggregatedRecord = { wins: number; losses: number };

export const useRegisteredTeams = () => {
  const [teams, setTeams] = useAtom(registeredTeamsAtom);
  const [competitions] = useAtom(competitionsAtom);

  const persistTeams = React.useCallback((nextTeams: RegisteredTeam[]) => {
    saveStorage(TEAMS_STORAGE_KEY, nextTeams, {
      needParse: true,
      isPersistent: true,
    });
  }, []);

  const mutateTeams = React.useCallback(
    (updater: (prev: RegisteredTeam[]) => RegisteredTeam[]) => {
      setTeams((prev) => {
        const nextTeams = updater(prev);

        persistTeams(nextTeams);

        return nextTeams;
      });
    },
    [persistTeams, setTeams],
  );

  const saveTeam = React.useCallback(
    (input: { id?: string; name: string; players: string[] }) => {
      const name = input.name.trim();
      const players = input.players.map((player) => player.trim());

      if (!name) {
        return;
      }

      mutateTeams((prev) => {
        if (input.id) {
          const exists = prev.some((team) => team.id === input.id);

          if (exists) {
            return prev.map((team) =>
              team.id === input.id ? { ...team, name, players } : team,
            );
          }

          // Id pré-definido em criação (cadastro inline no modal da
          // competição): insere mesmo sem existir antes.
          return [{ id: input.id, name, players }, ...prev];
        }

        return [{ id: crypto.randomUUID(), name, players }, ...prev];
      });
    },
    [mutateTeams],
  );

  const removeTeam = React.useCallback(
    (teamId: string) => {
      mutateTeams((prev) => prev.filter((team) => team.id !== teamId));
    },
    [mutateTeams],
  );

  /**
   * W-D agregado por nome do time em todas as competições suiças registradas.
   * O vínculo é pelo nome (a competição guarda nome, não id externo).
   */
  const aggregatedRecords = React.useMemo(() => {
    const byName = new Map<string, TeamAggregatedRecord>();

    competitions.forEach((competition) => {
      getStandings(competition).forEach((standing) => {
        const key = standing.team.name.trim().toLowerCase();
        const entry = byName.get(key) ?? { wins: 0, losses: 0 };

        entry.wins += standing.wins;
        entry.losses += standing.losses;
        byName.set(key, entry);
      });
    });

    return byName;
  }, [competitions]);

  return { teams, aggregatedRecords, saveTeam, removeTeam };
};