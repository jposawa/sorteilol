import React from "react";
import clsx from "clsx";

import { useMatch } from "@/hooks";
import { TeamKey } from "@/types";

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
		updateFlatPlayerName,
		updatePlayerName,
	} = useMatch();
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
			<fieldset className={styles.formField}>
				<legend>Configuração da Partida</legend>

				<p className="config-row">
					<label>
						Número de times
						<select
							value={teamCount}
							onChange={(e) => updateTeamCount(Number(e.target.value) as 1 | 2)}
						>
							<option value={1}>1 time</option>
							<option value={2}>2 times</option>
						</select>
					</label>
				</p>

				<div className="config-row">
					<label htmlFor="team-size">Jogadores por time</label>
					<input
						id="team-size"
						type="number"
						min={1}
						max={5}
						value={teamSize}
						onChange={(e) => updateTeamSize(Number(e.target.value))}
					/>
				</div>

				{teamCount === 2 && (
					<div className="config-row">
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

			{teamCount === 2 && randomizeTeams ? (
				<fieldset className="players-fieldset">
					<legend>Jogadores (times definidos no sorteio)</legend>
					<ol className="player-list">
						{playerNames.teamA.map((name, i) => (
							<li key={i}>
								<label htmlFor={`player-flat-${i}`}>Jogador {i + 1}</label>
								<input
									id={`player-flat-${i}`}
									type="text"
									className="player-input"
									placeholder={`Jogador ${i + 1}`}
									value={name}
									onChange={(e) => updateFlatPlayerName(i, e.target.value)}
								/>
							</li>
						))}
					</ol>
				</fieldset>
			) : (
				<>
					<fieldset className="players-fieldset">
						<legend>{teamCount === 2 ? "Time A" : "Jogadores"}</legend>
						<ol className="player-list">
							{playerNames.teamA.map((name, i) => (
								<li key={i}>
									<label htmlFor={`player-a-${i}`}>Jogador {i + 1}</label>
									<input
										id={`player-a-${i}`}
										type="text"
										className="player-input"
										placeholder={`Jogador ${i + 1}`}
										value={name}
										onChange={(e) =>
											updatePlayerName(TeamKey.TeamA, i, e.target.value)
										}
									/>
								</li>
							))}
						</ol>
					</fieldset>

					{teamCount === 2 && (
						<fieldset className="players-fieldset">
							<legend>Time B</legend>
							<ol className="player-list">
								{playerNames.teamB.map((name, i) => (
									<li key={i}>
										<label htmlFor={`player-b-${i}`}>Jogador {i + 1}</label>
										<input
											id={`player-b-${i}`}
											type="text"
											className="player-input"
											placeholder={`Jogador ${i + 1}`}
											value={name}
											onChange={(e) =>
												updatePlayerName(TeamKey.TeamB, i, e.target.value)
											}
										/>
									</li>
								))}
							</ol>
						</fieldset>
					)}
				</>
			)}

			<button type="submit" className="sortear-btn">
				Iniciar Sorteio
			</button>
		</form>
	);
};
