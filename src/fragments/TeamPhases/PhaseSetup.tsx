import React from "react";
import { Switch } from "antd";
import clsx from "clsx";

import { SLButton, SLInput, SLSelect } from "@/components";
import { useMatch } from "@/hooks";
import { type BaseComponent } from "@/types";

import styles from "./TeamPhases.module.css";

type PhaseSetupProps = BaseComponent;

export const PhaseSetup: React.FC<PhaseSetupProps> = ({
	className = "",
	style = {},
}) => {
	const {
		teamCount,
		nextPhase,
		updateTeamCount,
		teamSize,
		updateTeamSize,
		randomizeTeams,
		updateRandomizeTeams,
	} = useMatch();

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		nextPhase();
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
					<SLSelect
						label="Número times: "
						defaultValue={teamCount}
						onChange={handleTeamCountChange}
					>
						<option value={1}>1 time</option>
						<option value={2}>2 times</option>
					</SLSelect>
				</p>

				<p className={styles.formRow}>
					<SLInput
						label="Tamanho time: "
						type="number"
						min={1}
						max={5}
						defaultValue={teamSize}
						onChange={handleTeamSizeChange}
					/>
				</p>

				{teamCount === 2 && (
					<div className={styles.formRow}>
						<label>
							<span>Sortear distribuição jogadores&nbsp;</span>
							<Switch
								defaultChecked={randomizeTeams}
								onChange={updateRandomizeTeams}
							/>
						</label>
					</div>
				)}
			</fieldset>

			<SLButton type="submit">Iniciar</SLButton>
		</form>
	);
};
