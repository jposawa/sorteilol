import React from "react";
import { useAtom } from "jotai";

import { pickRandom, randomChampionForLane } from "@/helpers";
import {
	activeTeamKeyAtom,
	currentPlayerIndexAtom,
	type DrawState,
	drawStateAtom,
	matchPhaseAtom,
	playerNamesAtom,
	randomizeTeamsAtom,
	teamCountAtom,
	teamRegistryAtom,
	teamSizeAtom,
} from "@/state";
import { DrawStep, Lane, Phase, type PlayerResult, TeamKey } from "@/types";

const ALL_LANES = Object.values(Lane);

const INITIAL_DRAW_STATE: DrawState = {
	step: DrawStep.Lane,
	usedLanes: [],
	pendingLane: null,
	confirmedLane: null,
	pendingChampion: null,
};

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

	const resolvedPlayerNames = React.useMemo(
		() => ({
			teamA: playerNames.teamA.map((n, i) => n.trim() || `Jogador ${i + 1}`),
			teamB: playerNames.teamB.map((n, i) => n.trim() || `Jogador ${i + 1}`),
		}),
		[playerNames],
	);

	const currentTeam = teamRegistry[activeTeamKey];
	const currentPlayerName =
		resolvedPlayerNames[activeTeamKey][currentPlayerIndex];

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

	const startDraw = React.useCallback(() => {
		if (randomizeTeams && teamCount === 2) {
			const flat = [...playerNames.teamA];
			for (let i = flat.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[flat[i], flat[j]] = [flat[j], flat[i]];
			}
			setPlayerNames({
				teamA: flat.slice(0, teamSize),
				teamB: flat.slice(teamSize),
			});
		}
		setMatchPhase(Phase.Drawing);
		setActiveTeamKey(TeamKey.TeamA);
		setCurrentPlayerIndex(0);
		setDrawState(INITIAL_DRAW_STATE);
		setTeamRegistry({ teamA: [], teamB: [] });
	}, [
		randomizeTeams,
		teamCount,
		teamSize,
		playerNames.teamA,
		setPlayerNames,
		setMatchPhase,
		setActiveTeamKey,
		setCurrentPlayerIndex,
		setDrawState,
		setTeamRegistry,
	]);

	// --- Sorteio – etapa Lane ---

	const drawLane = React.useCallback(() => {
		setDrawState((prev) => ({
			...prev,
			pendingLane: pickRandom(
				ALL_LANES.filter((l) => !prev.usedLanes.includes(l)),
			),
		}));
	}, [setDrawState]);

	const confirmLane = React.useCallback(() => {
		setDrawState((prev) => {
			if (!prev.pendingLane) return prev;
			return {
				...prev,
				step: DrawStep.Champion,
				usedLanes: [...prev.usedLanes, prev.pendingLane],
				confirmedLane: prev.pendingLane,
				pendingLane: null,
			};
		});
	}, [setDrawState]);

	// --- Sorteio – etapa Campeão ---

	const drawChampion = React.useCallback(() => {
		setDrawState((prev) => {
			if (!prev.confirmedLane) return prev;
			return {
				...prev,
				pendingChampion: randomChampionForLane(prev.confirmedLane),
			};
		});
	}, [setDrawState]);

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
			setDrawState(INITIAL_DRAW_STATE);
		} else if (teamCount === 2 && activeTeamKey === TeamKey.TeamA) {
			setActiveTeamKey(TeamKey.TeamB);
			setCurrentPlayerIndex(0);
			setDrawState(INITIAL_DRAW_STATE);
		} else {
			setMatchPhase(Phase.Done);
		}
	}, [
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
			...INITIAL_DRAW_STATE,
			usedLanes: prev.confirmedLane
				? prev.usedLanes.filter((l) => l !== prev.confirmedLane)
				: prev.usedLanes,
			pendingLane: prev.confirmedLane,
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
		}));
	}, [
		currentPlayerIndex,
		teamRegistry,
		activeTeamKey,
		setTeamRegistry,
		setCurrentPlayerIndex,
		setDrawState,
	]);

	// --- Fase Done ---

	const rerollChampionForPlayer = React.useCallback(
		(teamKey: TeamKey, index: number) => {
			setTeamRegistry((prev) => ({
				...prev,
				[teamKey]: prev[teamKey].map((r, i) =>
					i === index ? { ...r, champion: randomChampionForLane(r.lane) } : r,
				),
			}));
		},
		[setTeamRegistry],
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
		// Configuração
		updateTeamSize,
		updateTeamCount,
		updateRandomizeTeams,
		updatePlayerName,
		updateFlatPlayerName,
		startDraw,
		// Lane
		drawLane,
		rerollLane: drawLane,
		confirmLane,
		// Campeão
		drawChampion,
		rerollChampion: drawChampion,
		confirmChampion,
		goBackToLane,
		goBackToPreviousPlayer,
		// Done
		rerollChampionForPlayer,
		resetDraw,
	};
};
