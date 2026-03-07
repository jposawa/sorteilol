import type React from "react";
import clsx from "clsx";

import { Lane } from "@/types";

import styles from "./LaneIcon.module.css";

type LaneIconProps = {
	iconName: Lane | string;
	size?: string;
	className?: string;
	style?: React.CSSProperties;
};

export const LaneIcon: React.FC<LaneIconProps> = ({
	iconName,
	size = "1.5rem",
	className = "",
	style = {},
}) => {
	if (!iconName) {
		return null;
	}

  const basePath = `/assets/${Object.values(Lane).includes(iconName as Lane) ? "lanes/" : ""}`;

	return (
		<img
			alt="lane-icon"
			src={`${basePath}icon_${iconName.toLowerCase()}.png`}
			className={clsx(styles.icon, className)}
			style={{ ...style, "--size": size } as React.CSSProperties}
		/>
	);
};
