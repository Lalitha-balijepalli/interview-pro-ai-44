import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type InterviewEntry = {
  id: string;
  date: string;
  role: string;
  difficulty: string;
  duration: string;
  score: number;
};

const CFG = "interviewai:current";

// ---------- Cross-device history (Lovable Cloud) ----------

type Row = {
  id: string;
  date: string;
  role: string;
  difficulty: string;
  duration: string;
  score: number;
};

function toEntry(r: Row): InterviewEntry {
  return {
    id: r.id,
    date: r.date,
    role: r.role,
    difficulty: r.difficulty,
    duration: r.duration,
    score: r.score,
  };
}

function emit() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("interviewai:history-changed"));
  }
}

async function fetchHistory(userId: string): Promise<InterviewEntry[]> {
  const { data, error } = await supabase
    .from("interviews")
    .select("id,date,role,difficulty,duration,score")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Failed to load interviews", error);
    return [];
  }
  return (data ?? []).map(toEntry);
}

export function useInterviewHistory() {
  const [history, setHistory] = useState<InterviewEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load(uid: string | null) {
      if (!uid) {
        if (!cancelled) {
          setHistory([]);
          setLoading(false);
        }
        return;
      }
      const list = await fetchHistory(uid);
      if (!cancelled) {
        setHistory(list);
        setLoading(false);
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user.id ?? null;
      setUserId(uid);
      load(uid);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user.id ?? null;
      setUserId(uid);
      setLoading(true);
      load(uid);
    });

    const onChange = () => {
      if (userId) {
        fetchHistory(userId).then((list) => {
          if (!cancelled) setHistory(list);
        });
      }
    };
    window.addEventListener("interviewai:history-changed", onChange);

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
      window.removeEventListener("interviewai:history-changed", onChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return { history, loading, isAuthenticated: !!userId };
}

export async function addInterview(entry: Omit<InterviewEntry, "id" | "date">) {
  const { data: sess } = await supabase.auth.getSession();
  const uid = sess.session?.user.id;
  if (!uid) return;
  const { error } = await supabase.from("interviews").insert({
    user_id: uid,
    role: entry.role,
    difficulty: entry.difficulty,
    duration: entry.duration,
    score: entry.score,
  });
  if (error) {
    console.error("Failed to save interview", error);
    return;
  }
  emit();
}

export async function removeInterview(id: string) {
  const { error } = await supabase.from("interviews").delete().eq("id", id);
  if (error) {
    console.error("Failed to delete interview", error);
    return;
  }
  emit();
}

export async function clearHistory() {
  const { data: sess } = await supabase.auth.getSession();
  const uid = sess.session?.user.id;
  if (!uid) return;
  await supabase.from("interviews").delete().eq("user_id", uid);
  emit();
}

// ---------- Current interview config (session-local) ----------

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
    return raw ? (JSON.parse(raw) as CurrentConfig) : null;
  } catch {
    return null;
  }
}
