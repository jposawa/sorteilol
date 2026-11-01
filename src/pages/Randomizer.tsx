import React from "react";
import { GiCrossedSwords } from "react-icons/gi";
import {
  MdAdd,
  MdCasino,
  MdCheckCircle,
  MdDownload,
  MdGroups,
  MdRestartAlt,
  MdShield,
  MdShuffle,
  MdTune,
} from "react-icons/md";
import clsx from "clsx";

import { LaneIcon, SLInput } from "@/components";
import { ALL_LANES } from "@/constants";
import { getChampionPortraitUrl, loadStorage } from "@/helpers";
import { filterChampByLane } from "@/helpers/filterChampByLane";
import { type DrawSeedRecord } from "@/helpers/random";
import { useDraftSession, useMatch } from "@/hooks";
import { Lane, type PlayerResult, TeamKey } from "@/types";

import styles from "./Randomizer.module.css";

type LaneMeta = {
  chipLabel: string;
  slotLabel: string;
  caption: string;
};

const LANE_META: Record<Lane, LaneMeta> = {
  [Lane.Top]: { chipLabel: "Top", slotLabel: "Top Lane", caption: "Top Lane" },
  [Lane.Jungle]: { chipLabel: "Jungle", slotLabel: "Jungle", caption: "Selva" },
  [Lane.Mid]: {
    chipLabel: "Mid",
    slotLabel: "Mid Lane",
    caption: "Rota do Meio",
  },
  [Lane.ADC]: { chipLabel: "ADC", slotLabel: "Bot / ADC", caption: "Atirador" },
  [Lane.Support]: {
    chipLabel: "Suporte",
    slotLabel: "Suporte",
    caption: "Guardião",
  },
};

const CLASS_TAGS = [
  "Magos",
  "Lutadores",
  "Tanques",
  "Assassinos",
  "Atiradores",
  "Encantadores",
];

const LANE_ORDER = ALL_LANES;

const synergyOf = (results: PlayerResult[]): number | null => {
  if (results.length === 0) {
    return null;
  }

  const fitting = results.filter(
    (result) => result.champion.primaryLane === result.lane,
  );

  return (fitting.length / results.length) * 100;
};

const sortByLane = (results: PlayerResult[]) =>
  [...results].sort(
    (a, b) => LANE_ORDER.indexOf(a.lane) - LANE_ORDER.indexOf(b.lane),
  );

type SlotEntry = {
  result: PlayerResult;
  realIndex: number;
};

type SlotActionProps = {
  title: string;
  disabled?: boolean;
  errorMessage?: boolean;
  onClick: () => void;
};

const SlotAction: React.FC<SlotActionProps> = ({
  title,
  disabled = false,
  errorMessage = false,
  onClick,
}) => (
  <button
    type="button"
    className={clsx(styles.slotAction, errorMessage && styles.slotActionError)}
    title={title}
    disabled={disabled}
    onClick={onClick}
  >
    {errorMessage ? <MdShuffle size={17} /> : <MdCasino size={17} />}
  </button>
);

type TeamCardProps = {
  teamKey: TeamKey;
  title: string;
  subtitle: string;
  entries: SlotEntry[];
  slotSize: number;
  synergyValue: string | null;
  rerollsLeftForSlot: (teamKey: TeamKey, index: number) => number;
  maxRolls: number;
  onRerollChampion: (teamKey: TeamKey, index: number) => void;
  onRerollLane: (teamKey: TeamKey, index: number) => void;
  onRerollTeam: (teamKey: TeamKey) => void;
};

const TeamCard: React.FC<TeamCardProps> = ({
  teamKey,
  title,
  subtitle,
  entries,
  slotSize,
  synergyValue,
  rerollsLeftForSlot,
  maxRolls,
  onRerollChampion,
  onRerollLane,
  onRerollTeam,
}) => {
  const isAlpha = teamKey === TeamKey.TeamA;

  return (
    <article
      className={clsx(
        styles.teamCard,
        isAlpha ? styles.teamCardAlpha : styles.teamCardOmega,
      )}
    >
      <span className={styles.teamGlow} aria-hidden="true" />

      <header
        className={clsx(
          styles.teamHead,
          isAlpha ? styles.teamHeadAlpha : styles.teamHeadOmega,
        )}
      >
        <div className={styles.teamIdentity}>
          {isAlpha ? (
            <MdShield size={24} className={styles.teamIdentityIcon} />
          ) : (
            <GiCrossedSwords size={24} className={styles.teamIdentityIcon} />
          )}
          <div>
            <h3
              className={clsx(
                styles.teamTitle,
                isAlpha ? styles.teamTitleAlpha : styles.teamTitleOmega,
              )}
            >
              {title}
            </h3>
            <span className={styles.teamSub}>{subtitle}</span>
          </div>
        </div>

        <div className={styles.teamMeta}>
          <div className={styles.teamSynergy}>
            <span className={styles.teamSynergyLabel}>Taxa de Sinergia</span>
            <span
              className={clsx(
                styles.teamSynergyValue,
                isAlpha ? styles.teamSynergyAlpha : styles.teamSynergyOmega,
              )}
            >
              {synergyValue ?? "—"}
            </span>
          </div>

          <button
            type="button"
            className={clsx(
              styles.teamRerollBtn,
              isAlpha ? styles.teamRerollAlpha : styles.teamRerollOmega,
            )}
            title="Re-rolar time inteiro"
            disabled={entries.length === 0}
            onClick={() => onRerollTeam(teamKey)}
          >
            <MdRestartAlt size={20} />
          </button>
        </div>
      </header>

      <ul className={styles.slotList}>
        {Array.from({ length: slotSize }, (_, slotIndex) => {
          const entry = entries[slotIndex];

          if (!entry) {
            return (
              <li key={`ghost-${slotIndex}`} className={styles.slot}>
                <div className={styles.slotGhost}>
                  <span className={styles.slotGhostPortrait} aria-hidden="true">
                    ?
                  </span>
                  <span className={styles.slotGhostLabel}>
                    Slot livre — aguardando sorteio
                  </span>
                </div>
              </li>
            );
          }

          const { result, realIndex } = entry;
          const rollsLeft = rerollsLeftForSlot(teamKey, realIndex);
          const laneMeta = LANE_META[result.lane];

          return (
            <li key={realIndex} className={styles.slot}>
              <div className={styles.slotInfo}>
                <img
                  className={styles.slotPortrait}
                  src={getChampionPortraitUrl(result.champion.key)}
                  alt={result.champion.name}
                  loading="lazy"
                />
                <div className={styles.slotTexts}>
                  <span
                    className={clsx(
                      styles.slotLane,
                      isAlpha ? styles.slotLaneAlpha : styles.slotLaneOmega,
                    )}
                  >
                    <LaneIcon iconName={result.lane} size="0.9rem" />
                    {laneMeta.slotLabel}
                  </span>
                  <h4 className={styles.slotChampion}>
                    {result.champion.name}
                  </h4>
                  <span
                    className={clsx(
                      styles.slotSummoner,
                      isAlpha ? null : styles.slotSummonerOmega,
                    )}
                  >
                    Invocador: {result.name}
                  </span>
                </div>
              </div>

              <div className={styles.slotActions}>
                <SlotAction
                  title={`Reroll campeão · ${rollsLeft} de ${maxRolls} disponíveis`}
                  disabled={rollsLeft <= 0}
                  onClick={() => onRerollChampion(teamKey, realIndex)}
                />
                <SlotAction
                  title={`Reroll rota/posição · ${rollsLeft} de ${maxRolls} disponíveis`}
                  disabled={rollsLeft <= 0}
                  errorMessage
                  onClick={() => onRerollLane(teamKey, realIndex)}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </article>
  );
};

export const Randomizer: React.FC = () => {
  const {
    teamCount,
    teamSize,
    updateTeamCount,
    randomizeTeams,
    updateRandomizeTeams,
    maxDrawRolls,
    playerNames,
    teamRegistry,
    updatePlayerName,
    updateFlatPlayerName,
    assignMode,
    setAssignMode,
    enabledLanes,
    toggleLane,
    drawEverything,
    rerollChampionForPlayer,
    rerollSlotLane,
    rerollTeamRoster,
  } = useMatch();

  const { createSessionWithPicks, setAppScreen } = useDraftSession();

  const [isDrawing, setIsDrawing] = React.useState(false);
  const [slotRolls, setSlotRolls] = React.useState<Record<string, number>>({});
  const [drandRound, setDrandRound] = React.useState<number | null>(() => {
    const record = loadStorage("drand-draw", { needParse: true }) as
      | DrawSeedRecord
      | null;

    return record && typeof record.round === "number" ? record.round : null;
  });

  const activeChampionCount = React.useMemo(() => {
    const keys = new Set<string>();

    enabledLanes.forEach((lane) => {
      filterChampByLane(lane).forEach((champion) => keys.add(champion.key));
    });

    return keys.size;
  }, [enabledLanes]);

  const isFlat = teamCount === 2 && randomizeTeams;
  const rosterA = teamRegistry.teamA;
  const rosterB = teamRegistry.teamB;
  const expectedSlotsPerTeam = Math.max(teamSize, 1);
  const hasFullRoster =
    rosterA.length >= expectedSlotsPerTeam &&
    (teamCount === 1 || rosterB.length >= expectedSlotsPerTeam);

  const synergyA = React.useMemo(() => synergyOf(rosterA), [rosterA]);
  const synergyB = React.useMemo(
    () => (teamCount === 2 ? synergyOf(rosterB) : null),
    [rosterB, teamCount],
  );
  const synergyDelta = React.useMemo(() => {
    if (synergyA === null || synergyB === null) {
      return null;
    }

    const delta = synergyA - synergyB;

    return `${delta >= 0 ? "+" : "−"}${Math.abs(delta).toFixed(1)}%`;
  }, [synergyA, synergyB]);

  const filledSlots = rosterA.length + (teamCount === 2 ? rosterB.length : 0);

  const rerollsLeftForSlot = (teamKey: TeamKey, index: number): number => {
    const spent = slotRolls[`${teamKey}-${index}`] ?? 0;

    return Math.max(maxDrawRolls - spent, 0);
  };

  const spendSlotRoll = (teamKey: TeamKey, index: number) => {
    setSlotRolls((prev) => ({
      ...prev,
      [`${teamKey}-${index}`]: (prev[`${teamKey}-${index}`] ?? 0) + 1,
    }));
  };

  const refreshDrandRound = () => {
    const record = loadStorage("drand-draw", { needParse: true }) as
      | DrawSeedRecord
      | null;

    setDrandRound(
      record && typeof record.round === "number" ? record.round : null,
    );
  };

  const handleDrawAll = async () => {
    if (isDrawing) {
      return;
    }

    setIsDrawing(true);
    setSlotRolls({});

    try {
      await drawEverything();
      refreshDrandRound();
    } finally {
      setIsDrawing(false);
    }
  };

  const exportToDraftRoom = () => {
    if (!hasFullRoster) {
      return;
    }

    const picks = [
      ...rosterA.map((result) => ({
        side: TeamKey.TeamA,
        lane: result.lane,
        championKey: result.champion.key,
      })),
      ...rosterB.map((result) => ({
        side: TeamKey.TeamB,
        lane: result.lane,
        championKey: result.champion.key,
      })),
    ];

    createSessionWithPicks(
      1,
      picks,
      teamCount === 2
        ? { teamA: "Time Alpha", teamB: "Time Omega" }
        : { teamA: "Roster Solo" },
    );
    setAppScreen("sessions");
  };

  const flatPlayerNames = React.useMemo(
    () => [...playerNames.teamA, ...playerNames.teamB],
    [playerNames],
  );

  const renderRegistryGroup = (
    groupKey: string,
    title: string,
    teamKey: TeamKey,
    source: string[],
    inputCount: number,
    flat: boolean,
  ) => {
    const handleName = (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
      if (flat) {
        updateFlatPlayerName(index, event.target.value);

        return;
      }

      updatePlayerName({ teamKey, index, name: event.target.value });
    };

    return (
      <div className={styles.registryGroup} key={groupKey}>
        <span className={styles.registryGroupTitle}>{title}</span>
        <ol className={styles.registryList}>
          {Array.from({ length: inputCount }, (_, index) => (
            <li key={index} className={styles.registryRow}>
              <span className={styles.registryIndex}>{index + 1}</span>
              <SLInput
                className={styles.registryInput}
                value={source[index] ?? ""}
                placeholder={`Jogador ${index + 1}`}
                onChange={handleName(index)}
              />
            </li>
          ))}
        </ol>
      </div>
    );
  };

  const registryGroups = isFlat
    ? [
        renderRegistryGroup(
          "flat",
          "Invocadores sorteados entre os dois times",
          TeamKey.TeamA,
          flatPlayerNames,
          expectedSlotsPerTeam * 2,
          true,
        ),
      ]
    : [
        renderRegistryGroup(
          "alpha",
          teamCount === 2 ? "Time Alpha" : "Invocadores",
          TeamKey.TeamA,
          playerNames.teamA,
          expectedSlotsPerTeam,
          false,
        ),
        ...(teamCount === 2
          ? [
              renderRegistryGroup(
                "omega",
                "Time Omega",
                TeamKey.TeamB,
                playerNames.teamB,
                expectedSlotsPerTeam,
                false,
              ),
            ]
          : []),
      ];

  const teamEntries = (teamKey: TeamKey): SlotEntry[] => {
    const results = teamRegistry[teamKey];

    return sortByLane(results).map((result) => ({
      result,
      realIndex: results.indexOf(result),
    }));
  };

  const entropyText = [
    teamCount === 2
      ? `Modo ${randomizeTeams ? "2-Times Duelo · invocadores embaralhados" : "2-Times Duelo"} Ativo.`
      : "Modo 1-Time Roster Ativo.",
    hasFullRoster
      ? `${filledSlots} Slots de rota atribuídos.`
      : `${filledSlots} slots preenchidos.`,
    synergyDelta ? `Balanço de Sinergia Delta: ${synergyDelta}.` : null,
    `Rerolls Disponíveis: ${maxDrawRolls} por slot.`,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={styles.randomizer}>
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.heroTitleRow}>
            <h1 className={styles.heroTitle}>Hextech Randomizer</h1>
            <span className={styles.heroBadge}>Pro Ecosystem v2.5</span>
          </div>
          <p className={styles.heroSubtitle}>
            Motor competitivo de sorteio balanceado, atribuição tática de rotas
            e calibração de sinergia.
          </p>
        </div>

        <div className={styles.heroActions}>
          <button
            type="button"
            className={styles.exportBtn}
            title={
              hasFullRoster
                ? "Criar sessão Bo1 com os picks já preenchidos"
                : "Sorteie o roster para exportar"
            }
            disabled={!hasFullRoster}
            onClick={exportToDraftRoom}
          >
            <MdDownload size={16} />
            Exportar para Sala de Draft
          </button>

          <button
            type="button"
            className={styles.drawAllBtn}
            onClick={handleDrawAll}
            disabled={isDrawing}
          >
            <MdRestartAlt size={18} />
            {isDrawing ? "Sorteando…" : "Sortear Tudo"}
          </button>
        </div>
      </header>

      <div className={styles.controlsGrid}>
        <article className={clsx(styles.panel, styles.formatPanel)}>
          <header className={styles.panelHead}>
            <span className={styles.panelHeadTitle}>
              <MdGroups size={16} />
              Formato &amp; Times
            </span>
            <span className={styles.panelHeadAside}>1 / 2 / 4 Times</span>
          </header>

          <div className={styles.formatRow}>
            <button
              type="button"
              className={clsx(
                styles.formatCard,
                teamCount === 1 && styles.formatCardActive,
              )}
              disabled={isDrawing}
              onClick={() => updateTeamCount(1)}
            >
              1 Time
              <span
                className={
                  teamCount === 1
                    ? clsx(styles.formatCardSub, styles.formatCardSubActive)
                    : styles.formatCardSub
                }
              >
                Solo Roster
              </span>
            </button>

            <button
              type="button"
              className={clsx(
                styles.formatCard,
                teamCount === 2 && styles.formatCardActive,
              )}
              disabled={isDrawing}
              onClick={() => updateTeamCount(2)}
            >
              2 Times
              <span
                className={
                  teamCount === 2
                    ? clsx(styles.formatCardSub, styles.formatCardSubActive)
                    : styles.formatCardSub
                }
              >
                Duelo Alpha vs Omega
              </span>
            </button>

            <button
              type="button"
              className={styles.formatCard}
              disabled
              title="Torneio bracket — em breve"
            >
              4 Times
              <span className={styles.formatCardSub}>Torneio Bracket</span>
            </button>
          </div>

          <div className={styles.logicGroup}>
            <span className={styles.panelLabel}>Atribuição de Lógica</span>
            <div className={styles.logicRow}>
              <button
                type="button"
                className={clsx(
                  styles.logicCard,
                  assignMode === "fixed" && styles.logicCardActive,
                )}
                disabled={isDrawing}
                onClick={() => setAssignMode("fixed")}
              >
                <span>Rotas fixas (5 lanes)</span>
                {assignMode === "fixed" && (
                  <MdCheckCircle size={14} aria-hidden="true" />
                )}
              </button>

              <button
                type="button"
                className={clsx(
                  styles.logicCard,
                  assignMode === "random" && styles.logicCardActive,
                )}
                disabled={isDrawing}
                onClick={() => setAssignMode("random")}
              >
                <span>Total aleatório</span>
                {assignMode === "random" && (
                  <MdCheckCircle size={14} aria-hidden="true" />
                )}
              </button>
            </div>

            {teamCount === 2 && (
              <label className={styles.shuffleSwitchRow}>
                <span className={styles.shuffleSwitchLabel}>
                  Embaralhar invocadores entre os times (drand)
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={randomizeTeams}
                  className={clsx(
                    styles.switchTrack,
                    randomizeTeams && styles.switchTrackOn,
                  )}
                  disabled={isDrawing}
                  onClick={() => updateRandomizeTeams(!randomizeTeams)}
                >
                  <span
                    className={clsx(
                      styles.switchDot,
                      randomizeTeams && styles.switchDotOn,
                    )}
                  />
                </button>
              </label>
            )}
          </div>
        </article>

        <article className={clsx(styles.panel, styles.filtersPanel)}>
          <header className={styles.panelHead}>
            <span className={styles.panelHeadTitle}>
              <MdTune size={16} />
              Filtros de Campeões (Por Rota &amp; Classe)
            </span>
            <span className={clsx(styles.panelHeadAside, styles.panelHeadAsidePrimary)}>
              {activeChampionCount} Campeões Ativos
            </span>
          </header>

          <div>
            <span className={styles.panelLabel}>Rotas Oficiais Habilitadas</span>
            <div className={styles.chipRow}>
              {LANE_ORDER.map((lane) => {
                const enabled = enabledLanes.includes(lane);
                const meta = LANE_META[lane];

                return (
                  <button
                    key={lane}
                    type="button"
                    className={clsx(
                      styles.laneChip,
                      enabled ? styles.laneChipOn : styles.laneChipOff,
                    )}
                    title={
                      enabled
                        ? "Desabilitar rota no sorteio aleatório"
                        : "Habilitar rota no sorteio aleatório"
                    }
                    disabled={isDrawing}
                    onClick={() => toggleLane(lane)}
                  >
                    <LaneIcon iconName={lane} size="0.8rem" />
                    {meta.chipLabel}
                    <span className={styles.laneChipCaption}>
                      ({meta.caption})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className={styles.panelLabel}>
              Classes &amp; Arquétipos Permitidos
            </span>
            <div className={styles.chipRow}>
              {CLASS_TAGS.map((tag) => (
                <span key={tag} className={styles.classChip}>
                  {tag}
                </span>
              ))}
              <button
                type="button"
                className={styles.customChip}
                title="Filtros customizados por classe — em breve"
                disabled
              >
                <MdAdd size={13} />
                Filtro Custom
              </button>
            </div>
          </div>
        </article>
      </div>

      <section className={styles.registryCard}>
        <header className={styles.panelHead}>
          <span className={styles.panelHeadTitle}>
            <MdGroups size={16} />
            Registro de Invocadores
          </span>
          <span className={styles.panelHeadAside}>
            {isFlat
              ? "Distribuição embaralhada no sorteio"
              : teamCount === 2
                ? `${expectedSlotsPerTeam} slots por time`
                : `${expectedSlotsPerTeam} slots`}
          </span>
        </header>

        <div className={styles.registryCols}>{registryGroups}</div>
      </section>

      <div className={styles.teamsGrid}>
        <TeamCard
          teamKey={TeamKey.TeamA}
          title="Time Alpha"
          subtitle={
            teamCount === 1
              ? "Lado azul // Roster solo"
              : "Lado azul // Modo competitivo"
          }
          entries={teamEntries(TeamKey.TeamA)}
          slotSize={expectedSlotsPerTeam}
          synergyValue={
            synergyA === null ? null : `${synergyA.toFixed(1)}%`
          }
          rerollsLeftForSlot={rerollsLeftForSlot}
          maxRolls={maxDrawRolls}
          onRerollChampion={(teamKey, index) => {
            if (rerollsLeftForSlot(teamKey, index) <= 0) {
              return;
            }

            spendSlotRoll(teamKey, index);
            rerollChampionForPlayer(teamKey, index);
          }}
          onRerollLane={(teamKey, index) => {
            if (rerollsLeftForSlot(teamKey, index) <= 0) {
              return;
            }

            spendSlotRoll(teamKey, index);
            rerollSlotLane(teamKey, index);
          }}
          onRerollTeam={(teamKey) => rerollTeamRoster(teamKey)}
        />

        {teamCount === 2 && (
          <TeamCard
            teamKey={TeamKey.TeamB}
            title="Time Omega"
            subtitle="Lado vermelho // Modo competitivo"
            entries={teamEntries(TeamKey.TeamB)}
            slotSize={expectedSlotsPerTeam}
            synergyValue={
              synergyB === null ? null : `${synergyB.toFixed(1)}%`
            }
            rerollsLeftForSlot={rerollsLeftForSlot}
            maxRolls={maxDrawRolls}
            onRerollChampion={(teamKey, index) => {
              if (rerollsLeftForSlot(teamKey, index) <= 0) {
                return;
              }

              spendSlotRoll(teamKey, index);
              rerollChampionForPlayer(teamKey, index);
            }}
            onRerollLane={(teamKey, index) => {
              if (rerollsLeftForSlot(teamKey, index) <= 0) {
                return;
              }

              spendSlotRoll(teamKey, index);
              rerollSlotLane(teamKey, index);
            }}
            onRerollTeam={(teamKey) => rerollTeamRoster(teamKey)}
          />
        )}
      </div>

      <footer className={styles.entropyBar}>
        <p className={styles.entropyText}>
          <span className={styles.entropyLabel}>Hextech Entropy Matrix:</span>
          {entropyText}
        </p>

        <span className={styles.syncStatus}>
          <i className={styles.syncDot} aria-hidden="true" />
          {drandRound !== null
            ? `Sync drand rodada #${drandRound} online`
            : "Sync entropia local online"}
        </span>
      </footer>

      <button
        type="button"
        className={styles.fab}
        title="Sortear tudo novamente"
        disabled={isDrawing}
        onClick={handleDrawAll}
      >
        <MdRestartAlt size={26} />
      </button>
    </section>
  );
};