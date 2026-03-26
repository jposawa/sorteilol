import React from "react";
import { Slider, Switch } from "antd";
import clsx from "clsx";

import { SLButton, SLInput, SLSelect } from "@/components";
import { BASE_MAX_DRAW_ROLLS } from "@/constants";
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
    maxDrawRolls,
    setMaxDrawRolls,
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

  const handleMaxDrawRollsChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const newMax = Number(event.target.value ?? BASE_MAX_DRAW_ROLLS);

    setMaxDrawRolls(newMax);
  };

  return (
    <form
      className={clsx(styles.form, className)}
      onSubmit={handleSubmit}
      style={style}
    >
      <fieldset className={styles.formField}>
        <legend>
          <h3>Configuração da Partida</h3>
        </legend>

        <div className={styles.formRow}>
          <SLSelect
            label="Número times: "
            defaultValue={teamCount}
            onChange={handleTeamCountChange}
          >
            <option value={1}>1 time</option>
            <option value={2}>2 times</option>
          </SLSelect>
        </div>

        <div className={styles.formRow}>
          <label>
            <span>Tamanho do time: </span>
            <span className={styles.horizontalGroup}>
              <Slider
                min={1}
                max={5}
                value={teamSize}
                onChange={(value) => updateTeamSize(value)}
              />
              <SLInput
                type="number"
                min={1}
                max={5}
                value={teamSize}
                onChange={handleTeamSizeChange}
              />
            </span>
          </label>
        </div>

        <div className={styles.formRow}>
          <SLInput
            label="Limite rerolls: "
            type="number"
            min={0}
            defaultValue={maxDrawRolls}
            onChange={handleMaxDrawRollsChange}
          />
        </div>

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
