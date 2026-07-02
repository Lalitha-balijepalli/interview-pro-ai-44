import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { interviewQuestions as fallbackQuestions } from "@/lib/mock-data";
import {
  addInterview,
  getCurrentConfig,
  getGeneratedQuestions,
  saveLatestReport,
  type PerQuestionEvaluation,
} from "@/lib/session-store";
import { WavRecorder } from "@/lib/wav-recorder";
import { transcribeAudio, startInterview } from "@/lib/interview-api";
import { evaluateAnswer, generateFinalReport } from "@/lib/evaluate.functions";
import {
  Mic, MicOff, PhoneOff, Play, Sparkles, Loader2, ArrowRight,
  ThumbsUp, TriangleAlert, Lightbulb, CheckCircle2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/interview-session")({
  head: () => ({ meta: [{ title: "Interview Session — InterviewAI Pro" }] }),
  component: Session,
});

type Stage = "idle" | "recording" | "transcribing" | "evaluating" | "reviewing" | "finalizing" | "done";

function Session() {
  const navigate = useNavigate();
  const cfg = getCurrentConfig();
  const role = cfg?.role ?? "Software Engineer";
  const difficulty = cfg?.difficulty ?? "Medium";

  const [questions] = useState<string[]>(() => {
    const gen = getGeneratedQuestions();
    return gen && gen.length ? gen : fallbackQuestions;
  });

  const [started, setStarted] = useState(false);
  const [qIdx, setQIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [stage, setStage] = useState<Stage>("idle");
  const [transcript, setTranscript] = useState("");
  const [evaluation, setEvaluation] = useState<PerQuestionEvaluation | null>(null);
  const [collected, setCollected] = useState<PerQuestionEvaluation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<null | "transcribe" | "evaluate" | "finalize">(null);
  const recorderRef = useRef<WavRecorder | null>(null);
  const lastWavRef = useRef<Blob | null>(null);
  const lastTranscriptRef = useRef<string>("");

  const totalQ = questions.length;
  const mins = Math.floor(elapsed / 60).toString().padStart(2, "0");
  const secs = (elapsed % 60).toString().padStart(2, "0");

  useEffect(() => {
    if (!started) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [started]);

  async function beginSession() {
    setStarted(true);
    setError(null);
    // Fire-and-forget: notify FastAPI backend
    void startInterview({ role, difficulty, questions });
  }

  async function toggleRecord() {
    setError(null);
    if (stage === "recording") {
      const rec = recorderRef.current;
      if (!rec) return;
      try {
        setStage("transcribing");
        const wav = await rec.stop();
        recorderRef.current = null;
        if (wav.size < 2048) {
          setStage("idle");
          toast.error("That recording was too short — please try again.");
          return;
        }
        const text = await transcribeAudio(wav);
        setTranscript(text);
        setStage("evaluating");
        const evalResult = await evaluateAnswer({
          data: { question: questions[qIdx], answer: text, role, difficulty },
        });
        const item: PerQuestionEvaluation = {
          question: questions[qIdx],
          answer: text,
          ...evalResult,
        };
        setEvaluation(item);
        setCollected((prev) => [...prev, item]);
        setStage("reviewing");
      } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : "Something went wrong.");
        setStage("idle");
      }
    } else {
      try {
        const rec = new WavRecorder();
        await rec.start();
        recorderRef.current = rec;
        setTranscript("");
        setEvaluation(null);
        setStage("recording");
      } catch (e) {
        console.error(e);
        toast.error("Microphone access denied. Please allow mic to record.");
      }
    }
  }

  async function nextQuestion() {
    if (qIdx + 1 < totalQ) {
      setQIdx((i) => i + 1);
      setTranscript("");
      setEvaluation(null);
      setStage("idle");
    } else {
      await finalize([...collected]);
    }
  }

  async function finalize(items: PerQuestionEvaluation[]) {
    setStage("finalizing");
    try {
      const report = await generateFinalReport({
        data: {
          role,
          difficulty,
          items: items.map((i) => ({
            question: i.question,
            answer: i.answer,
            score: i.score,
            feedback: i.feedback,
          })),
        },
      });
      const durationMin = Math.max(1, Math.round(elapsed / 60));
      const duration = `${durationMin} min`;
      saveLatestReport({
        role,
        difficulty,
        duration,
        date: new Date().toISOString().slice(0, 10),
        overallScore: report.overallScore,
        summary: report.summary,
        strengths: report.strengths,
        weaknesses: report.weaknesses,
        recommendations: report.recommendations,
        breakdown: report.breakdown,
        evaluations: items,
      });
      await addInterview({ role, difficulty, duration, score: report.overallScore });
      setStage("done");
      toast.success("Interview complete!");
      navigate({ to: "/reports" });
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Failed to generate report.");
      setStage("reviewing");
    }
  }

  const busy = stage === "transcribing" || stage === "evaluating" || stage === "finalizing";

  return (
    <>
      <AppHeader title="Live Interview" />
      <div className="p-6">
        <div className="grid lg:grid-cols-[260px_1fr_320px] gap-4">
          {/* Left */}
          <Card className="p-5 space-y-5 h-fit">
            <div>
              <div className="text-xs text-muted-foreground">Progress</div>
              <div className="mt-1 text-2xl font-semibold">
                {qIdx + 1}<span className="text-muted-foreground text-lg">/{totalQ}</span>
              </div>
              <Progress value={((qIdx + 1) / totalQ) * 100} className="mt-2" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Timer</div>
              <div className="mt-1 text-2xl font-mono font-semibold">{mins}:{secs}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-2">Session</div>
              <Badge variant="secondary">{role} · {difficulty}</Badge>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-2">Answered</div>
              <div className="text-sm font-medium">{collected.length} / {totalQ}</div>
            </div>
          </Card>

          {/* Center */}
          <Card className="p-8 bg-gradient-card flex flex-col items-center text-center min-h-[560px]">
            <div className="relative">
              <div className={`absolute inset-0 rounded-full bg-gradient-primary blur-2xl opacity-40 ${stage === "recording" ? "animate-pulse" : ""}`} />
              <div className="relative h-28 w-28 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow">
                <Sparkles className="h-10 w-10 text-primary-foreground" />
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">AI Interviewer</div>

            <div className="mt-6 flex items-end gap-1 h-10">
              {Array.from({ length: 28 }).map((_, i) => (
                <div key={i}
                  className="w-1 bg-gradient-primary rounded-full"
                  style={{
                    height: stage === "recording" ? `${20 + Math.abs(Math.sin((i + elapsed) * 0.6)) * 80}%` : "18%",
                    transition: "height 0.2s",
                  }}
                />
              ))}
            </div>

            <div className="mt-6 max-w-2xl w-full">
              <Badge variant="outline" className="mb-3">Question {qIdx + 1} of {totalQ}</Badge>
              <p className="text-lg font-medium leading-relaxed">{questions[qIdx]}</p>
            </div>

            {transcript && (
              <div className="mt-5 w-full max-w-2xl text-left">
                <div className="text-xs text-muted-foreground mb-1">Your answer (transcribed)</div>
                <div className="text-sm p-3 rounded-lg bg-muted/40 border">{transcript}</div>
              </div>
            )}

            {error && (
              <div className="mt-4 text-sm text-destructive">{error}</div>
            )}

            <div className="mt-auto pt-8 flex items-center gap-2">
              {!started ? (
                <Button size="lg" className="bg-gradient-primary border-0 shadow-elegant gap-2" onClick={beginSession}>
                  <Play className="h-4 w-4" /> Start interview
                </Button>
              ) : stage === "reviewing" ? (
                <Button size="lg" className="bg-gradient-primary border-0 gap-2" onClick={nextQuestion}>
                  {qIdx + 1 < totalQ ? (<>Next question <ArrowRight className="h-4 w-4" /></>) : (<>Finish & view report <CheckCircle2 className="h-4 w-4" /></>)}
                </Button>
              ) : (
                <>
                  <Button
                    size="icon"
                    variant={stage === "recording" ? "destructive" : "secondary"}
                    className="rounded-full h-14 w-14"
                    onClick={toggleRecord}
                    disabled={busy}
                    aria-label={stage === "recording" ? "Stop recording" : "Start recording"}
                  >
                    {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : stage === "recording" ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </Button>
                  <Link
                    to="/dashboard"
                    onClick={(e) => {
                      if (!confirm("End interview and discard progress?")) e.preventDefault();
                    }}
                  >
                    <Button size="icon" variant="secondary" className="rounded-full h-14 w-14"><PhoneOff className="h-5 w-5" /></Button>
                  </Link>
                </>
              )}
            </div>

            {stage === "transcribing" && <div className="mt-3 text-xs text-muted-foreground">Transcribing your answer…</div>}
            {stage === "evaluating" && <div className="mt-3 text-xs text-muted-foreground">Gemini is evaluating your answer…</div>}
            {stage === "finalizing" && <div className="mt-3 text-xs text-muted-foreground">Generating final report…</div>}
            {stage === "idle" && started && <div className="mt-3 text-xs text-muted-foreground">Tap the mic to record your answer.</div>}
          </Card>

          {/* Right */}
          <div className="space-y-4">
            {evaluation ? (
              <>
                <Card className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">Score</h3>
                    <Badge variant="secondary" className="text-base px-3 py-1">{evaluation.score}/100</Badge>
                  </div>
                  <Progress value={evaluation.score} />
                  <p className="text-sm mt-3 text-muted-foreground">{evaluation.feedback}</p>
                </Card>
                <Card className="p-5">
                  <div className="flex items-center gap-2 mb-2"><ThumbsUp className="h-4 w-4 text-success" /><h3 className="font-semibold text-sm">Strengths</h3></div>
                  <ul className="space-y-1.5">
                    {evaluation.strengths.map((s, i) => (
                      <li key={i} className="text-xs flex gap-2"><div className="h-1.5 w-1.5 rounded-full bg-success mt-1.5" />{s}</li>
                    ))}
                  </ul>
                </Card>
                <Card className="p-5">
                  <div className="flex items-center gap-2 mb-2"><TriangleAlert className="h-4 w-4 text-warning" /><h3 className="font-semibold text-sm">Weaknesses</h3></div>
                  <ul className="space-y-1.5">
                    {evaluation.weaknesses.map((s, i) => (
                      <li key={i} className="text-xs flex gap-2"><div className="h-1.5 w-1.5 rounded-full bg-warning mt-1.5" />{s}</li>
                    ))}
                  </ul>
                </Card>
                <Card className="p-5">
                  <div className="flex items-center gap-2 mb-2"><Lightbulb className="h-4 w-4 text-primary" /><h3 className="font-semibold text-sm">Suggestions</h3></div>
                  <ul className="space-y-1.5">
                    {evaluation.suggestions.map((s, i) => (
                      <li key={i} className="text-xs flex gap-2"><div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />{s}</li>
                    ))}
                  </ul>
                </Card>
                <Card className="p-5">
                  <h3 className="font-semibold text-sm mb-2">Ideal answer</h3>
                  <p className="text-xs text-muted-foreground whitespace-pre-line">{evaluation.idealAnswer}</p>
                </Card>
              </>
            ) : (
              <>
                <Card className="p-5">
                  <h3 className="font-semibold text-sm mb-3">How it works</h3>
                  <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside">
                    <li>Tap the mic and speak your answer.</li>
                    <li>Tap again to stop — we transcribe & score it.</li>
                    <li>Review Gemini's feedback, then continue.</li>
                    <li>Finish all questions to unlock the final report.</li>
                  </ol>
                </Card>
                <Card className="p-5">
                  <h3 className="font-semibold text-sm mb-3">Notes</h3>
                  <Textarea placeholder="Jot down thoughts during the interview..." className="min-h-28 text-sm" />
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
