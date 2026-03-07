import React from "react";

type PhaseSetupProps = {
	className?: string;
	style?: React.CSSProperties;
};

export const PhaseSetup: React.FC<PhaseSetupProps> = ({ className, style }) => {
	return <div className={className} style={style} />;
};
