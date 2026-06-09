import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { radarMetrics, performanceTrend, skillProgress } from "@/lib/mock-data";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area,
} from "recharts";

export const Route = createFileRoute("/_app/analytics")({
  head: () => ({ meta: [{ title: "Analytics — InterviewAI Pro" }] }),
  component: Analytics,
});

const metrics = [
  { label: "Technical Knowledge", value: 88, color: "var(--chart-1)" },
  { label: "Communication Skills", value: 82, color: "var(--chart-2)" },
  { label: "Confidence", value: 76, color: "var(--chart-3)" },
  { label: "Problem Solving", value: 85, color: "var(--chart-4)" },
  { label: "Eye Contact", value: 71, color: "var(--chart-5)" },
  { label: "Voice Clarity", value: 90, color: "var(--chart-1)" },
];

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
  return (
    <>
      <AppHeader title="Analytics" />
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">Performance analytics</h2>
          <p className="text-sm text-muted-foreground">Track your growth across every interview skill.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {metrics.map((m) => (
            <Card key={m.label} className="p-4 flex items-center justify-center">
              <CircularScore value={m.value} label={m.label} />
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <Card className="p-5">
            <h3 className="font-semibold mb-4">Skill Radar</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarMetrics}>
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
              <AreaChart data={performanceTrend}>
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
            {skillProgress.map((s) => (
              <div key={s.skill}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span>{s.skill}</span>
                  <span className="text-muted-foreground">{s.current}% <span className="text-success text-xs ml-1">+{s.current - s.previous}</span></span>
                </div>
                <Progress value={s.current} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
