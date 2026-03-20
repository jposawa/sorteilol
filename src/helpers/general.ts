import { CHAMPIONS } from "../constants";
import type { Champion, Lane } from "../types";
import { withPrefix } from "./conversion";

export const pickRandom = <T>(arr: T[]): T => {
  return arr[Math.floor(Math.random() * arr.length)];
};

export const randomChampionForLane = (
  lane: Lane,
  options: {
    excludedChampionKeys?: string[];
  } = {},
): Champion => {
  const { excludedChampionKeys = [] } = options;
  const pool = Object.values(CHAMPIONS).filter(
    (c) => c.primaryLane === lane || c.secondaryLane === lane,
  );

  const excludedSet = new Set(excludedChampionKeys);
  const availablePool = pool.filter(
    (champion) => !excludedSet.has(champion.key),
  );

  return pickRandom(availablePool.length > 0 ? availablePool : pool);
};

export const saveStorage = (
  key: string,
  value: unknown,
  options: {
    needParse?: boolean;
    isPersistent?: boolean;
  } = {},
) => {
  const { needParse = false, isPersistent = false } = options;
  const storage = isPersistent ? localStorage : sessionStorage;
  const formattedKey = withPrefix(key);
  const formattedValue = needParse ? JSON.stringify(value) : `${value}`;

  storage.setItem(formattedKey, formattedValue);
};

export const loadStorage = (
  key: string,
  options: { needParse?: boolean; isPersistent?: boolean } = {},
) => {
  const { needParse = false, isPersistent = false } = options;
  const storage = isPersistent ? localStorage : sessionStorage;
  const formattedKey = withPrefix(key);
  const value = storage.getItem(formattedKey);

  if (!value) {
    return null;
  }

  const parsedValue = needParse ? JSON.parse(value) : value;

  return parsedValue;
};

export const removeStorage = (key: string, isPersistent = false) => {
  const storage = isPersistent ? localStorage : sessionStorage;
  const formattedKey = withPrefix(key);

  storage.removeItem(formattedKey);
};
