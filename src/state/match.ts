import { atom } from "jotai";

import { type Champion, DrawStep, Lane, Phase, TeamKey, type TeamPlayer } from "@/types";

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

export const currentPlayerIndexAtom = atom<number>(0);

export type DrawState = {
	step: DrawStep;
	usedLanes: Lane[];
	pendingLane: Lane | null;
	confirmedLane: Lane | null;
	pendingChampion: Champion | null;
};

export const drawStateAtom = atom<DrawState>({
	step: DrawStep.Lane,
	usedLanes: [],
	pendingLane: null,
	confirmedLane: null,
	pendingChampion: null,
});
