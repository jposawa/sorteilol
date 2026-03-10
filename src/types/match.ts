export enum Lane {
  Top = "Top",
  Jungle = "Jungle",
  Mid = "Mid",
  ADC = "ADC",
  Support = "Support",
}

export enum Phase {
  Setup = "setup",
  Registering = "registering",
  Drawing = "drawing",
  Done = "done",
}

export enum DrawStep {
  Lane = "lane",
  Champion = "champion",
}

export enum TeamKey {
  TeamA = "teamA",
  TeamB = "teamB",
}

export type Champion = {
  key: string;
  name: string;
  primaryLane: Lane;
  secondaryLane?: Lane;
};

export type Player = {
  key: string;
  name: string;
  champion: Champion;
};

export type Party = {
  key: string;
  players: Player[];
};

export type PlayerResult = {
  name: string;
  lane: Lane;
  champion: Champion;
};

export type TeamPlayer = {
  teamA: PlayerResult[];
  teamB: PlayerResult[];
};

export type DrawState = {
  step: DrawStep;
  usedLanes: Lane[];
  pendingLane: Lane | null;
  confirmedLane: Lane | null;
  pendingChampion: Champion | null;
  laneRollCount: number;
  championRollCount: number;
};
