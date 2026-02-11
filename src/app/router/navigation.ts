import type { NavigationState } from "./types";

export const coerceNavigationState = (value: unknown): NavigationState | null => {
  if (!value || typeof value !== "object") return null;
  const state = value as NavigationState;
  if (typeof state.route !== "string") return null;
  return state;
};
