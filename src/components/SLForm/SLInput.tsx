import React from "react";
import clsx from "clsx";

import type { FormInteractionComponent } from "@/types";

import styles from "./SLForm.module.css";

type SLInputProps = React.InputHTMLAttributes<HTMLInputElement> &
	FormInteractionComponent;

export const SLInput: React.FC<SLInputProps> = (props) => {
	const { className = "", style = {}, type = "text", label, ...rest } = props;

	const elementLabel = React.useMemo(() => {
		if (!label) {
			return null;
		}

		if (typeof label === "string") {
			return <span className={styles.label}>{label}</span>;
		}

		return label as React.ReactNode;
	}, [label]);

	return (
		<label>
			{elementLabel}
			<input
				{...rest}
				type={type}
				className={clsx(styles.baseElement, className)}
				style={style}
			/>
		</label>
	);
};
