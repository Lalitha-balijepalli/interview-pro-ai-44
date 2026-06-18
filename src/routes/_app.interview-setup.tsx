import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { roles, companies } from "@/lib/mock-data";
import { setCurrentConfig, getCurrentConfig, setGeneratedQuestions, clearGeneratedQuestions } from "@/lib/session-store";
import { generateInterviewQuestions, type ExperienceLevel, type InterviewType } from "@/lib/geminiService";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Zap, Flame, Target, Clock, ArrowRight, Check, Sparkles, Loader2, AlertCircle, RefreshCw } from "lucide-react";
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
  const [tab, setTab] = useState("role");

  // AI question generation state
  const [aiRole, setAiRole] = useState("");
  const [aiExperience, setAiExperience] = useState<ExperienceLevel>("1-3 Years");
  const [aiType, setAiType] = useState<InterviewType>("Technical");
  const [aiNumber, setAiNumber] = useState(5);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiQuestions, setAiQuestions] = useState<string[] | null>(null);

  async function handleGenerate() {
    setAiLoading(true);
    setAiError(null);
    try {
      const effectiveRole = aiRole.trim() || role || company || "Software Engineer";
      const qs = await generateInterviewQuestions({
        role: effectiveRole,
        experience: aiExperience,
        type: aiType,
        number: aiNumber,
      });
      setAiQuestions(qs);
      setGeneratedQuestions(qs);
      toast.success(`Generated ${qs.length} questions with AI`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to generate questions";
      setAiError(msg);
      toast.error(msg);
    } finally {
      setAiLoading(false);
    }
  }

  useEffect(() => {
    const cfg = getCurrentConfig();
    if (!cfg) return;
    if (roles.includes(cfg.role)) {
      setRole(cfg.role);
      setTab("role");
    } else if (companies.some((c) => c.name === cfg.role)) {
      setCompany(cfg.role);
      setTab("company");
    } else if (cfg.role === "Resume-based") {
      setTab("resume");
    } else {
      setRole(cfg.role);
      setTab("role");
    }
    if (cfg.difficulty) setDiff(cfg.difficulty);
    if (cfg.durationMin) {
      setDur(cfg.durationMin);
      const match = durations.find((d) => d.mins === cfg.durationMin);
      if (match) setAiNumber(match.q);
    }
  }, [setRole, setCompany, setDiff, setDur, setTab]);

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
          <Tabs value={tab} onValueChange={setTab}>
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

        <Card className="p-5 bg-gradient-card border-primary/30">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">AI-generated questions</h3>
            <Badge variant="secondary" className="ml-2">Powered by Gemini</Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Generate tailored interview questions. They'll be used automatically in your next session.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Job role</label>
              <Input
                placeholder={role ?? company ?? "e.g. Frontend Engineer"}
                value={aiRole}
                onChange={(e) => setAiRole(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Experience</label>
              <Select value={aiExperience} onValueChange={(v) => setAiExperience(v as ExperienceLevel)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fresher">Fresher</SelectItem>
                  <SelectItem value="1-3 Years">1-3 Years</SelectItem>
                  <SelectItem value="3-5 Years">3-5 Years</SelectItem>
                  <SelectItem value="5+ Years">5+ Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Interview type</label>
              <Select value={aiType} onValueChange={(v) => setAiType(v as InterviewType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Technical">Technical</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="Behavioral">Behavioral</SelectItem>
                  <SelectItem value="Mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Number of questions</label>
              <Input
                type="number" min={1} max={30}
                value={aiNumber}
                onChange={(e) => setAiNumber(Math.max(1, Math.min(30, parseInt(e.target.value) || 1)))}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <Button onClick={handleGenerate} disabled={aiLoading} className="bg-gradient-primary border-0 gap-2">
              {aiLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating Questions...</> : <><Sparkles className="h-4 w-4" /> Generate Questions</>}
            </Button>
            {aiQuestions && !aiLoading && (
              <Button variant="ghost" size="sm" onClick={() => { setAiQuestions(null); clearGeneratedQuestions(); toast.message("Cleared generated questions"); }}>
                Clear
              </Button>
            )}
          </div>

          {aiError && (
            <div className="mt-4 p-3 rounded-lg border border-destructive/40 bg-destructive/5 flex items-start gap-3">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
              <div className="flex-1 text-sm">
                <div className="font-medium text-destructive">Couldn't generate questions</div>
                <div className="text-muted-foreground text-xs mt-0.5">{aiError}</div>
              </div>
              <Button size="sm" variant="outline" onClick={handleGenerate} className="gap-1">
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </Button>
            </div>
          )}

          {aiQuestions && aiQuestions.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="text-xs text-muted-foreground">
                {aiQuestions.length} questions ready — they'll be used in your interview session.
              </div>
              <div className="max-h-64 overflow-y-auto rounded-lg border bg-background/40 divide-y">
                {aiQuestions.map((q, i) => (
                  <div key={i} className="p-3 text-sm flex gap-3">
                    <span className="text-muted-foreground font-mono text-xs mt-0.5">Q{i + 1}</span>
                    <span className="flex-1">{q}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
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
              <button key={d.mins} onClick={() => { setDur(d.mins); setAiNumber(d.q); }} className={cn(
                "p-4 rounded-xl border text-center transition-all",
                dur === d.mins ? "border-primary bg-primary/5 shadow-elegant" : "hover:border-primary/40"
              )}>
                <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <div className="font-semibold">{d.mins} min</div>
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Duration controls how many AI questions are generated. Adjust the "Number of questions" field above to override.
          </p>
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
