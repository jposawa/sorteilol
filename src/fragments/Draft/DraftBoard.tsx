import React from "react";
import { MdLock, MdLockClock, MdSwapHoriz } from "react-icons/md";
import clsx from "clsx";

import { LaneIcon, SLButton, SLInput } from "@/components";
import {
  ALL_LANES,
  CHAMPION_CLASSES,
  CHAMPIONS,
  TOTAL_BANS,
} from "@/constants";
import { getChampionCardArtUrl, getChampionPortraitUrl } from "@/helpers";
import { championKeysUsedInGame, draftCountersOf, draftTurnOf } from "@/helpers/draftGame";
import {
  type ChampionClass,
  type DraftGame,
  Lane,
  TeamKey,
} from "@/types";

import styles from "./Draft.module.css";

type SelectedSlot = {
  side: TeamKey;
  lane: Lane;
};

const FALLBACK_LABELS: Record<TeamKey, string> = {
  [TeamKey.TeamA]: "Time A",
  [TeamKey.TeamB]: "Time B",
};

const SIDE_NAMES: Record<TeamKey, string> = {
  [TeamKey.TeamA]: "Lado Azul",
  [TeamKey.TeamB]: "Lado Vermelho",
};

const SIDE_BADGES: Record<TeamKey, string> = {
  [TeamKey.TeamA]: "Azul",
  [TeamKey.TeamB]: "Vermelho",
};

const LANE_ABBR: Record<Lane, string> = {
  [Lane.Top]: "TOP",
  [Lane.Jungle]: "JG",
  [Lane.Mid]: "MID",
  [Lane.ADC]: "ADC",
  [Lane.Support]: "SUP",
};

const LANE_LABEL_PT: Record<Lane, string> = {
  [Lane.Top]: "Topo",
  [Lane.Jungle]: "Selva",
  [Lane.Mid]: "Meio",
  [Lane.ADC]: "Bot",
  [Lane.Support]: "Suporte",
};

const SIDE_ORDER: TeamKey[] = [TeamKey.TeamA, TeamKey.TeamB];

/** Tempo (em segundos) por pick antes de pular a vez automaticamente. */
const PICK_CLOCK_SECONDS = 30;

const formatPickClock = (seconds: number) =>
  `0:${String(seconds).padStart(2, "0")}`;

export interface DraftBoardProps {
  title: string;
  subtitle?: string;
  /** Rótulos por lado — nomes reais das equipes (Randomizer ou competição). */
  sideLabels?: Partial<Record<TeamKey, string>>;
  /** Vitórias encerradas na série, para o placar do topo. */
  score?: Partial<Record<TeamKey, number>>;
  /** Pool fearless EXTERNO à partida (picks de games/matches anteriores). */
  lockedKeys: Set<string>;
  draftGame: DraftGame;
  /** Resultado já definido: o draft fica somente-exibição. */
  hasResult: boolean;
  onLeave: () => void;
  onBan: (championKey: string) => void;
  onSkipTurn: () => void;
  onPick: (side: TeamKey, lane: Lane, championKey: string | null) => void;
  /** Troca os campeões de duas rotas do MESMO time (ajuste pós-pick). */
  onSwapPicks: (side: TeamKey, fromLane: Lane, toLane: Lane) => void;
  /** Move o campeão de uma rota para outra vazia do mesmo time. */
  onMovePick: (side: TeamKey, fromLane: Lane, toLane: Lane) => void;
  onFinish: (winner: TeamKey | null) => void;
}

export const DraftBoard: React.FC<DraftBoardProps> = ({
  title,
  subtitle,
  sideLabels,
  score,
  lockedKeys,
  draftGame,
  hasResult,
  onLeave,
  onBan,
  onSkipTurn,
  onPick,
  onSwapPicks,
  onMovePick,
  onFinish,
}) => {
  const [selectedSlot, setSelectedSlot] = React.useState<SelectedSlot | null>(
    null,
  );
  const [selectedChampionKey, setSelectedChampionKey] = React.useState<
    string | null
  >(null);
  /** Slot de origem de uma troca entre rotas do mesmo time (pick clicado). */
  const [swapSource, setSwapSource] = React.useState<SelectedSlot | null>(null);
  const [laneFilter, setLaneFilter] = React.useState<"All" | Lane>("All");
  const [classFilter, setClassFilter] = React.useState<ChampionClass | null>(
    null,
  );
  const [scopeFilter, setScopeFilter] = React.useState<
    "all" | "available" | "locked"
  >("all");
  const [nameSearch, setNameSearch] = React.useState("");

  const turn = draftTurnOf(draftGame);
  const turnCounter = draftCountersOf(draftGame);
  const isBanPhase = turn.kind === "ban";
  const isPickPhase = turn.kind === "pick";
  const isReadyToFinish = turn.kind === "ready";
  const isReadOnly = hasResult;

  /**
   * Timer de 30s por pick: reinicia a cada turno da agenda; ao zerar o pick
   * é pulado automaticamente (a vez passa sem campeão). O reset do clock
   * acontece DURANTE o render (padrão "derivar estado do turno"), evitando
   * cascata de renders que o React Compiler aponta em effects.
   */
  const [pickClock, setPickClock] = React.useState(PICK_CLOCK_SECONDS);
  const [timedTurnKey, setTimedTurnKey] = React.useState<number | null>(null);
  const turnKeyNow =
    turn.kind === "pick" && !isReadOnly ? draftGame.turnIndex : null;

  if (turnKeyNow !== null && turnKeyNow !== timedTurnKey) {
    setTimedTurnKey(turnKeyNow);
    setPickClock(PICK_CLOCK_SECONDS);
  }

  React.useEffect(() => {
    if (turn.kind !== "pick" || isReadOnly) {
      return;
    }

    const timerId = window.setInterval(() => {
      setPickClock((prev: number) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [draftGame.turnIndex, isReadOnly, turn.kind, timedTurnKey]);

  React.useEffect(() => {
    if (isReadOnly || turn.kind !== "pick" || pickClock > 0) {
      return;
    }

    onSkipTurn();
  }, [isReadOnly, onSkipTurn, pickClock, turn.kind]);

  /**
   * Auto-seleção do pick quando a vez muda de lado: o primeiro slot de rota
   * livre do time da vez já fica selecionado — basta escolher o campeão.
   * Também disparado durante o render (estado derivado do turno).
   */
  const [autoTurnKey, setAutoTurnKey] = React.useState<number | null>(null);
  const autoKeyNow =
    turn.kind === "pick" && !isReadOnly ? draftGame.turnIndex : null;

  if (turn.kind === "pick" && !isReadOnly && autoKeyNow !== autoTurnKey) {
    const emptyLane = ALL_LANES.find(
      (lane) => !draftGame.picks[turn.side][lane],
    );

    setAutoTurnKey(autoKeyNow);

    if (emptyLane) {
      setSelectedSlot({ side: turn.side, lane: emptyLane });
      setSelectedChampionKey(null);
    }
  }

  const usedInGameKeys = championKeysUsedInGame(draftGame);
  const poolTotal = Object.keys(CHAMPIONS).length;
  const lockedCount = lockedKeys.size;

  const pickedCount = SIDE_ORDER.flatMap((side) =>
    ALL_LANES.map((lane) => draftGame.picks[side][lane]),
  ).filter(Boolean).length;

  const sideLabelOf = (side: TeamKey) =>
    sideLabels?.[side] ?? FALLBACK_LABELS[side];

  const scoreOf = (side: TeamKey) => score?.[side] ?? 0;

  const championList = React.useMemo(() => {
    const normalizedSearch = nameSearch.trim().toLowerCase();

    return Object.values(CHAMPIONS).filter((champion) => {
      const matchesLane =
        laneFilter === "All" ||
        champion.primaryLane === laneFilter ||
        champion.secondaryLane === laneFilter;

      const matchesClass =
        !classFilter || champion.classes.includes(classFilter);

      const matchesSearch =
        !normalizedSearch ||
        champion.name.toLowerCase().includes(normalizedSearch) ||
        champion.classes.some((candidate) =>
          candidate.toLowerCase().includes(normalizedSearch),
        );

      const isUnavailable =
        lockedKeys.has(champion.key) || usedInGameKeys.has(champion.key);

      const matchesScope =
        scopeFilter === "all" ||
        (scopeFilter === "available" && !isUnavailable) ||
        (scopeFilter === "locked" && isUnavailable);

      return matchesLane && matchesClass && matchesSearch && matchesScope;
    });
  }, [laneFilter, classFilter, nameSearch, scopeFilter, lockedKeys, usedInGameKeys]);

  const availableAll = React.useMemo(() => {
    return Object.values(CHAMPIONS).filter(
      (champion) =>
        !lockedKeys.has(champion.key) && !usedInGameKeys.has(champion.key),
    ).length;
  }, [lockedKeys, usedInGameKeys]);

  const championIsDisabled = (championKey: string) => {
    if (isReadOnly || lockedKeys.has(championKey)) {
      return true;
    }

    if (isBanPhase && turn.kind === "ban") {
      return usedInGameKeys.has(championKey);
    }

    if (!isPickPhase) {
      return true;
    }

    const currentPick = selectedSlot
      ? draftGame.picks[selectedSlot.side][selectedSlot.lane]
      : null;

    return usedInGameKeys.has(championKey) && currentPick !== championKey;
  };

  const handleChampionClick = (championKey: string) => {
    if (championIsDisabled(championKey)) {
      return;
    }

    if (isBanPhase && turn.kind === "ban") {
      onBan(championKey);
      return;
    }

    if (isPickPhase && selectedSlot) {
      setSelectedChampionKey((prev) => (prev === championKey ? null : championKey));
    }
  };

  const confirmSelection = () => {
    if (!selectedSlot || !selectedChampionKey) {
      return;
    }

    onPick(selectedSlot.side, selectedSlot.lane, selectedChampionKey);
    setSelectedChampionKey(null);
    setSelectedSlot(null);
  };

  const ownerSide: TeamKey | null =
    isReadOnly || turn.kind === "ready"
      ? null
      : turn.side;

  const renderSideColumn = (side: TeamKey) => {
    const isTurnSide = turn.kind !== "ready" && turn.side === side;

    return (
      <article
        className={clsx(
          styles.sideColumn,
          side === TeamKey.TeamA ? styles.sideAlpha : styles.sideOmega,
          isTurnSide && styles.sideTurn,
        )}
      >
        <header
          className={clsx(
            styles.sideHeader,
            side === TeamKey.TeamA ? styles.sideHeaderAlpha : styles.sideHeaderOmega,
          )}
        >
          <h2
            className={clsx(
              styles.sideTitle,
              side === TeamKey.TeamA ? styles.sideTitleAlpha : styles.sideTitleOmega,
            )}
          >
            {sideLabelOf(side)}
          </h2>
          <span className={styles.sideSub}>{SIDE_NAMES[side]}</span>
        </header>

        <div className={styles.bansRow}>
          {draftGame.bans[side].map((bannedKey, index) => (
            <span
              key={index}
              className={clsx(
                styles.banCard,
                !bannedKey && styles.banCardEmpty,
              )}
            >
              {bannedKey ? (
                <img
                  className={styles.banCardImg}
                  src={getChampionPortraitUrl(bannedKey)}
                  alt={CHAMPIONS[bannedKey]?.name}
                  loading="lazy"
                />
              ) : (
                <span className={styles.banCardCross} aria-hidden="true">
                  ✕
                </span>
              )}
            </span>
          ))}
        </div>

        <ul className={styles.slotStack}>
          {ALL_LANES.map((lane) => {
            const championKey = draftGame.picks[side][lane];
            const isSelected =
              selectedSlot?.side === side && selectedSlot?.lane === lane;

            return (
              <li key={lane} className={styles.slotItem}>
                <button
                  type="button"
                  className={clsx(
                    styles.slot,
                    championKey && styles.slotFilled,
                    isSelected && styles.slotPicking,
                    swapSource?.side === side &&
                      swapSource?.lane === lane &&
                      styles.slotSwapSource,
                  )}
                  onClick={() => {
                    if (isReadOnly || !isPickPhase) {
                      return;
                    }

                    if (turn.kind === "pick" && turn.side !== side) {
                      return;
                    }

                    if (swapSource) {
                      const sameSide = swapSource.side === side;

                      if (!sameSide) {
                        // Clique no lado oposto cancela o modo troca (não
                        // trava a fila de picks do outro time).
                        setSwapSource(null);
                        setSelectedChampionKey(null);

                        return;
                      }

                      if (swapSource.lane === lane) {
                        setSwapSource(null);
                        setSelectedChampionKey(null);

                        return;
                      }

                      if (championKey) {
                        onSwapPicks(side, swapSource.lane, lane);
                      } else {
                        onMovePick(side, swapSource.lane, lane);
                      }

                      setSwapSource(null);
                      setSelectedChampionKey(null);

                      return;
                    }

                    if (championKey) {
                      setSwapSource({ side, lane });

                      return;
                    }

                    setSelectedSlot({ side, lane });
                    setSelectedChampionKey(null);
                  }}
                >
                    {championKey ? (
                      <>
                        <img
                          className={styles.slotPortrait}
                          src={getChampionCardArtUrl(championKey)}
                          alt={CHAMPIONS[championKey]?.name}
                          loading="eager"
                        />
                      <span className={styles.slotShade} aria-hidden="true" />
                      <span className={styles.slotText}>
                        <span
                          className={clsx(
                            styles.slotLane,
                            side === TeamKey.TeamA
                              ? styles.slotLaneAlpha
                              : styles.slotLaneOmega,
                          )}
                        >
                          <LaneIcon iconName={lane} size="0.75rem" />
                          {lane}
                        </span>
                        <span className={styles.slotChampion}>
                          {CHAMPIONS[championKey]?.name ?? championKey}
                        </span>
                      </span>
                    </>
                  ) : (
                    <>
                      {isSelected && (
                        <span
                          className={styles.slotHourglass}
                          aria-hidden="true"
                        >
                          ⧗
                        </span>
                      )}
                      <span
                        className={clsx(
                          styles.slotPlaceholder,
                          swapSource &&
                            swapSource.side === side &&
                            styles.slotSwapHint,
                        )}
                      >
                        {swapSource && swapSource.side === side
                          ? swapSource.lane === lane
                            ? "Trocando…"
                            : "Clique p/ trocar"
                          : isSelected
                            ? "Picking…"
                            : `${LANE_ABBR[lane]} Slot`}
                      </span>
                      <span className={styles.slotText}>
                        <span
                          className={clsx(
                            styles.slotLane,
                            side === TeamKey.TeamA
                              ? styles.slotLaneAlpha
                              : styles.slotLaneOmega,
                          )}
                        >
                          <LaneIcon iconName={lane} size="0.75rem" />
                          {lane}
                        </span>
                        {isSelected && (
                          <span className={clsx(styles.slotChampion, styles.slotPickingText)}>
                            Selecionado p/ pick
                          </span>
                        )}
                      </span>
                    </>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </article>
    );
  };

  return (
    <section className={styles.draftScreen}>
      <header className={styles.draftHeader}>
        <button type="button" className={styles.backBtn} onClick={onLeave}>
          ← Voltar
        </button>

        <div className={styles.scoreboard}>
          <div className={styles.scoreSide}>
            <span className={clsx(styles.scoreTeam, styles.scoreTeamAlpha)}>
              {sideLabelOf(TeamKey.TeamA)}
            </span>
            <span className={styles.scoreSideBadge}>Azul</span>
          </div>

          <div className={styles.scoreDigits}>
            <span className={clsx(styles.scoreDigit, styles.scoreDigitAlpha)}>
              {scoreOf(TeamKey.TeamA)}
            </span>
            <span className={styles.scoreColon}>:</span>
            <span className={clsx(styles.scoreDigit, styles.scoreDigitOmega)}>
              {scoreOf(TeamKey.TeamB)}
            </span>
          </div>

          <div className={styles.scoreSide}>
            <span className={clsx(styles.scoreTeam, styles.scoreTeamOmega)}>
              {sideLabelOf(TeamKey.TeamB)}
            </span>
            <span className={styles.scoreSideBadge}>Vermelho</span>
          </div>
        </div>

        <div className={styles.draftHeaderRight}>
          {subtitle && !isReadOnly && (
            <span className={styles.seriesLabel}>{subtitle}</span>
          )}

          {lockedCount > 0 && (
            <span
              className={styles.fearlessBadge}
              title={`Campeões indisponíveis nesta série: ${[...lockedKeys]
                .map((key) => CHAMPIONS[key]?.name ?? key)
                .join(", ")}`}
            >
              <MdLock size={12} /> Fearless ativo ({lockedCount} expurgados)
            </span>
          )}
        </div>
      </header>

      <div className={styles.turnBar}>
        {isReadOnly ? (
          <span className={styles.turnLabel}>
            {title} — draft registrado, somente exibição
          </span>
        ) : isBanPhase && turn.kind === "ban" ? (
          <>
            <span
              className={clsx(
                styles.turnLabel,
                turn.side === TeamKey.TeamA
                  ? styles.turnLabelAlpha
                  : styles.turnLabelOmega,
              )}
            >
              Fase de bans — vez: {sideLabelOf(turn.side)}
            </span>
            <span className={styles.turnCounter}>{turnCounter.bans}/10 bans</span>
            <SLButton variant="text" role="secondary" onClick={onSkipTurn}>
              Pular turno →
            </SLButton>
          </>
        ) : isPickPhase ? (
          <>
            <span className={styles.turnLabel}>
              Fase de picks — vez: {sideLabelOf(turn.side)}
            </span>
            <span className={styles.turnCounter}>{pickedCount}/10 picks</span>
          </>
        ) : (
          isReadyToFinish && (
            <span className={styles.turnLabel}>
              Draft completo — encerre a partida para registrar o resultado
            </span>
          )
        )}
      </div>

      {lockedCount > 0 && (
        <aside className={styles.fearlessBank}>
          <div className={styles.fearlessBankHead}>
            <span className={styles.fearlessBankTitle}>
              <MdLock size={14} />
              Banco fearless // campeões indisponíveis nesta série
            </span>
            <span className={styles.fearlessBankCount}>
              {lockedCount} bloqueado{lockedCount === 1 ? "" : "s"}
            </span>
          </div>

          <div className={styles.fearlessChips}>
            {[...lockedKeys].map((championKey) => (
              <span
                key={championKey}
                className={styles.fearlessChip}
                title={CHAMPIONS[championKey]?.name}
              >
                <img
                  className={styles.fearlessChipImg}
                  src={getChampionPortraitUrl(championKey)}
                  alt={CHAMPIONS[championKey]?.name}
                  loading="lazy"
                />
                <span className={styles.fearlessChipName}>
                  {(CHAMPIONS[championKey]?.name ?? championKey).slice(0, 8)}
                </span>
              </span>
            ))}
          </div>
        </aside>
      )}

      {turn.kind !== "ready" && !isReadOnly && (
        <div
          className={clsx(
            styles.turnBanner,
            turn.side === TeamKey.TeamA
              ? styles.turnBannerAlpha
              : styles.turnBannerOmega,
          )}
        >
          <span className={styles.turnBannerDot} aria-hidden="true" />
          <span className={styles.turnBannerMain}>
            <strong className={styles.turnBannerTeam}>
              {sideLabelOf(turn.side)}
            </strong>
            <span className={styles.turnBannerHint}>
              {turn.kind === "ban"
                ? `na vez de BANIR — ban ${Math.min(turnCounter.bans + 1, TOTAL_BANS)} de ${TOTAL_BANS}`
                : turn.kind === "pick"
                  ? `na vez de PICAR — ${pickedCount}/10 picks`
                  : ""}
            </span>
          </span>
          <span className={styles.turnBannerAction}>
            {turn.kind === "ban"
              ? "Bane um campeão no painel acima"
              : `Tempo do pick: ${formatPickClock(pickClock)}`}
          </span>
        </div>
      )}

      <div className={styles.board}>
        {renderSideColumn(TeamKey.TeamA)}

        <div className={styles.championArea}>
          <div className={styles.poolHeader}>
            <span
              className={clsx(
                styles.turnOwnerTitle,
                ownerSide === TeamKey.TeamB && styles.turnOwnerOmega,
              )}
            >
              {isReadOnly
                ? "Draft registrado"
                : isBanPhase && turn.kind === "ban"
                  ? `${sideLabelOf(turn.side)} · ${SIDE_BADGES[turn.side]}`
                  : selectedSlot
                    ? `${sideLabelOf(selectedSlot.side)} · ${SIDE_BADGES[selectedSlot.side]}`
                    : "Picks livres"}
            </span>
            <span className={styles.poolMeta}>
              {availableAll} disponíveis na base total
            </span>
          </div>

          <div className={styles.filters}>
            <SLInput
              type="text"
              placeholder="Buscar campeão por nome ou papel…"
              value={nameSearch}
              onChange={(event) => setNameSearch(event.target.value)}
            />

            <div className={styles.scopeFilters}>
              {(
                [
                  { key: "all", label: `Todos (${Object.keys(CHAMPIONS).length})` },
                  { key: "available", label: "Disponíveis" },
                  { key: "locked", label: `Bloqueados (${poolTotal - availableAll})` },
                ] as const
              ).map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className={clsx(
                    styles.scopeFilter,
                    scopeFilter === option.key && styles.scopeFilterActive,
                  )}
                  onClick={() => setScopeFilter(option.key)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.filterRow}>
            <div className={styles.laneFilters}>
              <span className={styles.filterGroupLabel}>Rotas:</span>
              {(["All", ...ALL_LANES] as ("All" | Lane)[]).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={clsx(
                    styles.laneFilter,
                    laneFilter === filter && styles.laneFilterActive,
                  )}
                  onClick={() => setLaneFilter(filter)}
                >
                  {filter === "All" ? "Todas" : LANE_ABBR[filter]}
                </button>
              ))}
            </div>

            <div className={styles.classFilters}>
              <span className={styles.filterGroupLabel}>Classes:</span>
              {CHAMPION_CLASSES.map((candidate) => (
                <button
                  key={candidate}
                  type="button"
                  className={clsx(
                    styles.classFilter,
                    classFilter === candidate && styles.classFilterActive,
                  )}
                  onClick={() =>
                    setClassFilter((prev) =>
                      prev === candidate ? null : candidate,
                    )
                  }
                >
                  {candidate}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.championGrid}>
            {championList.map((champion) => {
              const disabled = championIsDisabled(champion.key);

              return (
                <button
                  key={champion.key}
                  type="button"
                  className={clsx(
                    styles.championCard,
                    disabled && styles.championCardDisabled,
                    selectedChampionKey === champion.key &&
                      isPickPhase &&
                      !!selectedSlot &&
                      styles.championCardSelected,
                  )}
                  title={
                    lockedKeys.has(champion.key)
                      ? "Já escolhido nesta série (fearless)"
                      : usedInGameKeys.has(champion.key)
                        ? "Já usado nesta partida"
                        : champion.classes.join(", ")
                  }
                  onClick={() => handleChampionClick(champion.key)}
                >
                  <span className={styles.championCardFrame}>
                    <img
                      className={styles.championThumb}
                      src={getChampionCardArtUrl(champion.key)}
                      alt={champion.name}
                      loading="lazy"
                    />
                    {selectedChampionKey === champion.key &&
                      isPickPhase &&
                      !!selectedSlot && (
                        <span className={styles.championCardFlag}>
                          Selecionado
                        </span>
                      )}
                    {lockedKeys.has(champion.key) && (
                      <span className={styles.championCardLock}>Fearless lock</span>
                    )}
                    {!disabled &&
                      !lockedKeys.has(champion.key) &&
                      !(selectedChampionKey === champion.key) && (
                        <span className={styles.championCardDispo}>Disp.</span>
                      )}
                  </span>
                  <span className={styles.championName}>{champion.name}</span>
                </button>
              );
            })}

            {championList.length === 0 && (
              <p className={styles.emptyPool}>
                Nenhum campeão com esses filtros.
              </p>
            )}
          </div>

          {isPickPhase && selectedSlot && (
            <footer className={styles.pickConfirmBar}>
              {selectedChampionKey ? (
                <>
                  <div className={styles.confirmInfo}>
                    <span className={styles.confirmTitle}>
                      Selecionado: {CHAMPIONS[selectedChampionKey]?.name ?? "?"} (
                      {LANE_LABEL_PT[selectedSlot.lane]})
                    </span>
                    <span className={styles.confirmValid}>
                      Válido sob fearless
                    </span>
                  </div>

                  <div className={styles.confirmActions}>
                    <SLButton
                      variant="outlined"
                      onClick={() => setSelectedChampionKey(null)}
                    >
                      <MdSwapHoriz size={15} /> Trocar
                    </SLButton>

                    <button
                      type="button"
                      className={styles.confirmBtn}
                      onClick={confirmSelection}
                    >
                      Confirmar seleção
                    </button>
                  </div>
                </>
              ) : (
                <span className={styles.confirmHint}>
                  Slot {LANE_ABBR[selectedSlot.lane]} de{" "}
                  {sideLabelOf(selectedSlot.side)} selecionado — escolha um
                  campeão no painel acima.
                </span>
              )}
            </footer>
          )}
        </div>

        {renderSideColumn(TeamKey.TeamB)}
      </div>

      <footer className={styles.tacticalHud}>
        <div className={styles.hudLeft}>
          <span className={styles.hudLabel}>Tactical HUD</span>

          {isReadOnly ? (
            <span className={styles.hudStatus}>
              {title} — série registrada ✓
            </span>
          ) : (
            <>
              <span className={styles.hudDot} aria-hidden="true" />
              <span className={styles.hudStatus}>
                {isBanPhase && turn.kind === "ban"
                  ? `Ban ${Math.min(turnCounter.bans + 1, TOTAL_BANS)} de ${TOTAL_BANS} — ${sideLabelOf(turn.side)}`
                  : isReadyToFinish
                    ? "Draft completo — registre o resultado"
                    : `Picks ${pickedCount}/10 — vez: ${sideLabelOf(turn.side)}`}
              </span>
            </>
          )}

          {lockedCount > 0 && (
            <span className={styles.hudPool}>
              <MdLockClock size={12} /> Pool fearless: {poolTotal - lockedCount}/
              {poolTotal} restantes
            </span>
          )}
        </div>

        <div className={styles.hudRight}>
          {isReadOnly ? (
            <span className={styles.turnLabel}>Série registrada ✓</span>
          ) : isReadyToFinish ? (
            <>
              <SLButton role="secondary" onClick={() => onFinish(TeamKey.TeamA)}>
                {sideLabelOf(TeamKey.TeamA)} venceu
              </SLButton>
              <SLButton role="secondary" onClick={() => onFinish(TeamKey.TeamB)}>
                {sideLabelOf(TeamKey.TeamB)} venceu
              </SLButton>
              <SLButton
                variant="text"
                role="secondary"
                onClick={() => onFinish(null)}
              >
                Sem vencedor
              </SLButton>
            </>
          ) : (
            <SLButton onClick={() => onFinish(null)} disabled>
              Encerrar partida
            </SLButton>
          )}
        </div>
      </footer>
    </section>
  );
};