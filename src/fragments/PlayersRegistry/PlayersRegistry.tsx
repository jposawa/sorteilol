import clsx from "clsx";

import { SLInput } from "@/components";
import { useMatch } from "@/hooks";
import { type BaseComponent, TeamKey } from "@/types";

import styles from "./PlayersRegistry.module.css";

type PlayersRegistryProps = BaseComponent & {
	teamKey?: TeamKey;
	fieldTitle?: string;
};

export const PlayersRegistry: React.FC<PlayersRegistryProps> = ({
	teamKey = TeamKey.TeamA,
	fieldTitle,
	className = "",
	style = {},
}) => {
	const { playerNames, updatePlayerName } = useMatch();

	const handleUpdate = (
		event: React.ChangeEvent<HTMLInputElement>,
		index: number,
	) => {
		updatePlayerName({
			teamKey,
			index,
			name: event.target.value,
		});
	};

	return (
		<fieldset className={clsx(styles.field, className)} style={style}>
			<legend>
				<h4>{fieldTitle}</h4>
			</legend>
			<ol className={styles.playersList}>
				{playerNames[teamKey]?.map((name, index) => (
					<li key={index}>
						<label>
							<SLInput
								className={styles.playerInput}
								placeholder={`Jogador ${index + 1}`}
								defaultValue={name}
								onChange={(event) => handleUpdate(event, index)}
							/>
						</label>
					</li>
				))}
			</ol>
		</fieldset>
	);
};
