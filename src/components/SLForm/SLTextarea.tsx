import React from "react";
import clsx from "clsx";

import type { FormInteractionComponent } from "@/types";

import styles from "./SLForm.module.css";

type SLTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> &
	FormInteractionComponent;

export const SLTextarea: React.FC<SLTextareaProps> = (props) => {
	const { children, className = "", style = {}, label, ...rest } = props;

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
			<textarea
				{...rest}
				className={clsx(styles.baseElement, className)}
				style={style}
			>
				{children}
			</textarea>
		</label>
	);
};
