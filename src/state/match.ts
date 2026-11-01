import { atom } from "jotai";

import { ALL_LANES, BASE_MAX_DRAW_ROLLS } from "@/constants";
import {
  type DrawState,
  DrawStep,
  Lane,
  Phase,
  TeamKey,
  type TeamPlayer,
} from "@/types";

export type AssignMode = "fixed" | "random";

export const teamSizeAtom = atom<number>(5);

export const teamCountAtom = atom<1 | 2>(2);

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

/**
 * Modo de atribuição de rotas do randomizador:
 * - fixed: as 5 rotas oficiais fixas, na ordem (Top, Jungle, Mid, ADC, Support)
 * - random: embaralha o pool de rotas habilitadas entre os slots
 */
export const assignModeAtom = atom<AssignMode>("fixed");

/**
 * Rotas habilitadas nos filtros do randomizador (pool do sorteio em modo random).
 */
export const enabledLanesAtom = atom<Lane[]>([...ALL_LANES]);
