import React from "react";

import { DraftBoard } from "@/fragments/Draft";
import { createEmptyGame } from "@/helpers";
import {
  getCompetitionLockedKeys,
  matchRefKey,
  useCompetition,
} from "@/hooks/useCompetition";
import { TeamKey } from "@/types";

import styles from "./Competition.module.css";

type MatchDraftViewProps = {
  matchKey: string;
  onClose: () => void;
};

/**
 * Draft INTEGRAL de uma partida da competição: o estado fica salvo no
 * próprio match (bans, picks e turno) e o resultado da série é definido ao
 * encerrar o draft.
 */
export const MatchDraftView: React.FC<MatchDraftViewProps> = ({
  matchKey,
  onClose,
}) => {
  const {
    activeCompetition,
    banMatchChampion,
    skipMatchTurn,
    setMatchPick,
    swapMatchPicks,
    moveMatchPick,
    finishMatch,
  } = useCompetition();

  if (!activeCompetition) {
    return null;
  }

  const match = activeCompetition.matches.find(
    (candidate) => matchRefKey(candidate) === matchKey,
  );

  if (!match || match.seedB === -1) {
    return null;
  }

  const teamA = activeCompetition.teams.find(
    (team) => team.seed === match.seedA,
  );
  const teamB = activeCompetition.teams.find(
    (team) => team.seed === match.seedB,
  );
  const lockedKeys = getCompetitionLockedKeys(activeCompetition, matchKey);

  return (
    <section className={styles.matchDraftScreen}>
      <DraftBoard
        title={`Rodada ${match.round} — ${teamA?.name ?? "Time A"} vs ${teamB?.name ?? "Time B"}`}
        subtitle={`Bo${match.seriesLength} · ${match.draftFormat === "fearless" ? "Fearless draft — picks de partidas anteriores bloqueados" : "Sem fearless"}`}
        sideLabels={{
          [TeamKey.TeamA]: teamA?.name,
          [TeamKey.TeamB]: teamB?.name,
        }}
        score={
          match.winner
            ? {
                [TeamKey.TeamA]: match.winner === "seedA" ? 1 : 0,
                [TeamKey.TeamB]: match.winner === "seedB" ? 1 : 0,
              }
            : undefined
        }
        lockedKeys={lockedKeys}
        draftGame={match.draftState ?? createEmptyGame()}
        hasResult={match.winner !== null}
        onLeave={onClose}
        onBan={(championKey) =>
          banMatchChampion(matchKey, championKey, lockedKeys)
        }
        onSkipTurn={() => skipMatchTurn(matchKey)}
        onPick={(side, lane, championKey) =>
          setMatchPick(matchKey, side, lane, championKey, lockedKeys)
        }
        onSwapPicks={(side, fromLane, toLane) =>
          swapMatchPicks(matchKey, side, fromLane, toLane)
        }
        onMovePick={(side, fromLane, toLane) =>
          moveMatchPick(matchKey, side, fromLane, toLane)
        }
        onFinish={(winner) => finishMatch(matchKey, winner)}
      />

      {match.draftState && (
        <aside className={styles.draftRecordNote}>
          O rascunho desta partida (bans, picks e resultado) fica salvo junto
          da competição.
        </aside>
      )}
    </section>
  );
};