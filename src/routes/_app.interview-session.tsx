import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { interviewQuestions } from "@/lib/mock-data";
import { addInterview, getCurrentConfig } from "@/lib/session-store";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Play, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/_app/interview-session")({
  head: () => ({ meta: [{ title: "Interview Session — InterviewAI Pro" }] }),
  component: Session,
});

function Session() {
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(false);
  const [camOn, setCamOn] = useState(true);
  const [qIdx, setQIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!started) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [started]);

  const totalQ = interviewQuestions.length;
  const mins = Math.floor(elapsed / 60).toString().padStart(2, "0");
  const secs = (elapsed % 60).toString().padStart(2, "0");

  return (
    <>
      <AppHeader title="Live Interview" />
      <div className="p-6">
        <div className="grid lg:grid-cols-[260px_1fr_300px] gap-4">
          {/* Left */}
          <Card className="p-5 space-y-5 h-fit">
            <div>
              <div className="text-xs text-muted-foreground">Progress</div>
              <div className="mt-1 text-2xl font-semibold">{qIdx + 1}<span className="text-muted-foreground text-lg">/{totalQ}</span></div>
              <Progress value={((qIdx + 1) / totalQ) * 100} className="mt-2" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Timer</div>
              <div className="mt-1 text-2xl font-mono font-semibold">{mins}:{secs}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-2">Session</div>
              <Badge variant="secondary">Software Engineer · Medium</Badge>
            </div>
          </Card>

          {/* Center */}
          <Card className="p-8 bg-gradient-card flex flex-col items-center text-center min-h-[500px]">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-primary blur-2xl opacity-40 animate-pulse" />
              <div className="relative h-32 w-32 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow">
                <Sparkles className="h-12 w-12 text-primary-foreground" />
              </div>
            </div>
            <div className="mt-4 text-xs text-muted-foreground">AI Interviewer</div>

            {/* Waveform */}
            <div className="mt-6 flex items-end gap-1 h-12">
              {Array.from({ length: 32 }).map((_, i) => (
                <div key={i}
                  className="w-1 bg-gradient-primary rounded-full"
                  style={{
                    height: started ? `${20 + Math.abs(Math.sin((i + elapsed) * 0.4)) * 80}%` : "20%",
                    transition: "height 0.2s",
                  }}
                />
              ))}
            </div>

            <div className="mt-8 max-w-xl">
              <Badge variant="outline" className="mb-3">Question {qIdx + 1}</Badge>
              <p className="text-xl font-medium leading-relaxed">{interviewQuestions[qIdx]}</p>
            </div>

            <div className="mt-auto pt-8 flex items-center gap-2">
              {!started ? (
                <Button size="lg" className="bg-gradient-primary border-0 shadow-elegant gap-2" onClick={() => setStarted(true)}>
                  <Play className="h-4 w-4" /> Start interview
                </Button>
              ) : (
                <>
                  <Button size="icon" variant={muted ? "destructive" : "secondary"} className="rounded-full h-12 w-12" onClick={() => setMuted(!muted)}>
                    {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                  <Button size="icon" variant={camOn ? "secondary" : "destructive"} className="rounded-full h-12 w-12" onClick={() => setCamOn(!camOn)}>
                    {camOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                  </Button>
                  <Button size="icon" variant="secondary" className="rounded-full h-12 w-12" onClick={() => setQIdx((q) => Math.min(q + 1, totalQ - 1))}>
                    →
                  </Button>
                  <Link
                    to="/reports"
                    onClick={() => {
                      const cfg = getCurrentConfig();
                      const mins = Math.max(1, Math.round(elapsed / 60));
                      addInterview({
                        role: cfg?.role ?? "Software Engineer",
                        difficulty: cfg?.difficulty ?? "Medium",
                        duration: `${mins} min`,
                        score: 70 + Math.floor(Math.random() * 26),
                      });
                    }}
                  >
                    <Button size="icon" variant="destructive" className="rounded-full h-12 w-12"><PhoneOff className="h-4 w-4" /></Button>
                  </Link>
                </>
              )}
            </div>
          </Card>

          {/* Right */}
          <div className="space-y-4">
            <Card className="p-5">
              <h3 className="font-semibold text-sm mb-3">Notes</h3>
              <Textarea placeholder="Jot down thoughts during the interview..." className="min-h-32 text-sm" />
            </Card>
            <Card className="p-5">
              <h3 className="font-semibold text-sm mb-3">Question History</h3>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {interviewQuestions.slice(0, qIdx + 1).map((q, i) => (
                  <div key={i} className={`p-2 rounded-lg text-xs ${i === qIdx ? "bg-primary/10 border border-primary/30" : "bg-muted/40"}`}>
                    <div className="text-muted-foreground mb-0.5">Q{i + 1}</div>
                    <div className="line-clamp-2">{q}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
