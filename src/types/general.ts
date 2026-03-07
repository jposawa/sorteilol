export enum Lane {
	Top = "Top",
	Jungle = "Jungle",
	Mid = "Mid",
	ADC = "ADC",
	Support = "Support",
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
}

export type Party = {
  key: string;
  players: Player[];
}
