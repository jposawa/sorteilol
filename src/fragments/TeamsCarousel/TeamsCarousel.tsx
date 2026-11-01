import React from "react";
import clsx from "clsx";

import { SLButton, SLInput } from "@/components";
import { useRegisteredTeams } from "@/hooks";
import { type RegisteredTeam } from "@/types";

import styles from "./TeamsCarousel.module.css";

const PLAYERS_PER_TEAM = 5;

const emptyPlayers = () => Array<string>(PLAYERS_PER_TEAM).fill("");

type TeamsCarouselProps = {
  /**
   * "display": somente mostra as equipes já registradas (tela inicial —
   * sem registrar/editar/excluir). "manage": inclui a gestão completa
   * (tela Competição).
   */
  mode?: "display" | "manage";
};

export const TeamsCarousel: React.FC<TeamsCarouselProps> = ({
  mode = "display",
}) => {
  const isManage = mode === "manage";

  const { teams, aggregatedRecords, saveTeam, removeTeam } =
    useRegisteredTeams();

  const trackRef = React.useRef<HTMLDivElement>(null);
  const [pageIndex, setPageIndex] = React.useState(0);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [formName, setFormName] = React.useState("");
  const [formPlayers, setFormPlayers] = React.useState<string[]>(emptyPlayers());

  const openFormForNew = () => {
    setEditingId(null);
    setFormName("");
    setFormPlayers(emptyPlayers());
    setFormOpen(true);
  };

  const openFormForEdit = (team: RegisteredTeam) => {
    setEditingId(team.id);
    setFormName(team.name);
    setFormPlayers([...team.players, ...emptyPlayers()].slice(0, PLAYERS_PER_TEAM));
    setFormOpen(true);
  };

  const submitForm = () => {
    if (!formName.trim()) {
      return;
    }

    saveTeam({
      id: editingId ?? undefined,
      name: formName,
      players: formPlayers,
    });

    setFormOpen(false);
  };

  const scrollToPage = (index: number) => {
    const track = trackRef.current;
    const maxIndex = Math.max(teams.length - 1, 0);
    const clampedIndex = Math.max(0, Math.min(maxIndex, index));

    if (!track) {
      return;
    }

    const target = clampedIndex * track.clientWidth;

    track.scrollTo({ left: target, behavior: "smooth" });

    // Alguns ambientes (headless/flags do SO) ignoram "smooth" por completo.
    // Se nada se moveu no prazo, refaz instantâneo para nunca ficar preso.
    setTimeout(() => {
      if (Math.round(track.scrollLeft) !== target) {
        track.scrollTo({ left: target, behavior: "auto" });
      }
    }, 350);
  };

  const handleTrackScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const track = event.currentTarget;

    setPageIndex(
      Math.round(track.scrollLeft / Math.max(track.clientWidth, 1)),
    );
  };

  return (
    <section className={styles.teamsSection}>
      <header className={styles.teamsHeader}>
        <h3>Equipes registradas</h3>

        {isManage && (
          <SLButton variant="text" onClick={openFormForNew}>
            + Registrar equipe
          </SLButton>
        )}
      </header>

      {isManage && formOpen && (
        <div className={styles.teamForm}>
          <SLInput
            label="Nome da equipe: "
            type="text"
            placeholder="Equipe Alfa"
            value={formName}
            onChange={(event) => setFormName(event.target.value)}
          />

          <div className={styles.playerInputs}>
            {formPlayers.map((player, index) => (
              <SLInput
                key={index}
                type="text"
                placeholder={`Jogador ${index + 1}`}
                value={player}
                onChange={(event) =>
                  setFormPlayers((prev) =>
                    prev.map((candidate, i) =>
                      i === index ? event.target.value : candidate,
                    ),
                  )
                }
              />
            ))}
          </div>

          <div
            className={styles.formActions}
            style={{ display: "flex", gap: "0.6rem" }}
          >
            <SLButton disabled={!formName.trim()} onClick={submitForm}>
              {editingId ? "Salvar alterações" : "Registrar"}
            </SLButton>

            <SLButton
              variant="text"
              role="secondary"
              onClick={() => setFormOpen(false)}
            >
              Cancelar
            </SLButton>
          </div>
        </div>
      )}

      {teams.length === 0 ? (
        <p className={styles.emptyNote}>
          {isManage
            ? "Nenhuma equipe ainda. Registre a primeira: nome + até 5 jogadores."
            : "Nenhuma equipe registrada ainda — registre equipes na aba Competição."}
        </p>
      ) : (
        <>
          <div
            className={styles.carouselTrack}
            ref={trackRef}
            onScroll={handleTrackScroll}
          >
            {teams.map((team) => {
              const record = aggregatedRecords.get(
                team.name.trim().toLowerCase(),
              ) ?? { wins: 0, losses: 0 };

              const seriesCount = record.wins + record.losses;
              const winrate =
                seriesCount > 0
                  ? Math.round((record.wins / seriesCount) * 100)
                  : null;
              const players = team.players.filter((player) => player.trim());

              return (
                <article key={team.id} className={styles.teamPage}>
                  <h4 className={styles.teamName}>{team.name}</h4>

                  <div className={styles.teamStats}>
                    <span className={styles.statWins}>{record.wins}V</span>
                    <span className={styles.statLosses}>{record.losses}D</span>
                    <span className={styles.statRate}>
                      {winrate === null
                        ? "sem partidas"
                        : `${winrate}% de vitória`}
                    </span>
                  </div>

                  {players.length > 0 ? (
                    <ul className={styles.teamPlayers}>
                      {players.map((player, index) => (
                        <li key={index}>{player}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className={styles.noPlayers}>
                      Sem jogadores vinculados a esta equipe
                    </p>
                  )}

                  {isManage && (
                    <div className={styles.teamActions}>
                      <button
                        type="button"
                        className={styles.teamAction}
                        onClick={() => openFormForEdit(team)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className={styles.teamAction}
                        onClick={() => removeTeam(team.id)}
                      >
                        Excluir
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          <nav className={styles.carouselNav}>
            <button
              type="button"
              className={clsx(styles.carouselArrow)}
              disabled={pageIndex <= 0}
              onClick={() => scrollToPage(pageIndex - 1)}
            >
              ←
            </button>

            {teams.map((team, index) => (
              <button
                key={team.id}
                type="button"
                className={clsx(
                  styles.carouselDot,
                  index === pageIndex && styles.carouselDotActive,
                )}
                onClick={() => scrollToPage(index)}
              />
            ))}

            <button
              type="button"
              className={clsx(styles.carouselArrow)}
              disabled={pageIndex >= teams.length - 1}
              onClick={() => scrollToPage(pageIndex + 1)}
            >
              →
            </button>
          </nav>
        </>
      )}
    </section>
  );
};