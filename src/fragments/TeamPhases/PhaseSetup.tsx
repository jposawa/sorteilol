import React from "react";
import clsx from "clsx";

import { SLInput, SLSelect } from "@/components";
import { useMatch } from "@/hooks";
import { TeamKey } from "@/types";
import { PlayersRegistry } from "../PlayersRegistry";

import styles from "./TeamPhases.module.css";

type PhaseSetupProps = {
	className?: string;
	style?: React.CSSProperties;
};

export const PhaseSetup: React.FC<PhaseSetupProps> = ({
	className = "",
	style = {},
}) => {
	const {
		teamCount,
		startDraw,
		updateTeamCount,
		teamSize,
		updateTeamSize,
		randomizeTeams,
		updateRandomizeTeams,
		playerNames,
	} = useMatch();
	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		startDraw();
	};

	const handleTeamSizeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const newSize = Number(event.target.value ?? 1);

		updateTeamSize(newSize);
	};

	const handleTeamCountChange = (
		event: React.ChangeEvent<HTMLSelectElement>,
	) => {
		const newCount = Number(event.target.value ?? "1") as 1 | 2;

		updateTeamCount(newCount);
	};

	return (
		<form
			className={clsx(styles.form, className)}
			onSubmit={handleSubmit}
			style={style}
		>
			<fieldset className={styles.formField}>
				<h3>
					<legend>Configuração da Partida</legend>
				</h3>

				<p className={styles.formRow}>
					<label>
						Número times:&nbsp;
						<SLSelect defaultValue={teamCount} onChange={handleTeamCountChange}>
							<option value={1}>1 time</option>
							<option value={2}>2 times</option>
						</SLSelect>
					</label>
				</p>

				<p className={styles.formRow}>
					<label>
						Tamanho time:&nbsp;
						<SLInput
							type="number"
							min={1}
							max={5}
							defaultValue={teamSize}
							onChange={handleTeamSizeChange}
						/>
					</label>
				</p>

				{teamCount === 2 && (
					<div className={styles.formRow}>
						<label htmlFor="randomize-teams">
							Sortear jogadores entre os times
						</label>
						<input
							id="randomize-teams"
							type="checkbox"
							checked={randomizeTeams}
							onChange={(e) => updateRandomizeTeams(e.target.checked)}
						/>
					</div>
				)}
			</fieldset>
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

			<button type="submit" className="sortear-btn">
				Iniciar Sorteio
			</button>
		</form>
	);
};
