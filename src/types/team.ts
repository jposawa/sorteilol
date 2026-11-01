export type RegisteredTeam = {
  id: string;
  name: string;
  /** Jogadores do time (até 5, LoL padrão); entradas vazias são ignoradas na exibição. */
  players: string[];
};