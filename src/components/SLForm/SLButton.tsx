import type React from "react";
import clsx from "clsx";

import styles from "./SLForm.module.css";

type SLButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
	variation?: "filled" | "outlined" | "text";
	variant?: "filled" | "outlined" | "text";
	role?: "primary" | "secondary" | "danger";
};

export const SLButton: React.FC<SLButtonProps> = (props) => {
	const {
		className = "",
		children,
		style = {},
		type = "button",
		variation = "filled",
		variant,
		role = "primary",
		...rest
	} = props;

	return (
		<button
			type={type}
			className={clsx(
				styles.button,
				styles[`btn-${variant ?? variation}`],
				styles[`role-${role}`],
				className,
			)}
			style={style}
			{...rest}
		>
			{children}
		</button>
	);
};
