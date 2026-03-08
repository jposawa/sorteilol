import type React from "react";

export type BaseComponent = {
	className?: string;
	style?: React.CSSProperties;
};

export type FormInteractionComponent = {
	label?: string | React.ReactNode;
};
