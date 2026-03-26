import { CHAMPIONS } from "@/constants";
import { Lane } from "@/types";

type Champion = (typeof CHAMPIONS)[keyof typeof CHAMPIONS];

const champByLaneCache: Partial<Record<Lane, Champion[]>> = {};

export const filterChampByLane = (lane: Lane) => {
  const cached = champByLaneCache[lane];
  if (cached) {
    return cached;
  }

  const filtered = Object.values(CHAMPIONS).filter(
    (champion) =>
      champion.primaryLane === lane || champion.secondaryLane === lane,
  );

  champByLaneCache[lane] = filtered;
  return filtered;
};
