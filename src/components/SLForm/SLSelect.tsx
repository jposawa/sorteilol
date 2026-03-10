import React from "react";
import clsx from "clsx";

import type { FormInteractionComponent } from "@/types";

import styles from "./SLForm.module.css";

type OptionType = {
	value?: string | number;
	label?: string | React.ReactNode;
};

type SLSelectProps<T> = React.SelectHTMLAttributes<HTMLSelectElement> &
	FormInteractionComponent & {
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
		label,
		...rest
	} = props;

	const elementLabel = React.useMemo(() => {
		if (!label) {
			return null;
		}

		if (typeof label === "string") {
			return <span className={styles.label}>{label}</span>;
		}

		return label as React.ReactNode;
	}, [label]);

	if (!data?.length && !children) {
		console.warn(
			"[SLSelect] select needs either data or direct options children",
		);

		return null;
	}

	return (
		<label className={clsx(styles.labelElement)}>
			{elementLabel}
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
		</label>
	);
};
