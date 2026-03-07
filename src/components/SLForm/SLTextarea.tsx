import React from "react";
import clsx from "clsx";

import styles from "./SLForm.module.css";

type SLTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const SLTextarea: React.FC<SLTextareaProps> = (props) => {
	const { children, className = "", style = {}, ...rest } = props;

	return (
		<textarea
			{...rest}
			className={clsx(styles.baseElement, className)}
			style={style}
		>
			{children}
		</textarea>
	);
};
