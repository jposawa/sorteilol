import { Steps } from "antd";
import clsx from "clsx";
import { useAtomValue } from "jotai";

import { PHASE_ORDER } from "@/constants";
import { capitalize } from "@/helpers";
import { currentMainStepAtom } from "@/state";
import type { BaseComponent } from "@/types";

import styles from "./MatchStepsTracker.module.css";

type MatchStepsTrackerProps = BaseComponent;

const MAIN_STEPS_LIST = PHASE_ORDER.map((phase) => ({
	title: capitalize(phase),
}));

export const MatchStepsTracker: React.FC<MatchStepsTrackerProps> = ({
	className = "",
	style = {},
}) => {
	const currentMainStep = useAtomValue(currentMainStepAtom);
	return (
		<Steps
			className={clsx(styles.matchStepsTracker, className)}
			style={style}
			items={MAIN_STEPS_LIST}
			current={currentMainStep}
			titlePlacement="vertical"
			orientation="horizontal"
			ellipsis
      size="small"
			responsive={false}
		/>
	);
};
