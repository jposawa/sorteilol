import React from "react";
import { useAtom } from "jotai";

import { saveStorage } from "@/helpers";
import { getStandings } from "@/hooks/useCompetition";
import { backendWriteThrough as remoteWrite } from "@/services/appBackend";
import { competitionsAtom, registeredTeamsAtom } from "@/state";
import {
  useBackendTeamMembers,
  useBackendTeams,
} from "@/stores/remoteTables";
import type { RegisteredTeam } from "@/types";

const TEAMS_STORAGE_KEY = "registered-teams";

const teamTagFrom = (name: string) => {
  const words = name.split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return words
      .slice(0, 3)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  }

  return name.slice(0, 3).toUpperCase();
};

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
      const membersText = players.join("; ");

      if (!name) {
        return;
      }

      const teamsRemote = useBackendTeams.getState().rows;
      const applyRemoteWrite = (teamId: string, isNew: boolean) => {
        const store = useBackendTeams.getState();

        if (isNew) {
          remoteWrite(() =>
            store.create([
              {
                teamid: teamId,
                orgid: "",
                teamname: name,
                teamtag: teamTagFrom(name),
                createdat: new Date().toISOString().slice(0, 10),
                isactiveteam: "true",
                teammembers: membersText,
              },
            ]),
          );

          return;
        }

        const remoteRow = teamsRemote.find((team) => team.teamid === teamId);

        if (remoteRow) {
          remoteWrite(() =>
            store.update(remoteRow._id, {
              teamname: name,
              teammembers: membersText,
            }),
          );
        }
      };

      mutateTeams((prev) => {
        if (input.id) {
          const exists = prev.some((team) => team.id === input.id);

          if (exists) {
            applyRemoteWrite(input.id, false);

            return prev.map((team) =>
              team.id === input.id ? { ...team, name, players } : team,
            );
          }

          // Id pré-definido em criação (cadastro inline no modal da
          // competição): insere mesmo sem existir antes.
          applyRemoteWrite(input.id, true);

          return [{ id: input.id, name, players }, ...prev];
        }

        const newId = crypto.randomUUID();

        applyRemoteWrite(newId, true);

        return [{ id: newId, name, players }, ...prev];
      });
    },
    [mutateTeams],
  );

  const removeTeam = React.useCallback(
    (teamId: string) => {
      const remoteRow = useBackendTeams
        .getState()
        .rows.find((team) => team.teamid === teamId);
      const memberRows = useBackendTeamMembers
        .getState()
        .rows.filter((member) => member.teamid === teamId);

      remoteWrite(async () => {
        const store = useBackendTeamMembers.getState();

        await store.remove(memberRows.map((member) => member._id));
        await useBackendTeams.getState().remove(
          remoteRow ? [remoteRow._id] : [],
        );
      });

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