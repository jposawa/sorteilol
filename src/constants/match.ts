import { type DrawState, DrawStep, Lane, Phase } from "@/types";

export const ALL_LANES = Object.values(Lane);
export const BASE_MAX_DRAW_ROLLS = 3;

export const INITIAL_DRAW_STATE: DrawState = {
  step: DrawStep.Lane,
  usedLanes: [],
  pendingLane: null,
  confirmedLane: null,
  pendingChampion: null,
  laneRollCount: 0,
  championRollCount: 0,
};

export const PHASE_ORDER: Phase[] = [
  Phase.Setup,
  Phase.Registering,
  Phase.Drawing,
  Phase.Done,
];
