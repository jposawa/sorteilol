import type React from "react";
import type { Lane } from "../../types";

import styles from "./LaneIcon.module.css";
import clsx from "clsx";

type LaneIconProps = {
	lane: Lane;
	size?: string;
	className?: string;
	style?: React.CSSProperties;
};

export const LaneIcon: React.FC<LaneIconProps> = ({
	lane,
	size = "1.5rem",
	className = "",
	style = {},
}) => {
	if (!lane) {
		return null;
	}

	return (
		<img
			alt="lane-icon"
			src={`/lanes/icon_${lane.toLowerCase()}.png`}
			className={clsx(styles.icon, className)}
			style={{ ...style, "--size": size } as React.CSSProperties}
		/>
	);
};
