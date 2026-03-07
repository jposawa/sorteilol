import React from "react";
import clsx from "clsx";

import styles from "./SLForm.module.css";

type OptionType = {
	value?: string | number;
	label?: string | React.ReactNode;
};

type SLSelectProps<T> = React.SelectHTMLAttributes<HTMLSelectElement> & {
	data?: T[] | OptionType[];
	getOptionValue?: (item: T) => string | number | undefined;
	getOptionLabel?: (item: T) => string | React.ReactNode | undefined;
};

export const SLSelect = <T,>(props: SLSelectProps<T>) => {
	const {
		data,
		children,
		className = "",
		style = {},
		getOptionValue,
		getOptionLabel,
		...rest
	} = props;

	if (!data?.length && !children) {
		console.warn(
			"[SLSelect] select needs either data or direct options children",
		);

		return null;
	}

	return (
		<select
			{...rest}
			className={clsx(styles.baseElement, className)}
			style={style}
		>
			{children ??
				data!.map((item, index) => {
					const asOpt = item as OptionType;
					const value = getOptionValue
						? getOptionValue(item as T)
						: asOpt.value;
					const label = getOptionLabel
						? getOptionLabel(item as T)
						: asOpt.label;
					return (
						<option key={index} value={value ?? String(item)}>
							{label ?? String(item)}
						</option>
					);
				})}
		</select>
	);
};
