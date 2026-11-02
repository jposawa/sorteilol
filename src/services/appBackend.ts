/**
 * Cliente do backend provisório (appbackend.io).
 *
 * Contrato real da API (verificado em runtime):
 * - GET  /v1/rows/{table}?page=N → { data: Row[], page, count, perPage }
 *   (perPage = 100; `count` é o TOTAL — iterate até cobrir todas as páginas)
 * - GET  /v1/rows/{table}/{_id} → Row | { error, code, info }
 * - POST /v1/rows/{table}       → body: ARRAY de rows; resposta: array de
 *   rows criadas (com `_id`/`order`/`createdAt` gerados pela plataforma)
 * - PUT  /v1/rows/{table}       → body: row COMPLETA (todas as colunas) com
 *   `_id`; campos desconhecidos derrubam a request (HTTP 500)
 * - DELETE /v1/rows/{table}     → body: array de `_id` (strings)
 *
 * Todos os campos são TEXT na planilha; números/booleans chegam como
 * string e os mapeadores convertem.
 */

/** Id de cada tabela no appbackend (fornecidos pelo usuário no painel). */
export const BACKEND_TABLES = {
  competition: "twiW5fP1E897",
  champions: "bx5bUPZ60r1b",
  competitionTeams: "HHMrawIZRYBW",
  draftActions: "XU4d3gKZ8vl4",
  drafts: "zxA5odLkxH08",
  games: "ys28dViOX7IH",
  matches: "sR7HZMD0CAy1",
  organizations: "n7EOEBZ1vrx9",
  orgMembers: "ZlCXXT41PPQQ",
  persons: "wnIL1BjGsLF8",
  teamMembers: "t5Oa3UYDTReq",
  teams: "AznTt8Gs2Hn8",
} as const;

export type BackendTableKey = keyof typeof BACKEND_TABLES;

/** Executa a escrita remota fora do render (o estado local já foi aplicado). */
export const backendWriteThrough = (operation: () => Promise<unknown>) => {
  void operation().catch((error) => console.error("[backend write-through]", error));
};

const API_BASE = "https://v1.appbackend.io/v1/rows";

export type RawBackendRow = Record<string, unknown> & { _id: string };

export type BackendPage<T extends RawBackendRow> = {
  data: T[];
  page: number;
  count: number;
  perPage: number;
};

export const backendField = {
  str: (value: unknown) =>
    typeof value === "string" ? value : value == null ? "" : String(value),
  num: (value: unknown) => {
    const parsed = typeof value === "number" ? value : Number(value ?? 0);

    return Number.isFinite(parsed) ? parsed : 0;
  },
  bool: (value: unknown) => value === true || value === "true",
};

/** Tipos das linhas DOMÍNIO (campos numéricos/boolean já convertidos). */
export type TeamRow = {
  _id: string;
  teamid: string;
  orgid: string;
  teamname: string;
  teamtag: string;
  createdat: string;
  isactiveteam: boolean;
  teammembers: string;
};
export type PersonRow = {
  _id: string;
  personid: string;
  handle: string;
  realname: string;
  country: string;
  birthdate: string;
};
export type OrganizationRow = {
  _id: string;
  orgid: string;
  orgname: string;
  orgtag: string;
};
export type OrgMemberRow = {
  _id: string;
  memberid: string;
  orgid: string;
  personid: string;
  role: string;
  fromdate: string;
  todate: string;
};
export type TeamMemberRow = {
  _id: string;
  memberid: string;
  teamid: string;
  personid: string;
  gamerole: string;
  fromdate: string;
  todate: string;
};
export type ChampionRow = {
  _id: string;
  championid: string;
  name: string;
  classes: string;
};
export type CompetitionRow = {
  _id: string;
  competitionid: string;
  name: string;
  draftformat: string;
  advancewins: number;
  eliminatelosses: number;
  status: string;
  createdat: string;
};
export type CompetitionTeamRow = {
  _id: string;
  rowid: string;
  competitionid: string;
  teamid: string;
  seed: number;
  registeredat: string;
  active: boolean;
};
export type MatchRow = {
  _id: string;
  matchid: string;
  competitionid: string;
  round: number;
  teamaid: string;
  teambid: string;
  teamaseed: number;
  teambseed: number;
  seriesformat: number;
  winnerteamid: string;
  winnersource: string;
  status: string;
  createdat: string;
};
export type GameRow = {
  _id: string;
  gameid: string;
  matchid: string;
  gamenumber: number;
  winnerteamid: string;
  startedat: string;
};
export type DraftRow = {
  _id: string;
  draftid: string;
  gameid: string;
  format: string;
  status: string;
  turnindex: number;
  winnerside: string;
  createdat: string;
  finishedat: string;
};
export type DraftActionRow = {
  _id: string;
  actionid: string;
  draftid: string;
  turnindex: number;
  kind: string;
  side: string;
  lane: string;
  championid: string;
  phaseindex: number;
  source: string;
  decidedat: string;
};

const request = async <T>(
  table: BackendTableKey,
  init: RequestInit = {},
): Promise<T> => {
  const response = await fetch(`${API_BASE}/${BACKEND_TABLES[table]}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  const payload = (await response.json().catch(() => null)) as
    | { error?: unknown; code?: unknown; info?: unknown; message?: unknown }
    | T
    | null;

  if (!response.ok || (payload && typeof payload === "object" && "error" in payload)) {
    throw new Error(
      `appbackend ${table}: ${(payload as { info?: string })?.info ?? response.status}`,
    );
  }

  return payload as T;
};

export const backendApi = {
  /** Lista TODAS as linhas da tabela (percorre as páginas do backend). */
  async listAll<T extends RawBackendRow>(table: BackendTableKey): Promise<T[]> {
    const first = await request<BackendPage<T>>(table);

    const rows: T[] = [...first.data];
    const { count, perPage } = first;
    const lastPage = Math.ceil(count / perPage);

    for (let page = 2; page <= lastPage; page += 1) {
      const paged = await fetch(
        `${API_BASE}/${BACKEND_TABLES[table]}?page=${page}`,
        { headers: { "Content-Type": "application/json" } },
      ).then((res) => res.json() as Promise<BackendPage<T>>);

      rows.push(...paged.data);
    }

    return rows;
  },

  async getOne<T extends RawBackendRow>(
    table: BackendTableKey,
    id: string,
  ): Promise<T> {
    if (!id) {
      throw new Error(`appbackend ${table}: _id obrigatório`);
    }

    const response = await fetch(
      `${API_BASE}/${BACKEND_TABLES[table]}/${id}`,
      { headers: { "Content-Type": "application/json" } },
    );
    const payload = (await response.json().catch(() => null)) as
      | (T & { error?: unknown })
      | null;

    if (!response.ok || !payload || payload.error) {
      throw new Error(
        `appbackend ${table}/${id}: ${response.ok ? "não encontrado" : response.status}`,
      );
    }

    return payload;
  },

  /** Criação: body é ARRAY; resposta é array das rows criadas. */
  async create<T extends RawBackendRow>(
    table: BackendTableKey,
    payloads: Record<string, unknown>[],
  ): Promise<T[]> {
    return request<T[]>(table, {
      method: "POST",
      body: JSON.stringify(payloads),
    });
  },

  /** Update: exige a row completa — merge do raw atual + patch. */
  async update<T extends RawBackendRow>(
    table: BackendTableKey,
    current: RawBackendRow,
    patch: Record<string, unknown>,
  ): Promise<T> {
    const full = { ...current, ...patch };

    delete full.createdAt;
    delete full.updatedAt;
    delete full.order;

    return request<T>(table, {
      method: "PUT",
      body: JSON.stringify(full),
    });
  },

  async remove(table: BackendTableKey, ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    await request<unknown>(table, {
      method: "DELETE",
      body: JSON.stringify(ids),
    });
  },
};