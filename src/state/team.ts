import { atom } from "jotai";

import { loadStorage } from "@/helpers";
import { type RegisteredTeam } from "@/types";

const storedTeams = loadStorage("registered-teams", {
  needParse: true,
  isPersistent: true,
}) as unknown;

export const registeredTeamsAtom = atom<RegisteredTeam[]>(
  Array.isArray(storedTeams) ? (storedTeams as RegisteredTeam[]) : [],
);