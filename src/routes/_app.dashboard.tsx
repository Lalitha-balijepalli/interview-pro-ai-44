import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { performanceTrend, skillProgress } from "@/lib/mock-data";
import { useInterviewHistory } from "@/lib/session-store";
import { Mic, TrendingUp, Trophy, Target, ArrowRight } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — InterviewAI Pro" }] }),
  component: Dashboard,
});

const stats = [
  { label: "Total Interviews", value: "47", change: "+12", icon: Mic },
  { label: "Average Score", value: "84%", change: "+5%", icon: TrendingUp },
  { label: "Best Score", value: "95%", change: "Software Eng.", icon: Trophy },
  { label: "Practice Streak", value: "12d", change: "Keep going!", icon: Target },
];

function Dashboard() {
  return (
    <>
      <AppHeader title="Dashboard" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-semibold">Welcome back, Alex 👋</h2>
            <p className="text-sm text-muted-foreground">Here's how your interview prep is going.</p>
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

        <div className="grid lg:grid-cols-2 gap-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Performance Trend</h3>
                <p className="text-xs text-muted-foreground">Last 7 interviews</p>
              </div>
              <Badge variant="secondary">+9% vs prev</Badge>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={performanceTrend}>
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
                <h3 className="font-semibold">Skill Improvement</h3>
                <p className="text-xs text-muted-foreground">Current vs 30 days ago</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={skillProgress}>
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

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Recent Interviews</h3>
            <Link to="/history"><Button variant="ghost" size="sm" className="gap-1">View all <ArrowRight className="h-3 w-3" /></Button></Link>
          </div>
          <div className="divide-y">
            {interviewHistory.slice(0, 5).map((h) => (
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
