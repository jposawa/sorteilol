import React from "react";
import clsx from "clsx";

import { useMatch } from "@/hooks";
import { type BaseComponent, TeamKey } from "@/types";
import { PlayersRegistry } from "../PlayersRegistry";

import styles from "./TeamPhases.module.css";
import { SLButton } from "@/components";

type PhaseRegisteringProps = BaseComponent;

export const PhaseRegistering: React.FC<PhaseRegisteringProps> = ({
	className = "",
	style = {},
}) => {
	const { teamCount, startDraw, randomizeTeams, playerNames } = useMatch();
	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		startDraw();
	};

	return (
		<form
			className={clsx(styles.form, className)}
			onSubmit={handleSubmit}
			style={style}
		>
			<PlayersRegistry
				teamKey={TeamKey.TeamA}
				fieldTitle={teamCount === 1 || randomizeTeams ? "Jogadores" : "Time A"}
				className={styles.formField}
			/>

			{teamCount === 2 && !!playerNames.teamB?.length && (
				<PlayersRegistry
					teamKey={TeamKey.TeamB}
					fieldTitle="Time B"
					className={styles.formField}
				/>
			)}

      <SLButton type="submit">
				Iniciar Sorteio
      </SLButton>
		</form>
	);
};
