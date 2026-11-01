import { type DraftTurn, TeamKey } from "@/types";

/** Bans por time no draft completo: 3 na fase 1 + 2 na fase 2. */
export const BANS_PER_TEAM = 5;

export const TOTAL_BANS = BANS_PER_TEAM * 2;
export const TOTAL_PICKS = 10;
export const TOTAL_TURNS = TOTAL_BANS + TOTAL_PICKS;

/** Alternância simples A/B (Time A começa) — padrão das fases de bans. */
const alternated = (count: number, first: TeamKey): TeamKey[] =>
  Array.from({ length: count }, (_, index) =>
    index % 2 === 0
      ? first
      : first === TeamKey.TeamA
        ? TeamKey.TeamB
        : TeamKey.TeamA,
  );

/**
 * Padrão "1-2-2-1" das fases de picks: o lado que faz o pick 1 espera o
 * lado oposto fazer 2 picks seguidos, completa os seus outros 2, e o lado
 * oposto fecha com o último pick.
 */
const pickPattern = (first: TeamKey): TeamKey[] => {
  const second = first === TeamKey.TeamA ? TeamKey.TeamB : TeamKey.TeamA;

  return [first, second, second, first, first, second];
};

/**
 * Padrão "1-2-1" da roda final de picks (2 por lado): quem ENCERROU a roda
 * de picks anterior abre com um pick, devolve os 2 seguintes ao lado oposto
 * e fecha com o last pick — o time do first pick não pode fazer o last pick.
 */
const pickPatternFinal = (lastPicker: TeamKey): TeamKey[] => {
  const other = lastPicker === TeamKey.TeamA ? TeamKey.TeamB : TeamKey.TeamA;

  return [lastPicker, other, other, lastPicker];
};

const banTurns = (count: number, first: TeamKey): DraftTurn[] =>
  alternated(count, first).map((side, i) => ({
    kind: "ban" as const,
    side,
    phaseIndex: i,
  }));

const pickTurns = (order: TeamKey[]): DraftTurn[] =>
  order.map((side, i) => ({ kind: "pick" as const, side, phaseIndex: i }));

/**
 * Agenda completa de turnos do draft (modelo competitivo pedido):
 *   Fase 1 — 3 bans por time, alternados (A,B,A,B,A,B)
 *   Fase 2 — 3 picks por time no padrão 1-2-2-1 (A,B,B,A,A,B)
 *   Fase 3 — 2 bans por time, retomado pela equipe OPOSTA à que baniu por
 *            último na fase 1 (B baniu por último → A recomeça: A,B,A,B)
 *   Fase 4 — 2 picks por time no padrão 1-2-1, aberto e fechado por quem
 *            encerrou a roda de picks anterior (B,A,A,B) — o time do
 *            first pick (A) não pode fazer o last pick.
 */
export const DRAFT_TURNS: DraftTurn[] = [
  ...banTurns(6, TeamKey.TeamA),
  ...pickTurns(pickPattern(TeamKey.TeamA)),
  ...banTurns(4, TeamKey.TeamA),
  ...pickTurns(pickPatternFinal(
    pickPattern(TeamKey.TeamA)[pickPattern(TeamKey.TeamA).length - 1],
  )),
];