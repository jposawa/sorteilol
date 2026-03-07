import React from "react";
import clsx from "clsx";

import styles from "./SLForm.module.css";

type SLInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const SLInput: React.FC<SLInputProps> = (props) => {
	const { className = "", style = {}, type = "text", ...rest } = props;

	return (
		<input
			{...rest}
			type={type}
			className={clsx(styles.baseElement, className)}
			style={style}
		/>
	);
};
