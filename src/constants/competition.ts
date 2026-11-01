export const MAX_COMPETITION_TEAMS = 12;

export const MIN_COMPETITION_TEAMS = 2;

/**
 * Regras do suíço do competitivo de LoL (Riot): 3 vitórias de série avançam,
 * 3 derrotas eliminam. As duas primeiras rodadas são Bo1; a partir da terceira,
 * todas as séries são Bo3.
 */
export const ADVANCE_WINS = 3;

export const ELIMINATION_LOSSES = 3;

export const BO1_ROUND_LIMIT = 2;

export const seriesLengthForRound = (round: number): 1 | 3 => {
  return round <= BO1_ROUND_LIMIT ? 1 : 3;
};

/**
 * Adversário "nulo" de um match de bye: time sem par na rodada ganha por
 * vitória administrativa (senão, com N ímpar de times ativos, o suíço 3W/3L
 * trava com o mesmo time aguardando para sempre).
 */
export const NULL_OPPONENT_SEED = -1;

export type DraftFormatOption = {
  value: "fearless" | "standard";
  label: string;
};

export const DRAFT_FORMAT_OPTIONS: DraftFormatOption[] = [
  { value: "fearless", label: "Fearless draft" },
  { value: "standard", label: "Padrão" },
];