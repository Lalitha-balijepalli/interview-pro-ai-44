import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

type UserState = { user: User | null; loading: boolean };

let globalState: UserState = { user: null, loading: true };
const subscribers = new Set<(state: UserState) => void>();
let unsub: (() => void) | null = null;

function emit(state: UserState) {
  globalState = state;
  subscribers.forEach((fn) => fn(state));
}

function ensureSubscribed() {
  if (unsub) return;
  supabase.auth.getUser().then(({ data }) => {
    emit({ user: data.user ?? null, loading: false });
  });
  const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
    emit({ user: session?.user ?? null, loading: false });
  });
  unsub = () => sub.subscription.unsubscribe();
}

export function useUser() {
  const [state, setState] = useState<UserState>(globalState);

  useEffect(() => {
    ensureSubscribed();
    const cb = (s: UserState) => setState(s);
    subscribers.add(cb);
    return () => {
      subscribers.delete(cb);
    };
  }, []);

  const refresh = useCallback(async () => {
    emit({ ...globalState, loading: true });
    const { data } = await supabase.auth.getUser();
    emit({ user: data.user ?? null, loading: false });
  }, []);

  return { user: state.user, loading: state.loading, refresh };
}

export function initialsFrom(name?: string | null, email?: string | null) {
  const src = (name || email || "").trim();
  if (!src) return "U";
  const parts = src.split(/[\s@.]+/).filter(Boolean);
  const letters = parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  return letters || "U";
}

export function displayName(user: User | null) {
  if (!user) return "";
  return (
    (user.user_metadata?.full_name as string) ||
    user.email?.split("@")[0] ||
    ""
  );
}

export function displayTitle(user: User | null) {
  return (user?.user_metadata?.title as string) || "";
}
