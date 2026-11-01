import { type Lane, type TeamKey } from "./match";

export type SessionFormat = 1 | 3 | 5;

export type SessionStatus = "active" | "done";

export type DraftBans = Record<TeamKey, (string | null)[]>;

export type DraftPicks = Record<TeamKey, Record<Lane, string | null>>;

export type DraftGame = {
  bans: DraftBans;
  picks: DraftPicks;
  /**
   * Turno corrente na agenda do draft (0..TOTAL_TURNS-1). Avança a cada ban,
   * pick ou skip; TOTAL_TURNS = draft completo.
   */
  turnIndex: number;
  /**
   * Turno da agenda antiga (pré-fases, 0..9 bans alternados seguidos). Só
   * lido para migrar drafts persistidos antes do modelo de turnos.
   */
  banCursor?: number;
  /**
   * Time vencedor da partida — marcado ao encerrar; alimenta as estatísticas
   * de winrate de campeões da tela inicial. null = encerrada sem resultado.
   */
  winner: TeamKey | null;
};

export type DraftSession = {
  id: string;
  createdAt: number;
  format: SessionFormat;
  /**
   * Nomes das equipes nos lados do draft — do Randomizer ("Time Alpha/Omega")
   * ou das equipes reais de uma competição. Ausente: "Time A"/"Time B".
   */
  teams?: Partial<Record<TeamKey, string>>;
  games: DraftGame[];
  currentGame: DraftGame;
  status: SessionStatus;
};