import { atom } from "jotai";

import { BASE_MAX_DRAW_ROLLS } from "@/constants";
import {
  type DrawState,
  DrawStep,
  Phase,
  TeamKey,
  type TeamPlayer,
} from "@/types";

export const teamSizeAtom = atom<number>(5);

export const teamCountAtom = atom<1 | 2>(1);

export const playerNamesAtom = atom<Record<TeamKey, string[]>>({
  teamA: Array<string>(5).fill(""),
  teamB: Array<string>(5).fill(""),
});

export const teamRegistryAtom = atom<TeamPlayer>({
  teamA: [],
  teamB: [],
});

export const activeTeamKeyAtom = atom<TeamKey>(TeamKey.TeamA);

export const matchPhaseAtom = atom<Phase>(Phase.Setup);

export const randomizeTeamsAtom = atom<boolean>(false);

export const currentPlayerIndexAtom = atom<number>(0);

export const drawStateAtom = atom<DrawState>({
  step: DrawStep.Lane,
  usedLanes: [],
  pendingLane: null,
  confirmedLane: null,
  pendingChampion: null,
  laneRollCount: 0,
  championRollCount: 0,
});

export const currentMainStepAtom = atom<number>(0);

export const currentSideStepAtom = atom<number>(0);

export const maxDrawRollsAtom = atom<number>(BASE_MAX_DRAW_ROLLS);
