/**
 * Estado remoto (appbackend.io) em Zustand: uma store por tabela, todas
 * com o mesmo contrato: load (com paginação), create, update, remove e
 * leitura derivada por id. É a fonte dos dados de cadastro; as interações
 * de draft ao vivo continuam nas atoms locais (jotai) do projeto.
 */
import { create, type StoreApi, type UseBoundStore } from "zustand";

import type {
  BackendTableKey,
  ChampionRow,
  CompetitionRow,
  CompetitionTeamRow,
  DraftActionRow,
  DraftRow,
  GameRow,
  MatchRow,
  OrganizationRow,
  OrgMemberRow,
  PersonRow,
  RawBackendRow,
  TeamMemberRow,
  TeamRow,
} from "@/services/appBackend";
import type { BackendTableKey as TableKey } from "@/services/appBackend";
import { backendApi,backendField } from "@/services/appBackend";

export type RemoteStatus = "idle" | "loading" | "ready" | "error";

export type RemoteTableState<TRow extends { _id: string }> = {
  rows: TRow[];
  status: RemoteStatus;
  error: string | null;
  /** Busca a tabela no backend (todas as páginas). Ignora se já pronta. */
  load: (options?: { force?: boolean }) => Promise<TRow[]>;
  /** Cria N linhas (POST array) e junta na store. */
  create: (
    payloads: Record<string, unknown>[],
  ) => Promise<(TRow & { _id: string })[]>;
  /** PATCH lógico: merge com a linha atual e PUT da row completa. */
  update: (_id: string, patch: Record<string, unknown>) => Promise<void>;
  /** Remove por array de _id. */
  remove: (ids: string[]) => Promise<void>;
  getById: (_id: string) => TRow | undefined;
  reset: () => void;
};

const { num, str } = backendField;

export const createRemoteTableStore = <TRow extends { _id: string }>(
  table: TableKey,
  mapRow: (raw: RawBackendRow) => TRow,
): UseBoundStore<StoreApi<RemoteTableState<TRow>>> => {
  // Promessa do carregamento em curso: chamar load() duas vezes (React
  // StrictMode monta os effects duas vezes) reusa a MESMA requisição,
  // em vez de abandoná-la a meio (o 2º caller só veria []).
  let inflight: Promise<TRow[]> | null = null;

  return create<RemoteTableState<TRow>>()((set, get) => ({
    rows: [],
    status: "idle",
    error: null,

    load: async (options) => {
      if (inflight) {
        return inflight;
      }

      const { status, rows } = get();

      if (status === "ready" && !options?.force) {
        return rows;
      }

      inflight = (async () => {
        set({ status: "loading", error: null });

        try {
          const raws = await backendApi.listAll<RawBackendRow>(table as BackendTableKey);
          const mapped = raws.map(mapRow);

          set({ rows: mapped, status: "ready" });

          return mapped;
        } catch (error) {
          set({
            status: "error",
            error: error instanceof Error ? error.message : String(error),
          });

          return [];
        } finally {
          inflight = null;
        }
      })();

      return inflight;
    },

    create: async (payloads) => {
      if (payloads.length === 0) {
        return [];
      }

      const created = await backendApi.create<RawBackendRow>(table as BackendTableKey, payloads);
      const rows = created.map(mapRow);

      set((prev) => ({ rows: [...rows, ...prev.rows] }));

      return rows;
    },

    update: async (_id, patch) => {
      const rawCurrent = get().rows.find((row) => row._id === _id);

      if (!rawCurrent) {
        return;
      }

      await backendApi.update<RawBackendRow>(
        table as BackendTableKey,
        rawCurrent as unknown as RawBackendRow,
        patch,
      );

      set((prev) => ({
        rows: prev.rows.map((row) =>
          row._id === _id
            ? mapRow({ ...(rawCurrent as RawBackendRow), ...patch, _id })
            : row,
        ),
      }));
    },

    remove: async (ids) => {
      if (ids.length === 0) {
        return;
      }

      await backendApi.remove(table as BackendTableKey, ids);
      set((prev) => ({ rows: prev.rows.filter((row) => !ids.includes(row._id)) }));
    },

    getById: (_id) => get().rows.find((row) => row._id === _id),

    reset: () => set({ rows: [], status: "idle", error: null }),
  }));
};

/* ── Mapeadores: colunas TEXT → tipos do domínio ──────────────────── */

export const useBackendTeams = createRemoteTableStore(
  "teams",
  (raw): TeamRow => ({
    _id: String(raw._id),
    teamid: str(raw.teamid),
    orgid: str(raw.orgid),
    teamname: str(raw.teamname),
    teamtag: str(raw.teamtag),
    createdat: str(raw.createdat),
    isactiveteam: backendField.bool(raw.isactiveteam),
    teammembers: str(raw.teammembers),
  }),
);

export const useBackendPersons = createRemoteTableStore(
  "persons",
  (raw): PersonRow => ({
    _id: String(raw._id),
    personid: str(raw.personid),
    handle: str(raw.handle),
    realname: str(raw.realname),
    country: str(raw.country),
    birthdate: str(raw.birthdate),
  }),
);

export const useBackendOrganizations = createRemoteTableStore(
  "organizations",
  (raw): OrganizationRow => ({
    _id: String(raw._id),
    orgid: str(raw.orgid),
    orgname: str(raw.orgname),
    orgtag: str(raw.orgtag),
  }),
);

export const useBackendOrgMembers = createRemoteTableStore(
  "orgMembers",
  (raw): OrgMemberRow => ({
    _id: String(raw._id),
    memberid: str(raw.memberid),
    orgid: str(raw.orgid),
    personid: str(raw.personid),
    role: str(raw.role),
    fromdate: str(raw.fromdate),
    todate: str(raw.todate),
  }),
);

export const useBackendTeamMembers = createRemoteTableStore(
  "teamMembers",
  (raw): TeamMemberRow => ({
    _id: String(raw._id),
    memberid: str(raw.memberid),
    teamid: str(raw.teamid),
    personid: str(raw.personid),
    gamerole: str(raw.gamerole),
    fromdate: str(raw.fromdate),
    todate: str(raw.todate),
  }),
);

export const useBackendChampions = createRemoteTableStore(
  "champions",
  (raw): ChampionRow => ({
    _id: String(raw._id),
    championid: str(raw.championid),
    name: str(raw.name),
    classes: str(raw.classes),
  }),
);

export const useBackendCompetitions = createRemoteTableStore(
  "competition",
  (raw): CompetitionRow => ({
    _id: String(raw._id),
    competitionid: str(raw.competitionid),
    name: str(raw.name),
    draftformat: str(raw.draftformat),
    advancewins: num(raw.advancewins),
    eliminatelosses: num(raw.eliminatelosses),
    status: str(raw.status),
    createdat: str(raw.createdat),
  }),
);

export const useBackendCompetitionTeams =
  createRemoteTableStore(
    "competitionTeams",
    (raw): CompetitionTeamRow => ({
      _id: String(raw._id),
      rowid: str(raw.rowid),
      competitionid: str(raw.competitionid),
      teamid: str(raw.teamid),
      seed: num(raw.seed),
      registeredat: str(raw.registeredat),
      active: backendField.bool(raw.active),
    }),
  );

export const useBackendMatches = createRemoteTableStore(
  "matches",
  (raw): MatchRow => ({
    _id: String(raw._id),
    matchid: str(raw.matchid),
    competitionid: str(raw.competitionid),
    round: num(raw.round),
    teamaid: str(raw.teamaid),
    teambid: str(raw.teambid),
    teamaseed: num(raw.teamaseed),
    teambseed: num(raw.teambseed),
    seriesformat: num(raw.seriesformat),
    winnerteamid: str(raw.winnerteamid),
    winnersource: str(raw.winnersource),
    status: str(raw.status),
    createdat: str(raw.createdat),
  }),
);

export const useBackendGames = createRemoteTableStore(
  "games",
  (raw): GameRow => ({
    _id: String(raw._id),
    gameid: str(raw.gameid),
    matchid: str(raw.matchid),
    gamenumber: num(raw.gamenumber),
    winnerteamid: str(raw.winnerteamid),
    startedat: str(raw.startedat),
  }),
);

export const useBackendDrafts = createRemoteTableStore(
  "drafts",
  (raw): DraftRow => ({
    _id: String(raw._id),
    draftid: str(raw.draftid),
    gameid: str(raw.gameid),
    format: str(raw.format),
    status: str(raw.status),
    turnindex: num(raw.turnindex),
    winnerside: str(raw.winnerside),
    createdat: str(raw.createdat),
    finishedat: str(raw.finishedat),
  }),
);

export const useBackendDraftActions =
  createRemoteTableStore(
    "draftActions",
    (raw): DraftActionRow => ({
      _id: String(raw._id),
      actionid: str(raw.actionid),
      draftid: str(raw.draftid),
      turnindex: num(raw.turnindex),
      kind: str(raw.kind),
      side: str(raw.side),
      lane: str(raw.lane),
      championid: str(raw.championid),
      phaseindex: num(raw.phaseindex),
      source: str(raw.source),
      decidedat: str(raw.decidedat),
    }),
  );

export const ALL_BACKEND_STORES = [
  useBackendTeams,
  useBackendPersons,
  useBackendOrganizations,
  useBackendOrgMembers,
  useBackendTeamMembers,
  useBackendChampions,
  useBackendCompetitions,
  useBackendCompetitionTeams,
  useBackendMatches,
  useBackendGames,
  useBackendDrafts,
  useBackendDraftActions,
];
