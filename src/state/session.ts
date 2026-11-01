import { atom } from "jotai";

import { loadStorage } from "@/helpers";
import { type DraftSession } from "@/types";

const storedSessions = loadStorage("sessions", {
  needParse: true,
  isPersistent: true,
}) as unknown;

export const appScreenAtom = atom<
  "home" | "teams" | "match" | "arena" | "sessions" | "competition"
>("home");

export const sessionsAtom = atom<DraftSession[]>(
  Array.isArray(storedSessions) ? (storedSessions as DraftSession[]) : [],
);

export const activeSessionIdAtom = atom<string | null>(null);