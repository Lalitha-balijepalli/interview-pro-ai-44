import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { roles, companies } from "@/lib/mock-data";
import { setCurrentConfig, getCurrentConfig } from "@/lib/session-store";
import { useState, useEffect } from "react";
import { Zap, Flame, Target, Clock, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/interview-setup")({
  head: () => ({ meta: [{ title: "Interview Setup — InterviewAI Pro" }] }),
  component: Setup,
});

const difficulties = [
  { name: "Easy", icon: Zap, color: "success", desc: "Basic concepts and beginner questions." },
  { name: "Medium", icon: Target, color: "warning", desc: "Intermediate and project-oriented questions." },
  { name: "Hard", icon: Flame, color: "destructive", desc: "Advanced and system design questions." },
];

const durations = [
  { mins: 5, q: 3 }, { mins: 10, q: 5 }, { mins: 15, q: 8 },
  { mins: 20, q: 10 }, { mins: 30, q: 15 },
];

function Setup() {
  const [role, setRole] = useState<string | null>(null);
  const [company, setCompany] = useState<string | null>(null);
  const [diff, setDiff] = useState("Medium");
  const [dur, setDur] = useState(15);

  return (
    <>
      <AppHeader title="Interview Setup" />
      <div className="p-6 space-y-6 max-w-6xl">
        <div>
          <h2 className="text-2xl font-semibold">Configure your interview</h2>
          <p className="text-sm text-muted-foreground">Choose what you want to practice today.</p>
        </div>

        <Card className="p-5">
          <h3 className="font-semibold mb-4">Interview type</h3>
          <Tabs defaultValue="role">
            <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full">
              <TabsTrigger value="role">Role Based</TabsTrigger>
              <TabsTrigger value="company">Company Based</TabsTrigger>
              <TabsTrigger value="jd">Job Description</TabsTrigger>
              <TabsTrigger value="resume">Resume Based</TabsTrigger>
            </TabsList>
            <TabsContent value="role" className="mt-5">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {roles.map((r) => (
                  <button key={r} onClick={() => setRole(r)} className={cn(
                    "text-left p-4 rounded-xl border transition-all",
                    role === r ? "border-primary bg-primary/5 shadow-elegant" : "hover:border-primary/40"
                  )}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{r}</span>
                      {role === r && <Check className="h-4 w-4 text-primary" />}
                    </div>
                  </button>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="company" className="mt-5">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {companies.map((c) => (
                  <button key={c.name} onClick={() => setCompany(c.name)} className={cn(
                    "text-left p-4 rounded-xl border transition-all flex items-center gap-3",
                    company === c.name ? "border-primary bg-primary/5 shadow-elegant" : "hover:border-primary/40"
                  )}>
                    <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${c.color}`} />
                    <span className="text-sm font-medium flex-1">{c.name}</span>
                    {company === c.name && <Check className="h-4 w-4 text-primary" />}
                  </button>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="jd" className="mt-5">
              <Textarea placeholder="Paste the job description here..." className="min-h-40" />
            </TabsContent>
            <TabsContent value="resume" className="mt-5">
              <Card className="p-5 bg-muted/30">
                <div className="text-sm">Using your active resume: <span className="font-medium">Alex Morgan — Full Stack Developer</span></div>
                <p className="text-xs text-muted-foreground mt-1">Questions will reference your real projects and skills.</p>
              </Card>
            </TabsContent>
          </Tabs>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-4">Difficulty</h3>
          <div className="grid md:grid-cols-3 gap-3">
            {difficulties.map((d) => (
              <button key={d.name} onClick={() => setDiff(d.name)} className={cn(
                "text-left p-5 rounded-xl border transition-all",
                diff === d.name ? "border-primary bg-primary/5 shadow-elegant" : "hover:border-primary/40"
              )}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center bg-${d.color}/15 text-${d.color}`}>
                    <d.icon className="h-4 w-4" />
                  </div>
                  <span className="font-semibold">{d.name}</span>
                  {diff === d.name && <Check className="h-4 w-4 text-primary ml-auto" />}
                </div>
                <p className="text-xs text-muted-foreground">{d.desc}</p>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-4">Duration</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {durations.map((d) => (
              <button key={d.mins} onClick={() => setDur(d.mins)} className={cn(
                "p-4 rounded-xl border text-center transition-all",
                dur === d.mins ? "border-primary bg-primary/5 shadow-elegant" : "hover:border-primary/40"
              )}>
                <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <div className="font-semibold">{d.mins} min</div>
                <div className="text-xs text-muted-foreground">~{d.q} questions</div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-5 bg-gradient-card flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Ready to start</div>
            <div className="font-semibold">{role ?? company ?? "Resume-based"} · {diff} · {dur} minutes</div>
          </div>
          <Link
            to="/interview-session"
            onClick={() =>
              setCurrentConfig({
                role: role ?? company ?? "Resume-based",
                difficulty: diff,
                durationMin: dur,
              })
            }
          >
            <Button size="lg" className="bg-gradient-primary border-0 shadow-elegant gap-2">Begin interview <ArrowRight className="h-4 w-4" /></Button>
          </Link>
        </Card>
      </div>
    </>
  );
}
