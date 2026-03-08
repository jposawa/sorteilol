import React from "react";
import { Steps } from "antd";
import clsx from "clsx";

import { PHASE_ORDER } from "@/constants";
import { capitalize } from "@/helpers";
import { useMatch } from "@/hooks";
import { type BaseComponent, Phase,TeamKey} from "@/types";

import styles from "./MatchStepsTracker.module.css";

type MatchStepsTrackerProps = BaseComponent;

export const MatchStepsTracker: React.FC<MatchStepsTrackerProps> = ({
	className = "",
	style = {},
}) => {
	const {
		matchPhase,
		currentMainStep, 
		movePhase,
		currentPlayerIndex,
		teamCount,
		teamSize,
		activeTeamKey,
	} = useMatch();

	const mainStepsList = React.useMemo(() => {
		const steps = PHASE_ORDER.map((phase, index) => ({
			title: capitalize(phase),
			disabled: index > currentMainStep,
		}));

		return steps;
	}, [currentMainStep]);

	const drawingPercent = React.useMemo(() => {
		if (matchPhase !== Phase.Drawing) {
			return undefined;
		}
		const teamNumberMult = activeTeamKey === TeamKey.TeamA ? 0 : 1;
		const teamOffset = teamSize * teamNumberMult;
		const playerGeralPos = currentPlayerIndex + teamOffset;
		const totalPositions = teamCount * teamSize;

		const currentPercent = (playerGeralPos / (totalPositions || 1)) * 100;

		return currentPercent;
	}, [activeTeamKey, teamSize, teamCount, currentPlayerIndex, matchPhase]);

	const handleStepChange = (step: number) => {
		const phaseDiff = step - currentMainStep;

		movePhase(phaseDiff);
	};

	return (
		<Steps
			onChange={handleStepChange}
			className={clsx(styles.matchStepsTracker, className)}
			style={style}
			items={mainStepsList}
			current={currentMainStep}
			titlePlacement="vertical"
			orientation="horizontal"
			size="small"
			responsive={false}
			percent={drawingPercent}
			ellipsis
		/>
	);
};
