import { CHAMPIONS } from "../constants";
import type { Champion, Lane } from "../types";

export const pickRandom = <T>(arr: T[]): T => {
	return arr[Math.floor(Math.random() * arr.length)];
};

export const randomChampionForLane = (lane: Lane): Champion => {
	const pool = Object.values(CHAMPIONS).filter(
		(c) => c.primaryLane === lane || c.secondaryLane === lane,
	);
	return pickRandom(pool);
};
