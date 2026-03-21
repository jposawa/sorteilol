import React, { useMemo } from "react";

import { pickRandom } from "@/helpers";
import { filterChampByLane } from "@/helpers/filterChampByLane";
import { type Champion, Lane } from "@/types";

const shuffleChampions = (champions: Champion[]) => {
  const shuffled = [...champions];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
};

interface UseRandomChampOptions {
  excludedChampionKeys?: string[];
}

export const useRandomChamp = () => {
  const championPoolByLane = useMemo(() => {
    return {
      [Lane.Top]: filterChampByLane(Lane.Top),
      [Lane.Jungle]: filterChampByLane(Lane.Jungle),
      [Lane.Mid]: filterChampByLane(Lane.Mid),
      [Lane.ADC]: filterChampByLane(Lane.ADC),
      [Lane.Support]: filterChampByLane(Lane.Support),
    };
  }, []);

  const remainingChampionsByLaneRef = React.useRef<Record<Lane, Champion[]>>({
    [Lane.Top]: [],
    [Lane.Jungle]: [],
    [Lane.Mid]: [],
    [Lane.ADC]: [],
    [Lane.Support]: [],
  });

  const refillLanePool = React.useCallback(
    (lane: Lane) => {
      const refilledPool = shuffleChampions(championPoolByLane[lane]);

      remainingChampionsByLaneRef.current[lane] = refilledPool;

      return refilledPool;
    },
    [championPoolByLane],
  );

  const randomChampionForLane = React.useCallback(
    (lane: Lane, options: UseRandomChampOptions = {}): Champion => {
      const { excludedChampionKeys = [] } = options;
      const excludedSet = new Set(excludedChampionKeys);
      const lanePool = championPoolByLane[lane];

      let remainingPool = remainingChampionsByLaneRef.current[lane];

      if (remainingPool.length === 0) {
        remainingPool = refillLanePool(lane);
      }

      let availablePool = remainingPool.filter(
        (champion) => !excludedSet.has(champion.key),
      );

      if (availablePool.length === 0) {
        remainingPool = refillLanePool(lane);
        availablePool = remainingPool.filter(
          (champion) => !excludedSet.has(champion.key),
        );
      }

      const selectedChampion = pickRandom(
        availablePool.length > 0 ? availablePool : lanePool,
      );

      remainingChampionsByLaneRef.current[lane] =
        remainingChampionsByLaneRef.current[lane].filter(
          (champion) => champion.key !== selectedChampion.key,
        );

      return selectedChampion;
    },
    [championPoolByLane, refillLanePool],
  );

  const resetChampionHistory = React.useCallback((lane?: Lane) => {
    if (lane) {
      remainingChampionsByLaneRef.current[lane] = [];
      return;
    }

    remainingChampionsByLaneRef.current = {
      [Lane.Top]: [],
      [Lane.Jungle]: [],
      [Lane.Mid]: [],
      [Lane.ADC]: [],
      [Lane.Support]: [],
    };
  }, []);

  return {
    randomChampionForLane,
    resetChampionHistory,
  };
};
