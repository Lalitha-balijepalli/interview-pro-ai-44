import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUser(data.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}

export function initialsFrom(name?: string | null, email?: string | null) {
  const src = (name || email || "").trim();
  if (!src) return "U";
  const parts = src.split(/[\s@.]+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
  return letters || "U";
}

export function displayName(user: User | null) {
  if (!user) return "";
  return (user.user_metadata?.full_name as string) || user.email?.split("@")[0] || "";
}

export function displayTitle(user: User | null) {
  return (user?.user_metadata?.title as string) || "";
}
