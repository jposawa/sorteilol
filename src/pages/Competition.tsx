import React from "react";
import { GiCrossedSwords } from "react-icons/gi";
import {
  MdAdd,
  MdAddCircle,
  MdArrowDropDown,
  MdCheckCircle,
  MdClose,
  MdEmojiEvents,
  MdGroups,
  MdHub,
  MdLock,
  MdMilitaryTech,
  MdTimer,
} from "react-icons/md";
import clsx from "clsx";

import { SLButton } from "@/components";
import {
  DRAFT_FORMAT_OPTIONS,
  MAX_COMPETITION_TEAMS,
  MIN_COMPETITION_TEAMS,
} from "@/constants";
import {
  CompetitionFearless,
  CompetitionHighlight,
  CompetitionRanking,
  CompetitionRounds,
  MatchDraftView,
} from "@/fragments";
import { TeamsCarousel } from "@/fragments/TeamsCarousel";
import {
  getStandings,
  isCompetitionResolved,
  useCompetition,
  useRegisteredTeams,
} from "@/hooks";
import { type Competition as CompetitionData, type DraftFormat } from "@/types";

import styles from "./Competition.module.css";

/** Placar total de picks por campeão nos drafts da competição. */
const collectPickCounts = (competition: CompetitionData) => {
  const counts = new Map<string, number>();

  competition.matches.forEach((match) => {
    const sides = match.draftState?.picks;

    if (!sides) {
      return;
    }

    Object.values(sides).forEach((sidePicks) => {
      Object.values(sidePicks).forEach((championKey) => {
        if (championKey) {
          counts.set(championKey, (counts.get(championKey) ?? 0) + 1);
        }
      });
    });
  });

  return counts;
};

const teamTag = (name: string) => {
  const words = name.split(/[^\p{L}\p{N}]+/u).filter(Boolean);

  if (words.length === 0) {
    return "???";
  }

  if (words.length === 1) {
    return words[0].slice(0, 3).toUpperCase();
  }

  if (words.length === 2) {
    return `${words[0][0]}${words[1].slice(0, 2)}`.toUpperCase();
  }

  return words
    .slice(0, 3)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
};

export const Competition: React.FC = () => {
  const {
    competitions,
    activeCompetition,
    activeCompetitionId,
    createCompetition,
    openCompetition,
    leaveCompetition,
    deleteCompetition,
    generateNextRound,
    canGenerateNextRound,
    nextRoundNumber,
  } = useCompetition();

  const { teams: registeredTeams, saveTeam } = useRegisteredTeams();

  const [formOpen, setFormOpen] = React.useState(false);
  const [pairOpen, setPairOpen] = React.useState(false);
  const [competitionName, setCompetitionName] = React.useState("");
  const [draftFormat, setDraftFormat] = React.useState<DraftFormat>("fearless");
  const [selectedTeamIds, setSelectedTeamIds] = React.useState<Set<string>>(
    new Set(),
  );
  const [activeMatchKey, setActiveMatchKey] = React.useState<string | null>(null);
  const [activeRound, setActiveRound] = React.useState(1);

  /**
   * Abre a competição e aponta a arena para a rodada mais recente dela.
   */
  const openBy = (competitionId: string) => {
    openCompetition(competitionId);

    const matches = competitions.find(
      (candidate) => candidate.id === competitionId,
    )?.matches;

    setActiveRound(
      matches && matches.length > 0
        ? Math.max(...matches.map((match) => match.round))
        : 1,
    );
  };

  const toggleParticipant = (teamId: string) => {
    setSelectedTeamIds((prev) => {
      const next = new Set(prev);

      if (next.has(teamId)) {
        next.delete(teamId);
      } else if (next.size < MAX_COMPETITION_TEAMS) {
        next.add(teamId);
      }

      return next;
    });
  };

  const selectedTeams = registeredTeams.filter((team) =>
    selectedTeamIds.has(team.id),
  );

  // Cadastro de equipe DENTRO do modal (sem sair para a página Equipes).
  const [inlineName, setInlineName] = React.useState("");
  const [inlinePlayers, setInlinePlayers] = React.useState("");

  const addInlineTeam = () => {
    const name = inlineName.trim();

    if (!name) {
      return;
    }

    const players = inlinePlayers.split(",").map((player) => player.trim());
    // Registra com id explícito e já marca como participante selcionado.
    const teamId = crypto.randomUUID();
    saveTeam({ id: teamId, name, players });
    setSelectedTeamIds((prev) => {
      const next = new Set(prev);

      if (next.size < MAX_COMPETITION_TEAMS) {
        next.add(teamId);
      }

      return next;
    });
    setInlineName("");
    setInlinePlayers("");
  };

  const submitNewCompetition = () => {
    if (selectedTeamIds.size < MIN_COMPETITION_TEAMS) {
      return;
    }

    createCompetition(competitionName, draftFormat, selectedTeams);
    setActiveRound(1);
    setFormOpen(false);
    setCompetitionName("");
    setSelectedTeamIds(new Set());
  };

  const submitPair = () => {
    if (!canGenerateNextRound) {
      return;
    }

    generateNextRound();
    setPairOpen(false);
    setActiveRound(nextRoundNumber);
  };

  const closeModal = () => {
    setFormOpen(false);
  };

  const renderNewCompetitionModal = () => (
    <div className={styles.overlay}>
      <div className={clsx(styles.modal, styles.modalShadowGold)}>
        <div className={clsx(styles.modalHead, styles.modalHeadGold)}>
          <div className={styles.modalHeadLeft}>
            <span className={styles.modalHeadIcon}>
              <MdEmojiEvents size={22} aria-hidden="true" />
            </span>

            <div>
              <h3 className={styles.modalTitle}>Configurar novo campeonato</h3>
              <span className={styles.modalSub}>
                Inicia uma nova chave suíça com regra 3W/3L
              </span>
            </div>
          </div>

          <button
            type="button"
            className={styles.modalClose}
            aria-label="Fechar"
            onClick={closeModal}
          >
            <MdClose size={20} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.formField}>
            <label className={styles.formLabel} htmlFor="competition-name">
              Nome oficial do torneio
            </label>
            <input
              id="competition-name"
              type="text"
              className={styles.formInput}
              placeholder="Copa Suíça Hextech"
              value={competitionName}
              onChange={(event) => setCompetitionName(event.target.value)}
            />
          </div>

          <div className={styles.formField}>
            <label className={clsx(styles.formLabel, styles.formLabelMuted)}>
              Regras de draft (todas as partidas)
            </label>
            <select
              className={styles.formSelect}
              value={draftFormat}
              onChange={(event) =>
                setDraftFormat(event.target.value as DraftFormat)
              }
            >
              {DRAFT_FORMAT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formField}>
            <span
              className={clsx(
                styles.formLabel,
                styles.formLabelMuted,
              )}
            >
              Participantes · {selectedTeamIds.size}/{MAX_COMPETITION_TEAMS}{" "}
              equipes
            </span>

            <div className={styles.participantList}>
              {registeredTeams.map((equipe) => {
                const isSelected = selectedTeamIds.has(equipe.id);
                const players = equipe.players.filter((player) => player.trim());

                return (
                  <label
                    key={equipe.id}
                    className={clsx(
                      styles.participantRow,
                      isSelected && styles.participantChecked,
                    )}
                  >
                    <input
                      type="checkbox"
                      className={styles.participantCheck}
                      checked={isSelected}
                      onChange={() => toggleParticipant(equipe.id)}
                    />

                    <span className={styles.participantName}>{equipe.name}</span>
                    <span className={styles.participantPlayers}>
                      {players.length > 0 ? players.join(", ") : "sem jogadores"}
                    </span>
                  </label>
                );
              })}
            </div>

            {registeredTeams.length === 0 && (
              <p className={styles.formHint}>
                Nenhuma equipe registrada — cadastre na aba Equipes ou crie
                agora mesmo abaixo (até {MAX_COMPETITION_TEAMS} times por
                chave).
              </p>
            )}

            <div className={styles.inlineTeamForm}>
              <input
                type="text"
                className={styles.formInput}
                placeholder="Nova equipe — nome (ex.: Protocolo Cyan)"
                value={inlineName}
                onChange={(event) => setInlineName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    addInlineTeam();
                  }
                }}
              />
              <input
                type="text"
                className={styles.formInput}
                placeholder="Jogadores separados por vírgula (opcional)"
                value={inlinePlayers}
                onChange={(event) => setInlinePlayers(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    addInlineTeam();
                  }
                }}
              />
              <SLButton
                variant="text"
                role="secondary"
                onClick={addInlineTeam}
              >
                <MdAdd size={14} />
                Adicionar equipe
              </SLButton>
            </div>
          </div>

          <p className={styles.formHint}>
            Suiço do competitivo: 3W avança, 3L elimina; rodadas 1-2 em Bo1 e
            demais em Bo3. O draft de cada partida fica salvo e o resultado da
            série vem dele (ou da marcação direta nos lados).
          </p>
        </div>

        <div className={styles.formFoot}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={closeModal}
          >
            Cancelar
          </button>

          <button
            type="button"
            className={styles.submitGold}
            disabled={selectedTeamIds.size < MIN_COMPETITION_TEAMS}
            onClick={submitNewCompetition}
          >
            Criar e iniciar campeonato
          </button>
        </div>
      </div>
    </div>
  );

  const renderPairModal = () => {
    if (!activeCompetition) {
      return null;
    }

    const actives = getStandings(activeCompetition).filter(
      (standing) => standing.status === "active",
    ).length;

    return (
      <div className={styles.overlay}>
        <div className={clsx(styles.modal, styles.modalShadowCyan)}>
          <div className={styles.modalHead}>
            <div className={styles.modalHeadLeft}>
              <span className={styles.modalHeadIcon}>
                <MdHub size={22} aria-hidden="true" />
              </span>

              <div>
                <h3 className={styles.modalTitle}>Emparelhamento suíço</h3>
                <span className={styles.modalSub}>
                  Mesma pontuação, sem confrontos repetidos
                </span>
              </div>
            </div>

            <button
              type="button"
              className={styles.modalClose}
              aria-label="Fechar"
              onClick={() => setPairOpen(false)}
            >
              <MdClose size={20} />
            </button>
          </div>

          <div className={styles.modalBody}>
            <div className={styles.pairRoundBox}>
              <span className={styles.pairRoundLabel}>Rodada destino</span>
              <div className={styles.pairRoundValue}>
                Rodada {nextRoundNumber}
                <span className={styles.pairBadge}>{actives} equipes ativas</span>
              </div>
            </div>

            <div className={styles.criteriaGrid}>
              <div className={styles.criteriaCard}>
                <span className={styles.criteriaLabel}>Critério principal</span>
                <span className={styles.criteriaValue}>
                  Mesma pontuação (W-L)
                </span>
              </div>

              <div className={styles.criteriaCard}>
                <span className={styles.criteriaLabel}>Critério de proteção</span>
                <span className={styles.criteriaValue}>Sem reencontro</span>
              </div>

              <div className={styles.criteriaCard}>
                <span className={styles.criteriaLabel}>Formato das séries</span>
                <span className={styles.criteriaValue}>
                  Rodadas 1-2 Bo1 · da 3ª Bo3
                </span>
              </div>
            </div>

            {canGenerateNextRound ? (
              <>
                <div className={styles.pairToggleRow}>
                  <div className={styles.pairToggleLeft}>
                    <span className={styles.pairToggleIcon}>
                      <MdCheckCircle size={16} aria-hidden="true" />
                    </span>
                    <span>
                      Proibir confrontos repetidos de rodadas anteriores
                    </span>
                  </div>

                  <input
                    type="checkbox"
                    className={styles.pairCheck}
                    checked
                    readOnly
                    disabled
                  />
                </div>
              </>
            ) : (
              <div className={styles.pairWarnCard}>
                <span className={styles.pairWarnIcon}>
                  <MdTimer size={16} aria-hidden="true" />
                </span>
                <span>
                  A rodada anterior ainda tem séries sem resultado — marque os
                  vencedores na arena abaixo ou aguarde o encerramento dos
                  drafts.
                </span>
              </div>
            )}
          </div>

          <div className={styles.formFoot}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => setPairOpen(false)}
            >
              Cancelar
            </button>

            <button
              type="button"
              className={styles.submitCyan}
              disabled={!canGenerateNextRound}
              onClick={submitPair}
            >
              Executar e gerar rodada {nextRoundNumber}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (activeCompetition) {
    if (activeMatchKey) {
      return (
        <MatchDraftView
          matchKey={activeMatchKey}
          onClose={() => setActiveMatchKey(null)}
        />
      );
    }

    const standings = getStandings(activeCompetition);
    const actives = standings.filter(
      (standing) => standing.status === "active",
    );
    const advancedCount = standings.filter(
      (standing) => standing.status === "advanced",
    ).length;
    const eliminatedCount = standings.filter(
      (standing) => standing.status === "eliminated",
    ).length;

    const currentRound = Math.max(
      0,
      ...activeCompetition.matches.map((match) => match.round),
    );
    const roundMatches = activeCompetition.matches.filter(
      (match) => match.round === currentRound,
    );
    const roundDone = roundMatches.filter((match) => match.winner).length;
    const progress = roundMatches.length > 0 ? roundDone / roundMatches.length : 0;

    const winnerMatches = activeCompetition.matches.filter(
      (match) => match.winner !== null,
    ).length;
    const draftMatches = activeCompetition.matches.filter(
      (match) => match.draftState !== null,
    ).length;
    const fearless = activeCompetition.draftFormat === "fearless";
    const lockedCount = fearless ? collectPickCounts(activeCompetition).size : 0;

    return (
      <section className={styles.screen}>
        <div className={styles.hub}>
          <div className={styles.hubTag}>
            <span className={styles.hubTagDot} aria-hidden="true" />
            Circuito suíço —{" "}
            {activeCompetition.draftFormat === "fearless"
              ? "Fearless ativo"
              : "Draft padrão"}
          </div>

          <div className={styles.hubRow}>
            <div className={styles.selectorWrap}>
              <select
                className={styles.hubSelect}
                value={activeCompetitionId ?? ""}
                onChange={(event) => {
                  const value = event.target.value;

                  if (value) {
                    openBy(value);
                  } else {
                    leaveCompetition();
                  }
                }}
              >
                <option value="">— Todas as competições —</option>
                {competitions.map((competition) => (
                  <option key={competition.id} value={competition.id}>
                    {competition.name}
                  </option>
                ))}
              </select>

              <span className={styles.hubSelectArrow} aria-hidden="true">
                <MdArrowDropDown size={22} />
              </span>

              <span className={styles.hubBadge}>
                Rodada {currentRound || 1} ·{" "}
                Bo{roundMatches[0]?.seriesLength ?? 1}
              </span>
            </div>

            <div className={styles.hubActions}>
              <button
                type="button"
                className={styles.hubGhost}
                onClick={() => setPairOpen(true)}
              >
                <span className={styles.hubGhostIcon}>
                  <MdHub size={16} aria-hidden="true" />
                </span>
                Emparelhar rodada {nextRoundNumber}
              </button>

              <button
                type="button"
                className={styles.hubCta}
                onClick={() => setFormOpen(true)}
              >
                <MdAddCircle size={18} aria-hidden="true" />
                Novo campeonato
              </button>
            </div>
          </div>
        </div>

        <div className={styles.statGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>
              Equipes na disputa
              <span className={styles.statIcon}>
                <MdGroups size={16} aria-hidden="true" />
              </span>
            </span>
            <div className={styles.statValueRow}>
              <span className={styles.statValue}>{actives.length}</span>
              <span className={styles.statSuffix}>
                / {activeCompetition.teams.length} times
              </span>
            </div>
            <div className={styles.statNote}>
              {advancedCount} avançaram · {eliminatedCount} eliminadas
            </div>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statLabel}>
              Progresso suíço
              <span className={clsx(styles.statIcon, styles.statIconGold)}>
                <MdTimer size={16} aria-hidden="true" />
              </span>
            </span>
            <div className={styles.statValueRow}>
              <span className={clsx(styles.statValue, styles.statValueGold)}>
                R{currentRound || 1}
              </span>
              <span className={styles.statSuffix}>rodada atual</span>
            </div>
            <div className={styles.statBarWrap}>
              <div
                className={styles.statBarFill}
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <div className={styles.statNote}>
              {roundDone}/{roundMatches.length} séries resolvidas
            </div>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statLabel}>
              Partidas disputadas
              <span className={styles.statIcon}>
                <GiCrossedSwords size={16} aria-hidden="true" />
              </span>
            </span>
            <div className={styles.statValueRow}>
              <span className={clsx(styles.statValue, styles.statValueCyan)}>
                {winnerMatches}
              </span>
              <span className={styles.statSuffix}>séries</span>
            </div>
            <div className={styles.statNote}>
              {draftMatches} com draft registrado
            </div>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statLabel}>
              Regra fearless
              <span className={styles.statIcon}>
                <MdLock size={16} aria-hidden="true" />
              </span>
            </span>
            <div className={styles.statValueRow}>
              <span className={styles.statValue}>
                {fearless ? lockedCount : "—"}
              </span>
              <span
                className={clsx(
                  styles.statSuffix,
                  fearless && styles.statSuffixGold,
                )}
              >
                {fearless ? "champs bloqueados" : "sem locks"}
              </span>
            </div>
            <div className={styles.statNote}>
              {fearless
                ? "Picks anteriores bloqueados nas rodadas seguintes"
                : "Draft padrão — campeões livres"}
            </div>
          </div>
        </div>

        <CompetitionRounds
          activeRound={activeRound}
          onActiveRoundChange={setActiveRound}
          onOpenDraft={setActiveMatchKey}
          onOpenPairModal={() => setPairOpen(true)}
        />

        <CompetitionHighlight />

        <div className={styles.bottomGrid}>
          <CompetitionRanking />
          <CompetitionFearless />
        </div>

        {pairOpen && renderPairModal()}
        {formOpen && renderNewCompetitionModal()}
      </section>
    );
  }

  const activeCompetitions = competitions.filter(
    (competition) =>
      competition.matches.length > 0 && !isCompetitionResolved(competition),
  );
  const resolvedCompetitions = competitions.filter((competition) =>
    isCompetitionResolved(competition),
  );

  return (
    <section className={styles.screen}>
      <div className={styles.hub}>
        <div className={styles.hubTag}>
          <span className={styles.hubTagDot} aria-hidden="true" />
          Circuito oficial // SorteioLoL
        </div>

        <div className={styles.hubRow}>
          <div>
            <h2 className={styles.hubIntroTitle}>Competições suiças</h2>
            <span className={styles.hubIntroSub}>
              Chaves 3W avança / 3L elimina, com drafts salvos por partida
            </span>
          </div>

          <div className={styles.hubActions}>
            <button
              type="button"
              className={styles.hubCta}
              onClick={() => setFormOpen(true)}
            >
              <MdAddCircle size={18} aria-hidden="true" />
              Novo campeonato
            </button>
          </div>
        </div>
      </div>

      <div className={styles.statGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>
            Equipes registradas
            <span className={styles.statIcon}>
              <MdGroups size={16} aria-hidden="true" />
            </span>
          </span>
          <div className={styles.statValueRow}>
            <span className={styles.statValue}>{registeredTeams.length}</span>
            <span className={styles.statSuffix}>equipes</span>
          </div>
          <div className={styles.statNote}>Prontas para inscrição</div>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statLabel}>
            Campeonatos
            <span className={clsx(styles.statIcon, styles.statIconGold)}>
              <MdEmojiEvents size={16} aria-hidden="true" />
            </span>
          </span>
          <div className={styles.statValueRow}>
            <span className={styles.statValue}>{competitions.length}</span>
            <span className={styles.statSuffix}>no circuito</span>
          </div>
          <div className={styles.statNote}>
            {activeCompetitions.length} em andamento
          </div>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statLabel}>
            Em andamento
            <span className={styles.statIcon}>
              <MdMilitaryTech size={16} aria-hidden="true" />
            </span>
          </span>
          <div className={styles.statValueRow}>
            <span className={clsx(styles.statValue, styles.statValueCyan)}>
              {activeCompetitions.length}
            </span>
            <span className={styles.statSuffix}>chaves vivas</span>
          </div>
          <div className={styles.statNote}>Suíço em curso</div>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statLabel}>
            Encerradas
            <span className={clsx(styles.statIcon, styles.statIconGold)}>
              <MdCheckCircle size={16} aria-hidden="true" />
            </span>
          </span>
          <div className={styles.statValueRow}>
            <span className={clsx(styles.statValue, styles.statValueGold)}>
              {resolvedCompetitions.length}
            </span>
            <span className={styles.statSuffix}>finalizadas</span>
          </div>
          <div className={styles.statNote}>Com ranking definido</div>
        </div>
      </div>

      <TeamsCarousel mode="manage" />

      <div className={styles.listSection}>
        {competitions.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>
              <MdEmojiEvents size={28} aria-hidden="true" />
            </span>
            <p>
              Nenhum campeonato no circuito — use <b>Novo campeonato</b> para
              iniciar o primeiro.
            </p>
          </div>
        ) : (
          competitions.map((competition) => {
            const resolved = isCompetitionResolved(competition);
            const roundCount = new Set(
              competition.matches.map((match) => match.round),
            ).size;

            return (
              <article
                key={competition.id}
                className={styles.listCard}
              >
                <div className={styles.listCardLeft}>
                  <div className={styles.listTag}>
                    {teamTag(competition.name)}
                  </div>

                  <div className={styles.listInfo}>
                    <h3 className={styles.listName}>{competition.name}</h3>
                    <span className={styles.listMeta}>
                      {new Date(competition.createdAt).toLocaleString("pt-BR")}{" "}
                      · {competition.teams.length} times · {roundCount}{" "}
                      rodada(s)
                    </span>
                  </div>
                </div>

                <div className={styles.listBadges}>
                  {competition.draftFormat === "fearless" && (
                    <span className={styles.formatBadge}>Fearless</span>
                  )}
                  {resolved && (
                    <span className={styles.doneBadge}>Encerrada</span>
                  )}
                </div>

                <div className={styles.listActions}>
                  <button
                    type="button"
                    className={styles.listOpen}
                    onClick={() => openBy(competition.id)}
                  >
                    Abrir
                  </button>

                  <button
                    type="button"
                    className={styles.listDelete}
                    onClick={() => deleteCompetition(competition.id)}
                  >
                    Excluir
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>

      {formOpen && renderNewCompetitionModal()}
    </section>
  );
};