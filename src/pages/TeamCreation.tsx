import React from "react";

import { PhaseDrawing, PhaseRegistering, PhaseSetup } from "@/fragments";
import { getChampionPortraitUrl } from "@/helpers";
import { DiceButton, LaneIcon, SLButton } from "../components";
import { useMatch } from "../hooks";
import { Lane, Phase, TeamKey } from "../types";

const LANE_ORDER: Lane[] = [
  Lane.Top,
  Lane.Jungle,
  Lane.Mid,
  Lane.ADC,
  Lane.Support,
];

const sortByLane = <T extends { lane: Lane }>(results: T[]): T[] =>
  [...results].sort(
    (a, b) => LANE_ORDER.indexOf(a.lane) - LANE_ORDER.indexOf(b.lane),
  );

export const TeamCreation: React.FC = () => {
  const {
    teamCount,
    teamRegistry,
    matchPhase,
    rerollChampionForPlayer,
    resetDraw,
  } = useMatch();

  return (
    <>
      {matchPhase === Phase.Setup && <PhaseSetup />}

      {matchPhase === Phase.Registering && <PhaseRegistering />}

      {matchPhase === Phase.Drawing && <PhaseDrawing />}

      {matchPhase === Phase.Done && (
        <main className="main-done-phase">
          <section
            className={`done-phase ${teamCount === 2 ? "done-phase--two-teams" : ""}`}
          >
            {teamCount === 2 ? (
              <>
                <article className="team-results">
                  <h2>Time A</h2>
                  <ol className="results">
                    {sortByLane(teamRegistry.teamA).map((r) => {
                      const realIndex = teamRegistry.teamA.indexOf(r);
                      return (
                        <li key={realIndex} className="result-card">
                          <span className="result-player">{r.name}</span>
                          <span className="result-lane">
                            <LaneIcon iconName={r.lane} />
                            <span className="result-lane-name">{r.lane}</span>
                          </span>
                          <div className="result-champion-group">
                            <span className="result-champion">
                              {r.champion.name}
                            </span>
                            <DiceButton
                              title="Reroll campeão"
                              onClick={() =>
                                rerollChampionForPlayer(
                                  TeamKey.TeamA,
                                  realIndex,
                                )
                              }
                            />
                          </div>
                          <img
                            className="result-champion-portrait"
                            src={getChampionPortraitUrl(r.champion.key)}
                            alt={r.champion.name}
                          />
                        </li>
                      );
                    })}
                  </ol>
                </article>
                <article className="team-results">
                  <h2>Time B</h2>
                  <ol className="results">
                    {sortByLane(teamRegistry.teamB).map((r) => {
                      const realIndex = teamRegistry.teamB.indexOf(r);
                      return (
                        <li
                          key={realIndex}
                          className="result-card result-card--team-b"
                        >
                          <img
                            className="result-champion-portrait"
                            src={getChampionPortraitUrl(r.champion.key)}
                            alt={r.champion.name}
                          />
                          <div className="result-champion-group">
                            <DiceButton
                              title="Reroll campeão"
                              onClick={() =>
                                rerollChampionForPlayer(
                                  TeamKey.TeamB,
                                  realIndex,
                                )
                              }
                            />
                            <span className="result-champion">
                              {r.champion.name}
                            </span>
                          </div>
                          <span className="result-lane">
                            <LaneIcon iconName={r.lane} />
                            <span className="result-lane-name">{r.lane}</span>
                          </span>
                          <span className="result-player">{r.name}</span>
                        </li>
                      );
                    })}
                  </ol>
                </article>
              </>
            ) : (
              <ol className="results">
                {sortByLane(teamRegistry.teamA).map((r) => {
                  const realIndex = teamRegistry.teamA.indexOf(r);
                  return (
                    <li key={realIndex} className="result-card">
                      <span className="result-player">{r.name}</span>
                      <span className="result-lane">
                        <LaneIcon iconName={r.lane} />
                        <span className="result-lane-name">{r.lane}</span>
                      </span>
                      <div className="result-champion-group">
                        <span className="result-champion">
                          {r.champion.name}
                        </span>
                        <DiceButton
                          title="Reroll campeão"
                          onClick={() =>
                            rerollChampionForPlayer(TeamKey.TeamA, realIndex)
                          }
                        />
                      </div>
                      <img
                        className="result-champion-portrait"
                        src={getChampionPortraitUrl(r.champion.key)}
                        alt={r.champion.name}
                      />
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
          <SLButton variant="outlined" onClick={resetDraw}>
            Novo Sorteio
          </SLButton>
        </main>
      )}
    </>
  );
};
