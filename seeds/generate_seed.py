"""Gera os dados de seed (CSVs + spec do xlsx) para importar no appbackend.io.

Determinístico (seed 42). Fonte de campeões: seeds/champion.json (ddragon
16.21.1). A agenda de draft replica src/constants/draft.ts (20 turnos).
"""
import csv
import json
import os
import random
from datetime import date

random.seed(42)

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "appbackend")
os.makedirs(OUT, exist_ok=True)

TAG_PT = {
    "Fighter": "Lutador", "Mage": "Mago", "Assassin": "Assassino",
    "Marksman": "Atirador", "Tank": "Tanque", "Support": "Suporte",
}
LANES = ["top", "jungle", "mid", "adc", "support"]
LANE_POOLS = {  # classes em PT, como em ChampionClass do app
    "top": ["Lutador", "Tanque", "Mago"],
    "jungle": ["Lutador", "Assassino", "Tanque"],
    "mid": ["Mago", "Assassino"],
    "adc": ["Atirador"],
    "support": ["Suporte", "Mago"],
}

# ── Catálogo de campeões ──────────────────────────────────────────────
with open(os.path.join(HERE, "champion.json"), encoding="utf-8") as fh:
    dd = json.load(fh)["data"]

CHAMPS = {
    cid: {"id": cid, "name": c["name"],
          "classes": sorted(TAG_PT[t] for t in c["tags"])}
    for cid, c in sorted(dd.items(), key=lambda item: item[1]["key"])
}
POOL_BY_LANE = {
    lane: [cid for cid, c in CHAMPS.items() if any(t in c["classes"] for t in tags)]
    for lane, tags in LANE_POOLS.items()
}
ALL_POOL = list(CHAMPS)


def pick_champion(pool, used, locked):
    """Sorteia fora dos usados no draft e dos trancados (fearless)."""
    options = [cid for cid in pool if cid not in used and cid not in locked]
    if not options:
        options = [cid for cid in ALL_POOL if cid not in used and cid not in locked]
    if not options:
        # garantia final: campeão inédito no draft (locks de torneio podem
        # esgotar um pool inteiro no pior caso)
        options = [cid for cid in ALL_POOL if cid not in used]
    return random.choice(options)


# ── Agenda de 20 turnos (espelho de src/constants/draft.ts) ──────────
# F1 bans ×6 | F2 picks 1-2-2-1 | F3 bans ×4 | F4 picks A,B,B,A
TIMELINE = [
    (0, "ban", "A", 0), (1, "ban", "B", 0), (2, "ban", "A", 1),
    (3, "ban", "B", 1), (4, "ban", "A", 2), (5, "ban", "B", 2),
    (6, "pick", "A", 0), (7, "pick", "B", 0), (8, "pick", "B", 1),
    (9, "pick", "A", 1), (10, "pick", "A", 2), (11, "pick", "B", 2),
    (12, "ban", "A", 0), (13, "ban", "B", 0), (14, "ban", "A", 1),
    (15, "ban", "B", 1),
    (16, "pick", "A", 3), (17, "pick", "B", 3), (18, "pick", "B", 4),
    (19, "pick", "A", 4),
]

FIRST_NAMES = [
    "Rafael", "João", "Lucas", "Gabriel", "Matheus", "Pedro", "Vinícius",
    "Thiago", "Bruno", "Caio", "Diego", "Éverton", "Felipe", "Henrique",
    "Igor", "Jorge", "Kevin", "Leandro", "Mateus", "Nicolas", "Otávio",
    "Paulo", "Ricardo", "Rodrigo", "Sérgio", "Tales", "Vitor", "Yago",
    "Danilo", "Eduardo", "Fernando", "Gustavo", "Hugo", "Aline", "Bianca",
    "Camila", "Daniela", "Elisa", "Fernanda", "Giovana", "Helena",
    "Isabela", "Jéssica", "Karina", "Larissa", "Marina", "Natália",
    "Renata", "Sofia", "Tainá", "Vanessa", "Yasmin", "Amanda", "Bruna",
]
LAST_NAMES = [
    "Silva", "Souza", "Oliveira", "Pereira", "Costa", "Almeida", "Araújo",
    "Ribeiro", "Carvalho", "Gomes", "Martins", "Azevedo", "Barbosa",
    "Cardoso", "Correia", "Dias", "Duarte", "Farias", "Fonseca", "Lima",
    "Marques", "Moraes", "Moura", "Nogueira", "Pinheiro", "Ramos",
    "Rocha", "Santos", "Teixeira", "Vasconcelos",
]
HANDLE_A = [
    "Nyx", "Kai", "Zyn", "Void", "Frost", "Ember", "Storm", "Hollow",
    "Blaze", "Iron", "Wolf", "Raven", "Drift", "Hex", "Pixel", "Nova",
    "Echo", "Prime", "Fable", "Grim", "Zephyr", "Talon", "Mirage", "Onyx",
    "Volt", "Tundra", "Sable", "Quill", "Rune", "Vortex", "Prism", "Cobalt",
]
HANDLE_B = ["", "X", "z", "o", "Zy", "Storm", "Fire", "Frost", "Blade",
            "King", "Lord", "Master", "Reign", "Fang", "Horn", "Veil", "Owl"]

# ── Organizações ─────────────────────────────────────────────────────
ORGS = [
    ("org-aurora", "Aurora Esports", "AUR"),
    ("org-borealis", "Borealis Gaming", "BOG"),
    ("org-casadracao", "Casa do Dragão", "CDG"),
    ("org-equinocio", "Equinócio Esports", "EQN"),
    ("org-forjasul", "Forja Sul", "FJS"),
    ("org-guardioes", "Guardiões do Norte", "GDN"),
    ("org-marealta", "Maré Alta Esports", "MRE"),
    ("org-pantanal", "Pantanal Blitz", "PBL"),
]

used_handles = set()


def new_handle():
    while True:
        handle = random.choice(HANDLE_A) + random.choice(HANDLE_B)
        if handle not in used_handles:
            used_handles.add(handle)
            return handle


persons = []
person_rows = []


def new_person(reason):
    pid = f"p-{len(persons) + 1:03d}"
    handle = new_handle()
    real = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
    country = random.choice(["br"] * 7 + ["ar", "cl", "pt", "uy"])
    born = date(random.randint(2003, 2008), random.randint(1, 12),
                random.randint(1, 28))
    persons.append({"id": pid, "handle": handle, "reason": reason})
    person_rows.append([pid, handle, real, country, born.isoformat()])
    return persons[-1]


# ── Staff das organizações (dono, gerente, analista) ────────────────
org_member_rows = []
for om_idx, (org_id, _name, _tag) in enumerate(ORGS, start=1):
    for role in ("owner", "manager", "analyst"):
        m = new_person(f"org:{role}")
        # vínculos históricos encerrados em 2 casos, p/ exercitar toDate
        to_date = "2026-02-28" if role == "manager" and om_idx % 3 == 0 else ""
        org_member_rows.append([f"om-{om_idx:02d}-{role[:3]}", org_id, m["id"],
                                role, "2025-01-10", to_date])

# ── Times e elencos ──────────────────────────────────────────────────
TEAMS = [
    ("team-aurora-prime", "org-aurora", "Aurora Prime", "AUR-P"),
    ("team-aurora-nova", "org-aurora", "Aurora Nova", "AUR-N"),
    ("team-borealis-frost", "org-borealis", "Borealis Frost", "BOG"),
    ("team-cdg-azul", "org-casadracao", "Casa do Dragão Azul", "CDG-A"),
    ("team-cdg-vermelho", "org-casadracao", "Casa do Dragão Vermelho", "CDG-V"),
    ("team-equinocio", "org-equinocio", "Equinócio", "EQN"),
    ("team-forjasul", "org-forjasul", "Forja Sul", "FJS"),
    ("team-guardioes", "org-guardioes", "Guardiões do Norte", "GDN"),
    ("team-marealta", "org-marealta", "Maré Alta", "MRE"),
    ("team-pantanal", "org-pantanal", "Pantanal Blitz", "PBL"),
    ("team-nucleo-zero", None, "Núcleo Zero", "NUZ"),
    ("team-vento-leste", None, "Vento Leste", "VTL"),
    ("team-alpha", None, "Time Alpha", "ALP"),
    ("team-omega", None, "Time Omega", "OMG"),
]

team_rows = []
team_member_rows = []

for idx, (team_id, org_id, name, tag) in enumerate(TEAMS, start=1):
    handles = []
    for lane in LANES:
        p = new_person(f"player:{lane}")
        handles.append(p["handle"])
        team_member_rows.append([f"tm-{idx:02d}-{lane}", team_id, p["id"],
                                 lane, "2025-07-01", ""])
    sub = new_person("player:sub")
    handles.append(sub["handle"])
    team_member_rows.append([f"tm-{idx:02d}-sub", team_id, sub["id"],
                             "sub", "2025-07-01", ""])
    coach = new_person("coach")
    handles.append(coach["handle"])
    team_member_rows.append([f"tm-{idx:02d}-coach", team_id, coach["id"],
                             "coach", "2025-07-01", ""])
    team_rows.append([team_id, org_id or "", name, tag, "2025-06-01",
                      "true", "; ".join(handles)])

# ── Campeonatos ──────────────────────────────────────────────────────
comp_rows = [
    ["comp-hexa-m1", "Hexa Masters Split 1", "fearless", 3, 3, "active",
     "2026-10-12 10:00"],
    ["comp-copa-inv", "Copa Inverno 2026", "standard", 3, 3, "registration",
     "2026-10-28 09:30"],
]

competition_team_rows = []
hexa_teams = [t[0] for t in TEAMS[:10]] + ["team-nucleo-zero",
                                           "team-vento-leste"]
random.shuffle(hexa_teams)
for seed, team_id in enumerate(hexa_teams, start=1):
    competition_team_rows.append([f"ct-hexa-{seed:02d}", "comp-hexa-m1",
                                  team_id, seed, "2026-10-12 12:00", "true"])

inv_teams = [t[0] for t in TEAMS[:8]]
random.shuffle(inv_teams)
for seed, team_id in enumerate(inv_teams, start=1):
    competition_team_rows.append([f"ct-inv-{seed:02d}", "comp-copa-inv",
                                  team_id, seed, "2026-10-28 11:00", "true"])

# ── Partidas, jogos e drafts ─────────────────────────────────────────
seed_by_team = {t: i + 1 for i, t in enumerate(hexa_teams)}
seed_by_team.update({"team-alpha": 1, "team-omega": 2})

match_rows = []
game_rows = []
draft_rows = []
action_rows = []
tournament_locks = {}  # (comp_id, side_team) -> campeões pickados no torneio


def series(comp_id, m_id, round_no, team_a, team_b, fmt, games, status="done"):
    """games: [(winner_side ou '?', turnos_consumidos, data), ...]."""
    match_rows.append([m_id, comp_id, round_no, team_a, team_b,
                       seed_by_team[team_a], seed_by_team[team_b], fmt,
                       "", "", status, "2026-10-14 20:00"])
    wins = 0
    for no, (winner_side, turns_used, when) in enumerate(games, start=1):
        g_id = f"g-{m_id[2:]}-{no}"
        d_id = f"d-{g_id[2:]}"
        complete = turns_used >= 20
        resolved = winner_side != "?"
        winner_team = ""
        if resolved:
            winner_team = team_a if winner_side == "A" else team_b
            wins += 1 if winner_side == "A" else 0
        game_rows.append([g_id, m_id, no, winner_team, when])
        draft_rows.append([d_id, g_id, fmt,
                           "completed" if complete else "in_progress",
                           20 if complete else turns_used,
                           winner_side if resolved and complete else "",
                           when, when if complete else ""])

        used = set()
        picked_lanes = {"A": [], "B": []}
        picked = {"A": [], "B": []}
        for turn, kind, side, phase in TIMELINE[:turns_used]:
            if kind == "pick":
                lane = next(l for l in LANES if l not in picked_lanes[side])
                picked_lanes[side].append(lane)
                pool = POOL_BY_LANE[lane]
            else:
                lane = ""
                pool = ALL_POOL
            # fearless: campeões que o TIME pickou antes neste torneio
            team = team_a if side == "A" else team_b
            locked = set() if not comp_id else set(
                tournament_locks.get((comp_id, team), set()))
            champion = pick_champion(pool, used, locked)
            used.add(champion)
            action_rows.append([f"da-{d_id[2:]}-t{turn:02d}", d_id, turn,
                                kind, side, lane, champion, phase,
                                "manual", when])
            if kind == "pick":
                picked[side].append(champion)
        if complete:
            for side in ("A", "B"):
                if comp_id:
                    team = team_a if side == "A" else team_b
                    tournament_locks.setdefault(
                        (comp_id, team), set()).update(picked[side])
    if status == "done":
        match_rows[-1][8] = team_a if wins * 2 >= len(games) * 2 - \
            (sum(1 for g in games if g[0] != "?") // 2) else team_b
        match_rows[-1][8] = team_a if wins > (len(games) - wins) else team_b
        match_rows[-1][9] = "draft"


series("comp-hexa-m1", "m-hexa-r1-1", 1, hexa_teams[0], hexa_teams[1], 1,
       [("A", 20, "2026-10-15 19:00")])
series("comp-hexa-m1", "m-hexa-r1-2", 1, hexa_teams[2], hexa_teams[3], 1,
       [("B", 20, "2026-10-15 20:30")])
series("comp-hexa-m1", "m-hexa-r1-3", 1, hexa_teams[4], hexa_teams[5], 1,
       [("A", 20, "2026-10-16 19:00")])
series("comp-hexa-m1", "m-hexa-r1-4", 1, hexa_teams[6], hexa_teams[7], 1,
       [("A", 20, "2026-10-16 20:30")])
series("comp-hexa-m1", "m-hexa-r1-5", 1, hexa_teams[8], hexa_teams[9], 1,
       [("B", 20, "2026-10-17 19:00")])
series("comp-hexa-m1", "m-hexa-r1-6", 1, hexa_teams[10], hexa_teams[11], 1,
       [("B", 20, "2026-10-17 20:30")])
# R2 — vencedores da rodada 1 (Bo3)
series("comp-hexa-m1", "m-hexa-r2-w1", 2, hexa_teams[0], hexa_teams[2], 3,
       [("A", 20, "2026-10-22 19:00"), ("A", 20, "2026-10-22 20:15")])
series("comp-hexa-m1", "m-hexa-r2-w2", 2, hexa_teams[4], hexa_teams[6], 3,
       [("A", 20, "2026-10-23 19:00"), ("B", 20, "2026-10-23 20:15"),
        ("?", 7, "2026-10-24 19:00")], status="live")
series("comp-hexa-m1", "m-hexa-r2-w3", 2, hexa_teams[10], hexa_teams[4], 3,
       [("B", 20, "2026-10-23 21:00"), ("?", 12, "2026-10-24 20:30")],
       status="live")
# R2 — perdedores da rodada 1 (Bo1)
series("comp-hexa-m1", "m-hexa-r2-l1", 2, hexa_teams[1], hexa_teams[3], 1,
       [("A", 20, "2026-10-21 19:00")])
series("comp-hexa-m1", "m-hexa-r2-l2", 2, hexa_teams[7], hexa_teams[8], 1,
       [("B", 20, "2026-10-21 20:30")])
series("comp-hexa-m1", "m-hexa-r2-l3", 2, hexa_teams[10], hexa_teams[5], 1,
       [("A", 20, "2026-10-21 21:00")])
# Sessões avulsas do Randomizer (sem campeonato)
series("", "m-avulsa-bo1", 0, "team-alpha", "team-omega", 1,
       [("A", 20, "2026-10-30 22:00")])
series("", "m-avulsa-bo3", 0, "team-alpha", "team-omega", 3,
       [("A", 20, "2026-10-31 21:00"), ("A", 20, "2026-10-31 21:40")])

# ── Campeões (CSV) ───────────────────────────────────────────────────
champion_rows = [[c["id"], c["name"], "; ".join(c["classes"])]
                 for c in CHAMPS.values()]

# ── Escrita dos CSVs ─────────────────────────────────────────────────
TABLES = {
    "champions": ["championId", "name", "classes"],
    "persons": ["personId", "handle", "realName", "country", "birthDate"],
    "organizations": ["orgId", "orgName", "orgTag"],
    "orgMembers": ["memberId", "orgId", "personId", "role", "fromDate",
                   "toDate"],
    "teams": ["teamId", "orgId", "teamName", "teamTag", "createdAt",
              "isActiveTeam", "teamMembers"],
    "teamMembers": ["memberId", "teamId", "personId", "gameRole", "fromDate",
                    "toDate"],
    "competitions": ["competitionId", "name", "draftFormat", "advanceWins",
                     "eliminateLosses", "status", "createdAt"],
    "competitionTeams": ["rowId", "competitionId", "teamId", "seed",
                         "registeredAt", "active"],
    "matches": ["matchId", "competitionId", "round", "teamAId", "teamBId",
                "teamASeed", "teamBSeed", "seriesFormat", "winnerTeamId",
                "winnerSource", "status", "createdAt"],
    "games": ["gameId", "matchId", "gameNumber", "winnerTeamId", "startedAt"],
    "drafts": ["draftId", "gameId", "format", "status", "turnIndex",
               "winnerSide", "createdAt", "finishedAt"],
    "draftActions": ["actionId", "draftId", "turnIndex", "kind", "side",
                     "lane", "championId", "phaseIndex", "source",
                     "decidedAt"],
}
DATA = {
    "champions": champion_rows,
    "persons": person_rows,
    "organizations": [[o[0], o[1], o[2]] for o in ORGS],
    "orgMembers": org_member_rows,
    "teams": team_rows,
    "teamMembers": team_member_rows,
    "competitions": comp_rows,
    "competitionTeams": competition_team_rows,
    "matches": match_rows,
    "games": game_rows,
    "drafts": draft_rows,
    "draftActions": action_rows,
}

for name, rows in DATA.items():
    with open(os.path.join(OUT, f"{name}.csv"), "w", newline="",
              encoding="utf-8-sig") as fh:
        writer = csv.writer(fh)
        writer.writerow(TABLES[name])
        writer.writerows(rows)

# ── Spec do xlsx (uma aba por tabela) ────────────────────────────────


def col_letter(index: int) -> str:
    """0->A, 1->B ... 26->AA."""
    prefix = ""
    while True:
        prefix = chr(65 + index % 26) + prefix
        index = index // 26 - 1

        if index < 0:
            return prefix


spec = {"sheets": []}
for name, rows in DATA.items():
    cols = TABLES[name]
    widths = {}

    for idx in range(len(cols)):
        widest = max((len(cols[idx]),) + tuple(
            len(str(r[idx])) for r in rows[:200]))
        widths[col_letter(idx)] = min(30, max(11, widest + 2))

    spec["sheets"].append({
        "name": name[:31],
        "rows": [cols] + rows,
        "column_widths": widths,
    })
with open(os.path.join(HERE, "seed_spec.json"), "w", encoding="utf-8") as fh:
    json.dump(spec, fh, ensure_ascii=False)

print("OK — gerado em", OUT)
for name, rows in DATA.items():
    print(f"  {name}.csv: {len(rows)} linhas")