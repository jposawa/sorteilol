import type { DraftGame } from "./session";

export type CompetitionStatus = "registration" | "active";

/**
 * Formato de draft escolhido ao registrar a competição; vale para TODAS as
 * partidas (matches) da série.
 */
export type DraftFormat = "fearless" | "standard";

export type CompetitionTeam = {
  seed: number;
  /** id da equipe registrada de onde este time veio. */
  teamId: string;
  name: string;
  /** Snapshot do elenco da equipe registrada no momento da inscrição. */
  players: string[];
};

export type MatchWinner = "seedA" | "seedB";

/**
 * Série do sistema suíço. No fluxo com draft, o `winner` é definido ao
 * ENCERRAR o draft da partida — o draft integral fica salvo em `draftState`;
 * records dos times NÃO são armazenados, derivam sempre de `matches`.
 */
export type CompetitionMatch = {
  round: number;
  seedA: number;
  seedB: number;
  winner: MatchWinner | null;
  seriesLength: 1 | 3;
  draftFormat: DraftFormat;
  draftState: DraftGame | null;
};

export type Competition = {
  id: string;
  name: string;
  draftFormat: DraftFormat;
  createdAt: number;
  status: CompetitionStatus;
  teams: CompetitionTeam[];
  matches: CompetitionMatch[];
};