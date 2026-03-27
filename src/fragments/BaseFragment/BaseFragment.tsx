import clsx from "clsx";

import { SLButton, SLInput } from "@/components";
import { type BaseComponent } from "@/types";

import styles from "./BaseFragment.module.css";

type BaseFragmentProps = BaseComponent;

export const BaseFragment: React.FC<BaseFragmentProps> = ({
	className = "",
	style = {},
}) => {
	return (
		<section className={clsx(styles.baseFragment, className)} style={style}>
			<h3>Example of Fragment</h3>

			<p>This is a base fragment component.</p>
			<p>
				The idea is to use this when having multiple components grouped to
				create a "bigger component" composition
			</p>

			<form>
				<SLInput label="Input example" placeholder="Type something..." />

				<SLButton>Button example</SLButton>
				<SLButton type="reset" role="secondary">
					Secondary Button
				</SLButton>
			</form>
		</section>
	);
};
