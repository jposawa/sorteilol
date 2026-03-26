import { withPrefix } from "./conversion";

export const pickRandom = <T>(arr: T[]): T => {
  return arr[Math.floor(Math.random() * arr.length)];
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
