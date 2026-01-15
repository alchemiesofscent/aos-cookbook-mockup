export const STUDIO_STORAGE_KEYS = {
  ACTIVE_SESSION_ID: "AOS_STUDIO_ACTIVE_SESSION_ID",
  SESSIONS: "AOS_STUDIO_SESSIONS",
} as const;

export interface StudioSession {
  id: string;
  recipeId: string;
  createdAt: string;
  updatedAt: string;
  scale: number;
  selectedOptions: Record<string, string>;
  notes: string;
}

const safeJsonParse = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export const getActiveStudioSessionId = (): string | null => {
  try {
    return localStorage.getItem(STUDIO_STORAGE_KEYS.ACTIVE_SESSION_ID);
  } catch {
    return null;
  }
};

export const setActiveStudioSessionId = (sessionId: string | null) => {
  try {
    if (!sessionId) {
      localStorage.removeItem(STUDIO_STORAGE_KEYS.ACTIVE_SESSION_ID);
      return;
    }
    localStorage.setItem(STUDIO_STORAGE_KEYS.ACTIVE_SESSION_ID, sessionId);
  } catch {}
};

export const loadStudioSessions = (): StudioSession[] => {
  try {
    const raw = localStorage.getItem(STUDIO_STORAGE_KEYS.SESSIONS);
    const parsed = safeJsonParse<StudioSession[]>(raw, []);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveStudioSessions = (sessions: StudioSession[]) => {
  try {
    localStorage.setItem(STUDIO_STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  } catch {}
};

export const getStudioSessionById = (sessionId: string): StudioSession | undefined => {
  const sessions = loadStudioSessions();
  return sessions.find((s) => s.id === sessionId);
};

export const upsertStudioSession = (session: StudioSession): StudioSession => {
  const next = { ...session, updatedAt: new Date().toISOString() };
  const sessions = loadStudioSessions();
  const idx = sessions.findIndex((s) => s.id === next.id);
  const updated = idx >= 0 ? sessions.map((s, i) => (i === idx ? next : s)) : [next, ...sessions];
  updated.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0));
  saveStudioSessions(updated);
  return next;
};

export const createStudioSession = (params: {
  recipeId: string;
  scale?: number;
  selectedOptions?: Record<string, string>;
  notes?: string;
}): StudioSession => {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    recipeId: params.recipeId,
    createdAt: now,
    updatedAt: now,
    scale: typeof params.scale === "number" && Number.isFinite(params.scale) ? params.scale : 1,
    selectedOptions: params.selectedOptions ?? {},
    notes: params.notes ?? "",
  };
};

