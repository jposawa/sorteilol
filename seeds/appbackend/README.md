# Seed — Sorteio Protocol → appbackend.io

Dados fictícios de exemplo (872 linhas), gerados de forma determinística
(`seeds/generate_seed.py`, seed 42) validando as mesmas regras do app:
agenda de 20 turnos (F1 bans ×6, F2 picks 1-2-2-1, F3 bans ×4,
F4 picks A,B,B,A), campeão nunca repetido no mesmo draft, rota única por
lado, fearless por torneio/vencedor sem repick e elenco com 1 titular por
rota + 1 treinador.

## Arquivos

- `sorteilol_seed.xlsx` — todas as tabelas em uma planilha (1 aba por
  tabela). Ideal para abrir no Google Sheets e importar aba por aba.
- `appbackend/<tabela>.csv` — um CSV por tabela (UTF-8 com BOM),
  importável diretamente.
- `../generate_seed.py` — regenera tudo (`python3 seeds/generate_seed.py`).

## Ordem de importação

As referências são colunas de texto com o id da linha de outra tabela;
importe nesta ordem (ou crie as tabelas antes e importe os dados depois):

1. `persons`              (122)
2. `organizations`        (8)
3. `orgMembers`           (24)
4. `teams`                (14)
5. `teamMembers`          (98)
6. `champions`            (173 — catálogo ddragon 16.21.1 real)
7. `competitions`         (2)
8. `competitionTeams`     (20)
9. `matches`              (14)
10. `games`               (19)
11. `drafts`              (19)
12. `draftActions`        (359)

## Schemas (Title | Id | Data type | Required)

### persons
| Title | Id | Type | Required |
|---|---|---|---|
| personId | personid | Text | Yes |
| handle | handle | Text | Yes |
| realName | realname | Text | No |
| country | country | Text | No |
| birthDate | birthdate | DatePicker | No |

### organizations
| Title | Id | Type | Required |
|---|---|---|---|
| orgId | orgid | Text | Yes |
| orgName | orgname | Text | Yes |
| orgTag | orgtag | Text | No |

### orgMembers (dono, gerente, analista — histórico temporal)
| Title | Id | Type | Required |
|---|---|---|---|
| memberId | memberid | Text | Yes |
| orgId | orgid | Text | Yes |
| personId | personid | Text | Yes |
| role | role | Text | Yes (owner/manager/analyst) |
| fromDate | fromdate | DatePicker | Yes |
| toDate | todate | DatePicker | No (vazio = vínculo vigente) |

### teams
| Title | Id | Type | Required |
|---|---|---|---|
| teamId | teamid | Text | Yes |
| orgId | orgid | Text | No (vazio = time independente) |
| teamName | teamname | Text | Yes |
| teamTag | teamtag | Text | No |
| createdAt | createdat | DatePicker | No |
| isActiveTeam | isactiveteam | Boolean | Yes |
| teamMembers | teammembers | Text | No (resumo legível, não é FK) |

> Sua tabela existente (teamName/teamAcron/teamLogo/teamMembers/…
> isActiveTeam) reutiliza-se adicionando `teamId`, `orgId` e `teamTag`.
> O CSV usa exatamente `teamName`, `teamMembers`, `isActiveTeam`,
> `createdAt` — só `teamAcron` não tem par direto (o equivalente é
> `teamTag`) e o logo (Image) fica no app, não no seed.

### teamMembers (elenco histórico por rota)
| Title | Id | Type | Required |
|---|---|---|---|
| memberId | memberid | Text | Yes |
| teamId | teamid | Text | Yes |
| personId | personid | Text | Yes |
| gameRole | gamerole | Text | Yes (top/jungle/mid/adc/support/coach/sub) |
| fromDate | fromdate | DatePicker | Yes |
| toDate | todate | DatePicker | No (vazio = vigente) |

### champions
| Title | Id | Type | Required |
|---|---|---|---|
| championId | championid | Text | Yes (key do ddragon: Aatrox, KSante…) |
| name | name | Text | Yes |
| classes | classes | Text | No (separadas por "; " em PT) |

### competitions
| Title | Id | Type | Required |
|---|---|---|---|
| competitionId | competitionid | Text | Yes |
| name | name | Text | Yes |
| draftFormat | draftformat | Text | Yes (standard/fearless) |
| advanceWins | advancedwins | Number | Yes (suíço 3W) |
| eliminateLosses | eliminatelosses | Number | Yes (suíço 3L) |
| status | status | Text | Yes (registration/active/done/cancelled) |
| createdAt | createdat | DatePicker | No |

### competitionTeams (inscrição: o par torneio↔time e a SEED)
| Title | Id | Type | Required |
|---|---|---|---|
| rowId | rowid | Text | Yes |
| competitionId | competitionid | Text | Yes |
| teamId | teamid | Text | Yes |
| seed | seed | Number | Yes |
| registeredAt | registeredat | DatePicker | Yes |
| active | active | Boolean | Yes |

### matches (série do suíço; seeds congelados no emparelhamento)
| Title | Id | Type | Required |
|---|---|---|---|
| matchId | matchid | Text | Yes |
| competitionId | competitionid | Text | No (vazio = sessão avulsa do Randomizer) |
| round | round | Number | Yes |
| teamAId | teamaid | Text | Yes |
| teamBId | teambid | Text | Yes |
| teamASeed | teamaseed | Number | Yes |
| teamBSeed | teambseed | Number | Yes |
| seriesFormat | seriesformat | Number | Yes (1/3/5) |
| winnerTeamId | winnerteamid | Text | No (vazio = aberta) |
| winnerSource | winnersource | Text | No (draft/manual) |
| status | status | Text | Yes (scheduled/live/done/void) |
| createdAt | createdat | DatePicker | No |

### games (jogo individual da série: 1 draft por jogo)
| Title | Id | Type | Required |
|---|---|---|---|
| gameId | gameid | Text | Yes |
| matchId | matchid | Text | Yes |
| gameNumber | gamenumber | Number | Yes |
| winnerTeamId | winnerteamid | Text | No |
| startedAt | startedat | DatePicker | No |

### drafts (estado atual da mesa: turnIndex consumido)
| Title | Id | Type | Required |
|---|---|---|---|
| draftId | draftid | Text | Yes |
| gameId | gameid | Text | Yes |
| format | format | Text | Yes (standard/fearless) |
| status | status | Text | Yes (in_progress/completed/abandoned) |
| turnIndex | turnindex | Number | Yes (0..19; 20 = completa) |
| winnerSide | winnerside | Text | No (A/B) |
| createdAt | createdat | DatePicker | No |
| finishedAt | finishedat | DatePicker | No |

### draftActions (log imutável de cada turno consumido)
| Title | Id | Type | Required |
|---|---|---|---|
| actionId | actionid | Text | Yes |
| draftId | draftid | Text | Yes |
| turnIndex | turnindex | Number | Yes (0..19, contíguo) |
| kind | kind | Text | Yes (ban/pick) |
| side | side | Text | Yes (A/B) |
| lane | lane | Text | Só para picks (top/jungle/mid/adc/support) |
| championId | championid | Text | Yes |
| phaseIndex | phaseindex | Number | Yes (nº do ban/pick na fase, 0-based) |
| source | source | Text | Yes (manual/auto_skip — timer estourado) |
| decidedAt | decidedat | DatePicker | Yes |

## Conteúdo dos dados de exemplo

- **8 organizações** com dono, gerente e analista (2 vínculos históricos
  já encerrados para exercitar `toDate`).
- **14 equipes** (12 reais + Time Alpha/Omega para os drafts avulsos);
  cada uma com 5 titulares (top/jungle/mid/adc/support), 1 reserva
  (`sub`) e 1 treinador — 122 pessoas.
- **Hexa Masters Split 1** (fearless, active, 12 equipes): rodada 1
  completa (6 Bo1), rodada 2 com 3 séries Bo3 de vencedores (uma 2-0,
  duas 1-1 com jogo 3 em andamento no turno 7 e 11) e 3 Bo1 de
  perdedores.
- **Copa Inverno 2026** (standard, registration, 8 equipes) sem
  partidas ainda — fase de inscrição, inclusive para testar a trava
  de "criar e iniciar" do App.
- **359 ações de draft** no total: 17 drafts completos (agendas
  idênticas do app) + 2 em andamento (turnos 7 e 11 já consumidos,
  `turnIndex` refletindo o próximo turno).
- **Respeito fearless**: nenhum time repick um campeão que já pickou
  no torneio (validado automaticamente).
- Ranking, hall da fama e meta são DERIVADOS (queries sobre matches +
  draftActions) — não criar tabelas para eles.

## Consultas de exemplo (para views/relatórios na plataforma)

Ranking suíço (pontos = 20 × V − 5 × D):
```
SELECT b.teamId,
       SUM(IIF(a.winnerTeamId = b.teamId, 1, 0)) AS wins,
       SUM(IIF(a.winnerTeamId IS NOT NULL AND a.winnerTeamId <> b.teamId, 1, 0)) AS losses
FROM matches a
JOIN competitionTeams b ON b.competitionId = a.competitionId
       AND (a.teamAId = b.teamId OR a.teamBId = b.teamId)
        WHERE a.winnerTeamId <> ''
GROUP BY b.teamId
ORDER BY (20 * wins - 5 * losses) DESC
```

Meta da arena (picks e bans por campeão):
```
SELECT championId,
       SUM(IIF(kind='pick', 1, 0)) AS picks,
       SUM(IIF(kind='ban', 1, 0)) AS bans,
       COUNT(*) AS total
FROM draftActions GROUP BY championId ORDER BY total DESC LIMIT 10
```

Fearless locks por time:
```
SELECT m.competitionId,
       IIF(d.side='A', m.teamAId, m.teamBId) AS teamId,
       d.championId
FROM draftActions d
JOIN drafts dr ON dr.draftId = d.draftId
JOIN games g ON g.gameId = dr.gameId
JOIN matches m ON m.matchId = g.matchId
WHERE d.kind='pick' AND m.competitionId <> ''
GROUP BY m.competitionId, IIF(d.side='A', m.teamAId, m.teamBId), d.championId
```