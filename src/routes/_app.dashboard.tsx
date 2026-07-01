import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useInterviewHistory } from "@/lib/session-store";
import { useUser, displayName } from "@/lib/use-user";
import { Mic, TrendingUp, Trophy, Target, ArrowRight } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";
import { useMemo } from "react";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — InterviewAI Pro" }] }),
  component: Dashboard,
});

function computeStreak(dates: string[]): number {
  if (!dates.length) return 0;
  const set = new Set(dates);
  let streak = 0;
  const cur = new Date();
  while (true) {
    const iso = cur.toISOString().slice(0, 10);
    if (set.has(iso)) {
      streak++;
      cur.setDate(cur.getDate() - 1);
    } else break;
  }
  return streak;
}

function Dashboard() {
  const { history } = useInterviewHistory();
  const { user } = useUser();
  const name = displayName(user) || "there";

  const stats = useMemo(() => {
    const total = history.length;
    const avg = total ? Math.round(history.reduce((s, h) => s + h.score, 0) / total) : 0;
    const best = total ? Math.max(...history.map((h) => h.score)) : 0;
    const bestRole = total ? history.find((h) => h.score === best)?.role ?? "" : "";
    const streak = computeStreak(history.map((h) => h.date));
    return [
      { label: "Total Interviews", value: String(total), change: total ? `+${total}` : "None yet", icon: Mic },
      { label: "Average Score", value: total ? `${avg}%` : "—", change: total ? "Across all sessions" : "Take your first", icon: TrendingUp },
      { label: "Best Score", value: total ? `${best}%` : "—", change: bestRole || "—", icon: Trophy },
      { label: "Practice Streak", value: `${streak}d`, change: streak ? "Keep going!" : "Start today", icon: Target },
    ];
  }, [history]);

  const trend = useMemo(
    () =>
      [...history]
        .slice(0, 7)
        .reverse()
        .map((h) => ({ date: h.date.slice(5), score: h.score })),
    [history],
  );

  const skillFromHistory = useMemo(() => {
    // Simple synthesized skill snapshot derived from recent scores; only shown if user has data
    if (!history.length) return [];
    const recent = history.slice(0, Math.min(5, history.length));
    const prior = history.slice(5, 10);
    const avg = (arr: typeof history) => (arr.length ? arr.reduce((s, h) => s + h.score, 0) / arr.length : 0);
    const r = Math.round(avg(recent));
    const p = Math.round(avg(prior)) || Math.max(0, r - 5);
    return [
      { skill: "Technical", previous: Math.max(0, p - 2), current: Math.min(100, r + 2) },
      { skill: "Communication", previous: p, current: r },
      { skill: "Confidence", previous: Math.max(0, p - 4), current: Math.max(0, r - 2) },
      { skill: "Problem Solving", previous: p, current: Math.min(100, r + 1) },
      { skill: "Clarity", previous: Math.max(0, p - 1), current: r },
    ];
  }, [history]);

  return (
    <>
      <AppHeader title="Dashboard" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-semibold">Welcome{name ? `, ${name}` : ""} 👋</h2>
            <p className="text-sm text-muted-foreground">
              {history.length ? "Here's how your interview prep is going." : "Take your first interview to see your stats here."}
            </p>
          </div>
          <Link to="/interview-setup"><Button className="bg-gradient-primary border-0 shadow-elegant gap-2">Start new interview <ArrowRight className="h-4 w-4" /></Button></Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <Card key={s.label} className="p-5 bg-gradient-card">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                  <div className="mt-2 text-3xl font-semibold">{s.value}</div>
                  <div className="mt-1 text-xs text-success">{s.change}</div>
                </div>
                <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <s.icon className="h-4 w-4" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {history.length > 0 && (
          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">Performance Trend</h3>
                  <p className="text-xs text-muted-foreground">Last {trend.length} interview{trend.length === 1 ? "" : "s"}</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
                  <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={2.5} dot={{ fill: "var(--primary)", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">Skill Snapshot</h3>
                  <p className="text-xs text-muted-foreground">Recent vs earlier sessions</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={skillFromHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="skill" stroke="var(--muted-foreground)" fontSize={10} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
                  <Bar dataKey="previous" fill="var(--muted)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="current" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Recent Interviews</h3>
            <Link to="/history"><Button variant="ghost" size="sm" className="gap-1">View all <ArrowRight className="h-3 w-3" /></Button></Link>
          </div>
          <div className="divide-y">
            {history.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No interviews yet — <Link to="/interview-setup" className="text-primary underline">start your first one</Link>.
              </div>
            ) : history.slice(0, 5).map((h) => (
              <div key={h.id} className="flex items-center py-3 gap-4">
                <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">{h.role.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{h.role}</div>
                  <div className="text-xs text-muted-foreground">{h.date} · {h.duration}</div>
                </div>
                <Badge variant={h.difficulty === "Hard" ? "destructive" : h.difficulty === "Medium" ? "secondary" : "outline"}>{h.difficulty}</Badge>
                <div className="text-sm font-semibold w-12 text-right">{h.score}%</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
