import React from "react";
import { GiCrossedSwords, GiPodium } from "react-icons/gi";
import {
  MdAdd,
  MdClose,
  MdEdit,
  MdGroups,
  MdHowToReg,
  MdLockClock,
  MdPerson,
  MdReplay,
} from "react-icons/md";
import { useAtom } from "jotai";

import { SLButton, SLInput } from "@/components";
import { useDraftSession, useRegisteredTeams } from "@/hooks";
import { sessionsAtom } from "@/state";
import { type RegisteredTeam,TeamKey } from "@/types";

import styles from "./Teams.module.css";

const TEAM_SLOTS = 5;
const TEAM_CAPACITY = 16;
const FALLBACK = "—";

/** Sigla gerada a partir do nome (3 letras maiúsculas, sem espaços). */
const teamAbbr = (name: string) => {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "???";
  }

  if (words.length === 1) {
    return words[0].slice(0, 3).toUpperCase();
  }

  return words.slice(0, 3).map((word) => word[0]).join("").toUpperCase();
};

type EditorState = {
  id: string | null;
  name: string;
  players: string[];
};

const EMPTY_EDITOR: EditorState = { id: null, name: "", players: [""] };

export const Teams: React.FC = () => {
  const { teams, aggregatedRecords, saveTeam, removeTeam } = useRegisteredTeams();
  const { setAppScreen } = useDraftSession();
  const [sessions] = useAtom(sessionsAtom);

  const [editor, setEditor] = React.useState<EditorState | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [rosterDraft, setRosterDraft] = React.useState<Record<string, string[]>>({});
  const [confirmRemove, setConfirmRemove] = React.useState<string | null>(null);

  const selected = React.useMemo(
    () => teams.find((team) => team.id === selectedId) ?? teams[0] ?? null,
    [teams, selectedId],
  );

  const rosterOf = (team: RegisteredTeam): string[] => {
    const draft = rosterDraft[team.id];

    return draft
      ? draft.slice(0, TEAM_SLOTS)
      : [...team.players, "", "", "", "", ""].slice(0, TEAM_SLOTS);
  };

  const openEditor = (team?: RegisteredTeam) => {
    setEditor(
      team
        ? {
            id: team.id,
            name: team.name,
            players:
              team.players.length > 0 ? [...team.players] : ["", "", "", "", ""],
          }
        : { ...EMPTY_EDITOR },
    );
  };

  const commitEditor = () => {
    if (!editor) {
      return;
    }

    const players = editor.players.map((player) => player.trim()).filter(Boolean);

    saveTeam({
      id: editor.id ?? undefined,
      name: editor.name,
      players,
    });
    setEditor(null);
  };

  const setRosterPlayer = (teamId: string, index: number, value: string) => {
    const team = teams.find((candidate) => candidate.id === teamId);

    if (!team) {
      return;
    }

    setRosterDraft((prev) => {
      const base = rosterOf(team);

      return { ...prev, [teamId]: base.map((name, i) => (i === index ? value : name)) };
    });
  };

  const commitRoster = (team: RegisteredTeam) => {
    const players = rosterOf(team)
      .map((player) => player.trim())
      .filter(Boolean);

    saveTeam({ id: team.id, name: team.name, players });
    setRosterDraft((prev) => {
      const next = { ...prev };

      delete next[team.id];

      return next;
    });
  };

  // Histórico: últimos drafts fechados (séries de draft salvas).
  const history = React.useMemo(() => {
    const drafts: { label: string; format: string; picks: number }[] = [];

    sessions.forEach((session) => {
      session.games.forEach((game) => {
        const picks = [
          ...Object.values(game.picks[TeamKey.TeamA]),
          ...Object.values(game.picks[TeamKey.TeamB]),
        ].filter(Boolean).length;

        drafts.push({
          label: `Série de draft`,
          format: `Bo${session.format}`,
          picks,
        });
      });
    });

    return drafts.reverse().slice(0, 6);
  }, [sessions]);

  const filledCount = (players: string[]) => players.filter(Boolean).length;
  const capacity = Math.min(teams.length, TEAM_CAPACITY);
  const statusOk = capacity <= TEAM_CAPACITY / 2;

  return (
    <div className={styles.teamsScreen}>
      <header className={styles.hero}>
        <div className={styles.heroMain}>
          <p className={styles.heroBreadcrumb}>
            <GiCrossedSwords size={13} />
            Circuito Hextech // Protocolo de práticas ativas
          </p>
          <h1 className={styles.heroTitle}>
            Gestão tática de
            <span className={styles.heroTitleAccent}> equipes</span>
          </h1>
          <p className={styles.heroSub}>
            Supervisão de elencos registrados, calibragem de titulares e histórico
            de confrontos das competições registradas.
          </p>
        </div>

        <div className={styles.heroAside}>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatLabel}>Total de equipes</span>
              <span className={styles.heroStatValue}>
                {capacity} / {TEAM_CAPACITY}
              </span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatLabel}>Status geral</span>
              <span
                className={
                  statusOk ? styles.heroStatusOk : styles.heroStatusWarn
                }
              >
                {statusOk ? "Homologado" : "Com pendências"}
              </span>
            </div>
          </div>

          <div className={styles.heroActions}>
            <SLButton role="secondary" onClick={() => setAppScreen("competition")}>
              <MdGroups size={15} />
              Gerenciar escalações
            </SLButton>
            <SLButton onClick={() => setAppScreen("competition")}>
              <MdAdd size={15} />
              Registrar nova equipe
            </SLButton>
          </div>
        </div>
      </header>

      <div className={styles.board}>
        <aside className={styles.directory}>
          <header className={styles.directoryHead}>
            <h2 className={styles.sectionTitle}>
              <MdGroups size={15} />
              Diretório de equipes ({teams.length})
            </h2>
            <span className={styles.sectionMeta}>Ordenado por registro</span>
          </header>

          <ul className={styles.directoryList}>
            {teams.map((team, index) => {
              const record = aggregatedRecords.get(team.name.trim().toLowerCase());
              const winRate =
                record && record.wins + record.losses > 0
                  ? Math.round((record.wins / (record.wins + record.losses)) * 100)
                  : null;
              const isCurrent = selected?.id === team.id;

              return (
                <li key={team.id}>
                  <button
                    type="button"
                    className={`${styles.directoryRow}${isCurrent ? ` ${styles.directoryRowCurrent}` : ""}`}
                    onClick={() => setSelectedId(team.id)}
                  >
                    <span className={styles.directoryBadge}>{teamAbbr(team.name)}</span>
                    <span className={styles.directoryRowMain}>
                      <span className={styles.directoryName}>{team.name}</span>
                      <span className={styles.directoryMeta}>
                        {filledCount(team.players)}/{TEAM_SLOTS} jogadores
                        {record ? ` · ${record.wins}-${record.losses}` : ""}
                      </span>
                    </span>
                    <span className={styles.directoryStats}>
                      <span className={styles.directoryPoints}>
                        {winRate !== null ? `${winRate}%` : FALLBACK}
                        <small> WR</small>
                      </span>
                      <span className={styles.directoryGames}>#{index + 1}</span>
                    </span>
                  </button>
                </li>
              );
            })}
            {teams.length === 0 && (
              <li className={styles.directoryEmpty}>
                Nenhuma equipe registrada — comece cadastrando a primeira.
              </li>
            )}
          </ul>

          <p className={styles.directoryNote}>
            <GiPodium size={14} />
            O histórico W-D vem das competições suíças em que a equipe disputou
            partidas.
          </p>
        </aside>

        {selected && (
          <section className={styles.detail}>
            <header className={styles.detailHead}>
              <div className={styles.detailIdentity}>
                <span className={styles.detailBadge}>{teamAbbr(selected.name)}</span>
                <div>
                  <h2 className={styles.detailName}>{selected.name}</h2>
                  <span className={styles.detailSub}>
                    Elenco homologado · {filledCount(selected.players)} de
                    {" "}{TEAM_SLOTS} titulares
                  </span>
                </div>
              </div>
              <div className={styles.detailStats}>
                <div className={styles.detailStat}>
                  <span className={styles.detailStatLabel}>Vitórias</span>
                  <span className={styles.detailStatValue}>
                    {aggregatedRecords.get(selected.name.trim().toLowerCase())?.wins ?? 0}
                  </span>
                </div>
                <div className={styles.detailStat}>
                  <span className={styles.detailStatLabel}>Derrotas</span>
                  <span className={styles.detailStatValue}>
                    {aggregatedRecords.get(selected.name.trim().toLowerCase())?.losses ?? 0}
                  </span>
                </div>
              </div>
              <div className={styles.detailTools}>
                <SLButton variant="text" onClick={() => openEditor(selected)}>
                  <MdEdit size={14} />
                  Editar dados
                </SLButton>
                <SLButton variant="text" onClick={() => commitRoster(selected)}>
                  <MdPerson size={14} />
                  Salvar elenco
                </SLButton>
              </div>
            </header>

            <div className={styles.rosterHead}>
              <h3 className={styles.sectionTitle}>
                <MdHowToReg size={14} />
                Elenco operacional // {filledCount(selected.players)} titulares
              </h3>
              <SLButton
                variant="text"
                role="secondary"
                onClick={() => openEditor(selected)}
              >
                <MdAdd size={14} />
                Adicionar jogador
              </SLButton>
            </div>

            <ul className={styles.rosterGrid}>
              {rosterOf(selected).map((player, index) => (
                <li key={index} className={styles.rosterCard}>
                  <span className={styles.rosterCardRole}>
                    Slot {index + 1} · Titular
                  </span>
                  <input
                    className={styles.rosterCardInput}
                    value={player}
                    placeholder={`Nome do jogador ${index + 1}`}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      setRosterPlayer(selected.id, index, event.target.value)
                    }
                  />
                  <span className={styles.rosterCardFoot}>
                    <MdReplay size={12} />
                    Ajustável a qualquer momento
                  </span>
                </li>
              ))}
            </ul>

            <p className={styles.rosterNote}>
              <MdLockClock size={13} />
              Slots vazios ficam pendentes de titular — cinco nomes completam o
              elenco homologado.
            </p>

            <div className={styles.detailFooter}>
              <span className={styles.detailFooterLabel}>Zona de risco</span>
              {confirmRemove === selected.id ? (
                <div className={styles.detailFooterActions}>
                  <span>Remover “{selected.name}” e todo o elenco?</span>
                  <SLButton
                    variant="text"
                    role="secondary"
                    onClick={() => {
                      removeTeam(selected.id);
                      setConfirmRemove(null);
                    }}
                  >
                    Confirmar
                  </SLButton>
                  <SLButton variant="text" onClick={() => setConfirmRemove(null)}>
                    Manter
                  </SLButton>
                </div>
              ) : (
                <SLButton variant="text" onClick={() => setConfirmRemove(selected.id)}>
                  Remover equipe
                </SLButton>
              )}
            </div>
          </section>
        )}
      </div>

      <section className={styles.arsenal}>
        <header className={styles.arsenalHead}>
          <h2 className={styles.sectionTitle}>
            <GiCrossedSwords size={15} />
            Arsenal &amp; campeões assinatura
          </h2>
          <span className={styles.sectionMeta}>
            Campeões mais usados nos drafts salvos do app
          </span>
        </header>
        <div className={styles.arsenalBody}>
          {history.length > 0 ? (
            <span className={styles.arsenalMeta}>
              {history.length} confronto(s) registrados nas salas de draft.
            </span>
          ) : (
            <span className={styles.arsenalMeta}>
              Nenhum draft registrado ainda — histórico aparece após partidas.
            </span>
          )}
        </div>
      </section>

      <section className={styles.logs}>
        <header className={styles.arsenalHead}>
          <h2 className={styles.sectionTitle}>
            <MdReplay size={15} />
            Histórico tático recente // últimos confrontos
          </h2>
          <span className={styles.sectionMeta}>
            {sessions.length} série(s) de draft registradas
          </span>
        </header>
        <ul className={styles.logsList}>
          {history.map((entry, index) => (
            <li key={index} className={styles.logRow}>
              <span className={styles.logTag}>{index + 1}</span>
              <span className={styles.logMain}>
                <span className={styles.logTitle}>{entry.label}</span>
                <span className={styles.logMeta}>
                  {entry.format} · {entry.picks} picks
                </span>
              </span>
            </li>
          ))}
          {history.length === 0 && (
            <li className={styles.logsEmpty}>Sem confrontos registrados.</li>
          )}
        </ul>
      </section>

      {editor && (
        <div className={styles.modalBackdrop} onClick={() => setEditor(null)}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <header className={styles.modalHead}>
              <h3 className={styles.modalTitle}>
                {editor.id ? "Editar equipe" : "Nova equipe"}
              </h3>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setEditor(null)}
                aria-label="Fechar"
              >
                <MdClose size={18} />
              </button>
            </header>

            <div className={styles.modalBody}>
              <label className={styles.modalLabel}>
                Nome da equipe
                <SLInput
                  value={editor.name}
                  placeholder="Ex.: Protocolo Cyan"
                  onChange={(event) =>
                    setEditor((prev) =>
                      prev ? { ...prev, name: event.target.value } : prev,
                    )
                  }
                />
              </label>

              <span className={styles.modalLabel}>Titulares ({TEAM_SLOTS} slots)</span>
              {editor.players.map((player, index) => (
                <SLInput
                  key={index}
                  value={player}
                  placeholder={`Jogador ${index + 1}`}
                  onChange={(event) =>
                    setEditor((prev) =>
                      prev
                        ? {
                            ...prev,
                            players: prev.players.map((name, i) =>
                              i === index ? event.target.value : name,
                            ),
                          }
                        : prev,
                    )
                  }
                />
              ))}
            </div>

            <footer className={styles.modalFoot}>
              <SLButton onClick={commitEditor}>Salvar equipe</SLButton>
              <SLButton variant="text" onClick={() => setEditor(null)}>
                Cancelar
              </SLButton>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};