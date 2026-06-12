import { useEffect, useState } from "react";
import { interviewHistory as seed } from "./mock-data";

export type InterviewEntry = {
  id: string;
  date: string;
  role: string;
  difficulty: string;
  duration: string;
  score: number;
};

const KEY = "interviewai:history";
const CFG = "interviewai:current";
const SEEDED = "interviewai:seeded";

function read(): InterviewEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
    // seed once so the demo isn't empty on first visit
    if (!localStorage.getItem(SEEDED)) {
      localStorage.setItem(KEY, JSON.stringify(seed));
      localStorage.setItem(SEEDED, "1");
      return seed as InterviewEntry[];
    }
    return [];
  } catch {
    return [];
  }
}

function emit() {
  window.dispatchEvent(new Event("interviewai:history-changed"));
}

export function getHistory(): InterviewEntry[] {
  return read();
}

export function addInterview(entry: Omit<InterviewEntry, "id" | "date">) {
  if (typeof window === "undefined") return;
  const list = read();
  const next: InterviewEntry = {
    id: crypto.randomUUID(),
    date: new Date().toISOString().slice(0, 10),
    ...entry,
  };
  const updated = [next, ...list];
  localStorage.setItem(KEY, JSON.stringify(updated));
  emit();
}

export function clearHistory() {
  localStorage.removeItem(KEY);
  emit();
}

export type CurrentConfig = {
  role: string;
  difficulty: string;
  durationMin: number;
};

export function setCurrentConfig(cfg: CurrentConfig) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CFG, JSON.stringify(cfg));
}

export function getCurrentConfig(): CurrentConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CFG);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function useInterviewHistory() {
  const [list, setList] = useState<InterviewEntry[]>(() => read());
  useEffect(() => {
    const sync = () => setList(read());
    sync();
    window.addEventListener("interviewai:history-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("interviewai:history-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return list;
}
