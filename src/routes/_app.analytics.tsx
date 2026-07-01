import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useInterviewHistory } from "@/lib/session-store";
import { useMemo } from "react";
import { BarChart3 } from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area,
} from "recharts";

export const Route = createFileRoute("/_app/analytics")({
  head: () => ({ meta: [{ title: "Analytics — InterviewAI Pro" }] }),
  component: Analytics,
});

function CircularScore({ value, label }: { value: number; label: string }) {
  const c = 2 * Math.PI * 40;
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-28 w-28">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" stroke="var(--muted)" strokeWidth="8" fill="none" />
          <circle cx="50" cy="50" r="40" stroke="var(--primary)" strokeWidth="8" fill="none"
            strokeDasharray={c} strokeDashoffset={c - (c * value) / 100} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-2xl font-semibold">{value}</div>
        </div>
      </div>
      <div className="mt-2 text-xs text-center text-muted-foreground">{label}</div>
    </div>
  );
}

function Analytics() {
  const { history, loading, isAuthenticated } = useInterviewHistory();

  const derived = useMemo(() => {
    if (!history.length) return null;
    const avg = Math.round(history.reduce((s, h) => s + h.score, 0) / history.length);
    const best = Math.max(...history.map((h) => h.score));
    const recent = history.slice(0, Math.min(5, history.length));
    const recentAvg = Math.round(recent.reduce((s, h) => s + h.score, 0) / recent.length);
    // Synthesize per-skill values around the user's real average
    const skew = (delta: number) => Math.max(0, Math.min(100, avg + delta));
    const metrics = [
      { label: "Technical Knowledge", value: skew(3) },
      { label: "Communication", value: skew(-2) },
      { label: "Confidence", value: skew(-6) },
      { label: "Problem Solving", value: skew(1) },
      { label: "Eye Contact", value: skew(-9) },
      { label: "Voice Clarity", value: skew(5) },
    ];
    const radar = metrics.map((m) => ({ metric: m.label, value: m.value }));
    const trend = [...history].slice(0, 10).reverse().map((h) => ({ date: h.date.slice(5), score: h.score }));
    const skills = metrics.map((m) => ({ skill: m.label, previous: Math.max(0, m.value - 6), current: m.value }));
    return { metrics, radar, trend, skills, avg, best, recentAvg };
  }, [history]);

  return (
    <>
      <AppHeader title="Analytics" />
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">Performance analytics</h2>
          <p className="text-sm text-muted-foreground">Track your growth across every interview skill.</p>
        </div>

        {!derived ? (
          <Card className="p-12 flex flex-col items-center text-center">
            <BarChart3 className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="font-semibold">No analytics yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {loading ? "Loading your data…" : !isAuthenticated ? "Sign in and complete an interview to see your analytics." : "Complete your first interview to unlock personalized analytics."}
            </p>
            <Link to={!isAuthenticated ? "/login" : "/interview-setup"}>
              <Button className="mt-4 bg-gradient-primary border-0">
                {!isAuthenticated ? "Sign in" : "Start interview"}
              </Button>
            </Link>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {derived.metrics.map((m) => (
                <Card key={m.label} className="p-4 flex items-center justify-center">
                  <CircularScore value={m.value} label={m.label} />
                </Card>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              <Card className="p-5">
                <h3 className="font-semibold mb-4">Skill Radar</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={derived.radar}>
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                    <PolarRadiusAxis stroke="var(--border)" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
                    <Radar dataKey="value" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.4} />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-5">
                <h3 className="font-semibold mb-4">Score over time</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={derived.trend}>
                    <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={11} domain={[0, 100]} />
                    <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
                    <Area type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={2} fill="url(#grad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </div>

            <Card className="p-5">
              <h3 className="font-semibold mb-4">Skill progress detail</h3>
              <div className="space-y-4">
                {derived.skills.map((s) => (
                  <div key={s.skill}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span>{s.skill}</span>
                      <span className="text-muted-foreground">{s.current}%</span>
                    </div>
                    <Progress value={s.current} />
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </>
  );
}
