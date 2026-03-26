import React from "react";
import { useAtom } from "jotai";

import { ALL_LANES, INITIAL_DRAW_STATE, PHASE_ORDER } from "@/constants";
import { pickRandom } from "@/helpers";
import { useRandomChamp } from "@/hooks/useRandomChamp";
import {
  activeTeamKeyAtom,
  currentMainStepAtom,
  currentPlayerIndexAtom,
  currentSideStepAtom,
  drawStateAtom,
  matchPhaseAtom,
  maxDrawRollsAtom,
  playerNamesAtom,
  randomizeTeamsAtom,
  teamCountAtom,
  teamRegistryAtom,
  teamSizeAtom,
} from "@/state";
import {
  DrawStep,
  type Lane,
  Phase,
  type PlayerResult,
  TeamKey,
} from "@/types";

export const useMatch = () => {
  /**
   * In theory this could be done with fewer states, like using `teamRegistry` to have the `playerNames` and infer step by checking attributes
   * However, this was implemented initially using AI.
   * Also, on a "bright side", this helps human legibility and debugging by having more explicit states.
   *
   * TODO: Review if some states can be simplified and inferred from others
   */
  const [teamSize, setTeamSize] = useAtom(teamSizeAtom);
  const [teamCount, setTeamCount] = useAtom(teamCountAtom);
  const [playerNames, setPlayerNames] = useAtom(playerNamesAtom);
  const [teamRegistry, setTeamRegistry] = useAtom(teamRegistryAtom);
  const [activeTeamKey, setActiveTeamKey] = useAtom(activeTeamKeyAtom);
  const [matchPhase, setMatchPhase] = useAtom(matchPhaseAtom);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useAtom(
    currentPlayerIndexAtom,
  );
  const [drawState, setDrawState] = useAtom(drawStateAtom);
  const [randomizeTeams, setRandomizeTeams] = useAtom(randomizeTeamsAtom);
  const [currentMainStep, setCurrentMainStep] = useAtom(currentMainStepAtom);
  const [currentSideStep, setCurrentSideStep] = useAtom(currentSideStepAtom);
  const [maxDrawRolls, setMaxDrawRolls] = useAtom(maxDrawRollsAtom);
  const { randomChampionForLane } = useRandomChamp();

  const resolvedPlayerNames = React.useMemo(() => {
    if (randomizeTeams && teamCount === 2) {
      const totalPlayers = teamSize * teamCount;
      const sourcePlayers = [...playerNames.teamA, ...playerNames.teamB].slice(
        0,
        totalPlayers,
      );

      return {
        teamA: Array.from(
          { length: teamSize },
          (_value, i) => sourcePlayers[i]?.trim() || `Jogador ${i + 1}`,
        ),
        teamB: Array.from(
          { length: teamSize },
          (_value, i) =>
            sourcePlayers[teamSize + i]?.trim() ||
            `Jogador ${teamSize + i + 1}`,
        ),
      };
    }

    return {
      teamA: playerNames.teamA.map((n, i) => n.trim() || `Jogador ${i + 1}`),
      teamB: playerNames.teamB.map((n, i) => n.trim() || `Jogador ${i + 1}`),
    };
  }, [playerNames, randomizeTeams, teamCount, teamSize]);

  const currentTeam = teamRegistry[activeTeamKey];
  const currentPlayerName =
    resolvedPlayerNames[activeTeamKey][currentPlayerIndex] ??
    `Jogador ${currentPlayerIndex + 1}`;

  const getUsedChampionKeysForLane = React.useCallback(
    (lane: Lane) =>
      [...teamRegistry.teamA, ...teamRegistry.teamB]
        .filter((result) => result.lane === lane)
        .map((result) => result.champion.key),
    [teamRegistry],
  );

  const createAutoChampionStepState = React.useCallback((usedLanes: Lane[]) => {
    const remainingLanes = ALL_LANES.filter(
      (lane) => !usedLanes.includes(lane),
    );
    const selectedLane = pickRandom(
      remainingLanes.length > 0 ? remainingLanes : ALL_LANES,
    );

    return {
      ...INITIAL_DRAW_STATE,
      step: DrawStep.Champion,
      usedLanes: [...usedLanes, selectedLane],
      confirmedLane: selectedLane,
      laneRollCount: 1,
    };
  }, []);

  const canRerollCurrentLane = React.useMemo(() => {
    if (!drawState.confirmedLane || drawState.laneRollCount >= maxDrawRolls) {
      return false;
    }

    const lockedLanes = drawState.usedLanes.filter(
      (lane) => lane !== drawState.confirmedLane,
    );

    return ALL_LANES.some(
      (lane) => lane !== drawState.confirmedLane && !lockedLanes.includes(lane),
    );
  }, [drawState, maxDrawRolls]);

  // --- Configuração ---

  const updateTeamSize = React.useCallback(
    (size: number) => setTeamSize(Math.min(5, Math.max(1, size))),
    [setTeamSize],
  );

  const updateTeamCount = React.useCallback(
    (count: 1 | 2) => {
      setTeamCount(count);
      if (count === 1) setRandomizeTeams(false);
    },
    [setTeamCount, setRandomizeTeams],
  );

  const updateRandomizeTeams = React.useCallback(
    (value: boolean) => setRandomizeTeams(value),
    [setRandomizeTeams],
  );

  const updateFlatPlayerName = React.useCallback(
    (index: number, name: string) =>
      setPlayerNames((prev) => ({
        ...prev,
        teamA: prev.teamA.map((n, i) => (i === index ? name : n)),
      })),
    [setPlayerNames],
  );

  const updatePlayerName = React.useCallback(
    (params: { teamKey?: TeamKey; index: number; name: string }) => {
      const { teamKey = TeamKey.TeamA, index, name } = params;
      setPlayerNames((prev) => ({
        ...prev,
        [teamKey]: prev[teamKey].map((n, i) => (i === index ? name : n)),
      }));
    },
    [setPlayerNames],
  );

  /**
   * Move a `Phase` pelo número de passo indicado, seguindo ordem de `Phase` definida em `PHASE_ORDER`.
   *
   * @param stepNumber Número de passos em que está se movendo. Pode ser positivo ou negativo, dependendo do sentido de movimento.
   */
  const movePhase = React.useCallback(
    (stepNumber: number = 1) => {
      const currentPhaseIndex = PHASE_ORDER.indexOf(matchPhase);
      const targetPhaseIndex = currentPhaseIndex + stepNumber;

      if (targetPhaseIndex < 0) {
        console.warn(
          "[movePhase] Já está na primeira fase, não é possível retroceder mais",
        );
        return;
      }

      if (targetPhaseIndex >= PHASE_ORDER.length) {
        console.warn(
          "[movePhase] Já está na última fase, não é possível avançar mais",
        );
        return;
      }

      const targetPhase = PHASE_ORDER[targetPhaseIndex];

      setMatchPhase(targetPhase);
    },
    [matchPhase, setMatchPhase],
  );

  const nextPhase = React.useCallback(() => movePhase(1), [movePhase]);
  const previousPhase = React.useCallback(() => movePhase(-1), [movePhase]);

  const startDraw = React.useCallback(() => {
    if (randomizeTeams && teamCount === 2) {
      const totalPlayers = teamSize * teamCount;
      const sourcePlayers = [...playerNames.teamA, ...playerNames.teamB];
      const flat = Array.from(
        { length: totalPlayers },
        (_, i) => sourcePlayers[i] ?? "",
      );

      for (let i = flat.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [flat[i], flat[j]] = [flat[j], flat[i]];
      }

      setPlayerNames({
        teamA: flat.slice(0, teamSize),
        teamB: flat.slice(teamSize, teamSize * 2),
      });
    }
    setMatchPhase(Phase.Drawing);
    setActiveTeamKey(TeamKey.TeamA);
    setCurrentPlayerIndex(0);
    setDrawState(createAutoChampionStepState([]));
    setTeamRegistry({ teamA: [], teamB: [] });
  }, [
    createAutoChampionStepState,
    randomizeTeams,
    teamCount,
    teamSize,
    playerNames.teamA,
    playerNames.teamB,
    setPlayerNames,
    setMatchPhase,
    setActiveTeamKey,
    setCurrentPlayerIndex,
    setDrawState,
    setTeamRegistry,
  ]);

  // --- Sorteio – etapa Lane ---

  const drawLane = React.useCallback(() => {
    setDrawState((prev) => {
      if (prev.laneRollCount >= maxDrawRolls) {
        return prev;
      }

      const currentUsedLanes = prev.usedLanes;
      const remainingLanes = ALL_LANES.filter(
        (lane) => !currentUsedLanes.includes(lane),
      );
      const lanePool = remainingLanes.length > 0 ? remainingLanes : ALL_LANES;

      return {
        ...prev,
        pendingLane: pickRandom(lanePool),
        laneRollCount: prev.laneRollCount + 1,
      };
    });
  }, [setDrawState, maxDrawRolls]);

  const confirmLane = React.useCallback(() => {
    setDrawState((prev) => {
      if (!prev.pendingLane) return prev;

      const newDrawState = {
        ...prev,
        step: DrawStep.Champion,
        usedLanes: [...prev.usedLanes, prev.pendingLane],
        confirmedLane: prev.pendingLane,
        pendingLane: null,
        championRollCount: 0,
      };

      return newDrawState;
    });
  }, [setDrawState]);

  // --- Sorteio – etapa Campeão ---

  const drawChampion = React.useCallback(() => {
    setDrawState((prev) => {
      if (!prev.confirmedLane || prev.championRollCount >= maxDrawRolls) {
        return prev;
      }

      const excludedChampionKeys = [
        ...getUsedChampionKeysForLane(prev.confirmedLane),
        prev.pendingChampion?.key,
      ].filter((key): key is string => Boolean(key));

      return {
        ...prev,
        pendingChampion: randomChampionForLane(prev.confirmedLane, {
          excludedChampionKeys,
        }),
        championRollCount: prev.championRollCount + 1,
      };
    });
  }, [
    setDrawState,
    maxDrawRolls,
    getUsedChampionKeysForLane,
    randomChampionForLane,
  ]);

  const rerollLaneForCurrentPlayer = React.useCallback(() => {
    setDrawState((prev) => {
      if (!prev.confirmedLane || prev.laneRollCount >= maxDrawRolls) {
        return prev;
      }

      const lockedLanes = prev.usedLanes.filter(
        (lane) => lane !== prev.confirmedLane,
      );
      const rerollPool = ALL_LANES.filter(
        (lane) => lane !== prev.confirmedLane && !lockedLanes.includes(lane),
      );

      if (rerollPool.length === 0) {
        return prev;
      }

      const newLane = pickRandom(rerollPool);

      return {
        ...prev,
        confirmedLane: newLane,
        usedLanes: [...lockedLanes, newLane],
        pendingChampion: null,
        laneRollCount: prev.laneRollCount + 1,
        championRollCount: 0,
      };
    });
  }, [setDrawState, maxDrawRolls]);

  const confirmChampion = React.useCallback(() => {
    if (!drawState.confirmedLane || !drawState.pendingChampion) return;

    const newResult: PlayerResult = {
      name: currentPlayerName,
      lane: drawState.confirmedLane,
      champion: drawState.pendingChampion,
    };

    setTeamRegistry((prev) => ({
      ...prev,
      [activeTeamKey]: [...prev[activeTeamKey], newResult],
    }));

    const isLastPlayer = currentPlayerIndex >= teamSize - 1;

    if (!isLastPlayer) {
      setCurrentPlayerIndex((prev) => prev + 1);
      setDrawState((prev) => createAutoChampionStepState(prev.usedLanes));
    } else if (teamCount === 2 && activeTeamKey === TeamKey.TeamA) {
      setActiveTeamKey(TeamKey.TeamB);
      setCurrentPlayerIndex(0);
      setDrawState(createAutoChampionStepState([]));
    } else {
      setMatchPhase(Phase.Done);
    }
  }, [
    createAutoChampionStepState,
    drawState.confirmedLane,
    drawState.pendingChampion,
    currentPlayerName,
    activeTeamKey,
    currentPlayerIndex,
    teamSize,
    teamCount,
    setTeamRegistry,
    setCurrentPlayerIndex,
    setDrawState,
    setActiveTeamKey,
    setMatchPhase,
  ]);

  const goBackToLane = React.useCallback(() => {
    setDrawState((prev) => ({
      ...prev,
      step: DrawStep.Champion,
      pendingLane: null,
      pendingChampion: null,
    }));
  }, [setDrawState]);

  const goBackToPreviousPlayer = React.useCallback(() => {
    if (currentPlayerIndex === 0) return;

    const prevResult = teamRegistry[activeTeamKey].at(-1);
    if (!prevResult) return;

    setTeamRegistry((prev) => ({
      ...prev,
      [activeTeamKey]: prev[activeTeamKey].slice(0, -1),
    }));
    setCurrentPlayerIndex((prev) => prev - 1);
    setDrawState((prev) => ({
      step: DrawStep.Champion,
      usedLanes: prev.usedLanes.filter((l) => l !== prevResult.lane),
      pendingLane: null,
      confirmedLane: prevResult.lane,
      pendingChampion: prevResult.champion,
      laneRollCount: 1,
      championRollCount: 1,
    }));
  }, [
    currentPlayerIndex,
    teamRegistry,
    activeTeamKey,
    setTeamRegistry,
    setCurrentPlayerIndex,
    setDrawState,
  ]);

  const goBackToRegistering = React.useCallback(() => {
    setMatchPhase(Phase.Registering);
    setActiveTeamKey(TeamKey.TeamA);
    setCurrentPlayerIndex(0);
    setDrawState(INITIAL_DRAW_STATE);
    setTeamRegistry({ teamA: [], teamB: [] });
  }, [
    setMatchPhase,
    setActiveTeamKey,
    setCurrentPlayerIndex,
    setDrawState,
    setTeamRegistry,
  ]);

  // --- Fase Done ---

  const rerollChampionForPlayer = React.useCallback(
    (teamKey: TeamKey, index: number) => {
      setTeamRegistry((prev) => ({
        ...prev,
        [teamKey]: prev[teamKey].map((r, i) => {
          if (i !== index) {
            return r;
          }

          const usedChampionKeysForLane = [...prev.teamA, ...prev.teamB]
            .filter((result) => result.lane === r.lane && result !== r)
            .map((result) => result.champion.key);

          return {
            ...r,
            champion: randomChampionForLane(r.lane, {
              excludedChampionKeys: [
                ...usedChampionKeysForLane,
                r.champion.key,
              ],
            }),
          };
        }),
      }));
    },
    [randomChampionForLane, setTeamRegistry],
  );

  const resetDraw = React.useCallback(() => {
    setMatchPhase(Phase.Setup);
    setActiveTeamKey(TeamKey.TeamA);
    setCurrentPlayerIndex(0);
    setDrawState(INITIAL_DRAW_STATE);
    setTeamRegistry({ teamA: [], teamB: [] });
  }, [
    setMatchPhase,
    setActiveTeamKey,
    setCurrentPlayerIndex,
    setDrawState,
    setTeamRegistry,
  ]);

  // Redimensiona/reorganiza os arrays de nomes ao alterar teamSize, teamCount ou randomizeTeams
  React.useEffect(() => {
    if (randomizeTeams && teamCount === 2) {
      const total = teamSize * 2;
      setPlayerNames((prev) => {
        const flat = [...prev.teamA, ...prev.teamB];
        return {
          teamA: Array.from({ length: total }, (_, i) => flat[i] ?? ""),
          teamB: [],
        };
      });
    } else {
      setPlayerNames((prev) => {
        // Se estava no modo flat (teamB vazio e teamA maior que teamSize), split inteligente
        const wasFlat = prev.teamB.length === 0 && prev.teamA.length > teamSize;
        return {
          teamA: Array.from(
            { length: teamSize },
            (_, i) => prev.teamA[i] ?? "",
          ),
          teamB: Array.from({ length: teamSize }, (_, i) =>
            wasFlat ? (prev.teamA[teamSize + i] ?? "") : (prev.teamB[i] ?? ""),
          ),
        };
      });
    }
  }, [teamSize, teamCount, randomizeTeams, setPlayerNames]);

  /**
   * Doing this to guarantee state and index sync from multiple update sources
   */
  React.useEffect(() => {
    const currentPhaseIndex = PHASE_ORDER.indexOf(matchPhase);

    setCurrentMainStep(currentPhaseIndex);
    setCurrentSideStep(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchPhase]);

  return {
    // Estado
    teamSize,
    teamCount,
    randomizeTeams,
    playerNames,
    resolvedPlayerNames,
    teamRegistry,
    activeTeamKey,
    matchPhase,
    currentPlayerIndex,
    currentPlayerName,
    currentTeam,
    drawState,
    canRerollCurrentLane,
    currentMainStep,
    currentSideStep,
    maxDrawRolls,
    // Configuração
    updateTeamSize,
    updateTeamCount,
    updateRandomizeTeams,
    updatePlayerName,
    updateFlatPlayerName,
    setMaxDrawRolls,
    //Flow
    startDraw,
    setMatchPhase,
    movePhase,
    nextPhase,
    previousPhase,
    // Lane
    drawLane,
    rerollLane: drawLane,
    confirmLane,
    // Campeão
    drawChampion,
    rerollChampion: drawChampion,
    rerollLaneForCurrentPlayer,
    confirmChampion,
    goBackToLane,
    goBackToPreviousPlayer,
    goBackToRegistering,
    // Done
    rerollChampionForPlayer,
    resetDraw,
  };
};
