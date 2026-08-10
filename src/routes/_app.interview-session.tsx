import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { interviewQuestions as fallbackQuestions } from "@/lib/mock-data";
import { WebcamMonitor } from "@/components/webcam-monitor";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Video, VideoOff } from "lucide-react";
import {
  addInterview,
  getCurrentConfig,
  getGeneratedQuestions,
  saveLatestReport,
  type PerQuestionEvaluation,
  type MediaAnalyticsSummary,
} from "@/lib/session-store";
import { WavRecorder } from "@/lib/wav-recorder";
import { transcribeAudio, startInterview, pingBackend } from "@/lib/interview-api";
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
  const [webcamEnabled, setWebcamEnabled] = useState(true);
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
  const analyticsRef = useRef<{
    emotionCounts: Record<string, number>;
    attention: number[];
    monitorScores: number[];
    eyeContactCounts: Record<string, number>;
    focusCounts: Record<string, number>;
    samples: number;
  }>({
    emotionCounts: {},
    attention: [],
    monitorScores: [],
    eyeContactCounts: {},
    focusCounts: {},
    samples: 0,
  });

  function handleAnalytics(data: {
    emotion: { dominant_emotion?: string } | null;
    analysis: { attention_score?: number; eye_contact?: string } | null;
    monitor: { overall_score?: number; status?: string } | null;
  }) {
    const a = analyticsRef.current;
    a.samples += 1;
    const em = data.emotion?.dominant_emotion;
    if (em) a.emotionCounts[em] = (a.emotionCounts[em] ?? 0) + 1;
    if (typeof data.analysis?.attention_score === "number")
      a.attention.push(data.analysis.attention_score);
    const ec = data.analysis?.eye_contact;
    if (ec) a.eyeContactCounts[ec] = (a.eyeContactCounts[ec] ?? 0) + 1;
    if (typeof data.monitor?.overall_score === "number")
      a.monitorScores.push(data.monitor.overall_score);
    const st = data.monitor?.status;
    if (st) a.focusCounts[st] = (a.focusCounts[st] ?? 0) + 1;
  }

  function summarizeAnalytics(): MediaAnalyticsSummary | undefined {
    const a = analyticsRef.current;
    if (a.samples === 0) return undefined;
    const topKey = (r: Record<string, number>) =>
      Object.entries(r).sort((x, y) => y[1] - x[1])[0]?.[0] ?? "—";
    const avg = (arr: number[]) =>
      arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : 0;
    return {
      samples: a.samples,
      dominantEmotion: topKey(a.emotionCounts),
      emotionCounts: a.emotionCounts,
      avgAttention: avg(a.attention),
      eyeContact: topKey(a.eyeContactCounts),
      focus: topKey(a.focusCounts),
      avgMonitorScore: avg(a.monitorScores),
    };
  }

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

  function friendlyError(kind: "transcribe" | "evaluate" | "finalize", e: unknown): string {
    const raw = e instanceof Error ? e.message : String(e ?? "");
    const lower = raw.toLowerCase();
    const offline = typeof navigator !== "undefined" && navigator.onLine === false;
    if (offline) return "You appear to be offline. Check your connection and try again.";
    if (lower.includes("failed to fetch") || lower.includes("networkerror")) {
      if (kind === "transcribe")
        return "Couldn't reach the transcription server. Make sure your backend is running and reachable, then retry.";
      return "Network error while contacting the AI service. Please retry.";
    }
    if (lower.includes("rate limit") || raw.includes("429"))
      return "The AI service is rate-limited right now. Wait a few seconds and retry.";
    if (lower.includes("credits") || raw.includes("402"))
      return "AI credits are exhausted. Add credits and retry.";
    if (kind === "transcribe" && (raw.includes("400") || lower.includes("corrupted") || lower.includes("unsupported")))
      return "The audio couldn't be transcribed (it may have been silent or too short). Please re-record and try again.";
    if (kind === "transcribe") return `Transcription failed: ${raw}`;
    if (kind === "evaluate") return `Couldn't score your answer: ${raw}`;
    return `Couldn't generate the final report: ${raw}`;
  }

  function clearError() {
    setError(null);
    setErrorKind(null);
  }

  async function runTranscribe(wav: Blob) {
    setStage("transcribing");
    const text = await transcribeAudio(wav);
    lastTranscriptRef.current = text;
    setTranscript(text);
    return text;
  }

  async function runEvaluate(text: string) {
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
  }

  async function toggleRecord() {
    clearError();
    if (stage === "recording") {
      const rec = recorderRef.current;
      if (!rec) return;
      let wav: Blob;
      try {
        wav = await rec.stop();
      } catch (e) {
        console.error(e);
        setStage("idle");
        toast.error("Recording failed to stop cleanly. Please try again.");
        return;
      } finally {
        recorderRef.current = null;
      }
      if (wav.size < 2048) {
        setStage("idle");
        toast.error("That recording was too short — please try again.");
        return;
      }
      lastWavRef.current = wav;
      try {
        const text = await runTranscribe(wav);
        await runEvaluate(text);
      } catch (e) {
        console.error(e);
        const actualKind: "transcribe" | "evaluate" = lastTranscriptRef.current ? "evaluate" : "transcribe";
        setErrorKind(actualKind);
        setError(friendlyError(actualKind, e));
        setStage("idle");
      }
    } else {
      try {
        const rec = new WavRecorder();
        await rec.start();
        recorderRef.current = rec;
        setTranscript("");
        setEvaluation(null);
        lastWavRef.current = null;
        lastTranscriptRef.current = "";
        setStage("recording");
      } catch (e) {
        console.error(e);
        toast.error("Microphone access denied. Please allow mic to record.");
      }
    }
  }

  async function retry() {
    if (!errorKind) return;
    clearError();
    try {
      if (errorKind === "transcribe") {
        if (!lastWavRef.current) {
          toast.error("No recording to retry — please record again.");
          setStage("idle");
          return;
        }
        const text = await runTranscribe(lastWavRef.current);
        await runEvaluate(text);
      } else if (errorKind === "evaluate") {
        if (!lastTranscriptRef.current) {
          toast.error("No transcript available — please record again.");
          setStage("idle");
          return;
        }
        await runEvaluate(lastTranscriptRef.current);
      } else if (errorKind === "finalize") {
        await finalize([...collected]);
      }
    } catch (e) {
      console.error(e);
      const kind = errorKind;
      setErrorKind(kind);
      setError(friendlyError(kind, e));
      setStage(kind === "finalize" ? "reviewing" : "idle");
    }
  }

  async function nextQuestion() {
    if (qIdx + 1 < totalQ) {
      setQIdx((i) => i + 1);
      setTranscript("");
      setEvaluation(null);
      lastWavRef.current = null;
      lastTranscriptRef.current = "";
      clearError();
      setStage("idle");
    } else {
      await finalize([...collected]);
    }
  }

  async function finalize(items: PerQuestionEvaluation[]) {
    clearError();
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
        mediaAnalytics: summarizeAnalytics(),
      });
      await addInterview({ role, difficulty, duration, score: report.overallScore });
      setStage("done");
      toast.success("Interview complete!");
      navigate({ to: "/reports" });
    } catch (e) {
      console.error(e);
      setErrorKind("finalize");
      setError(friendlyError("finalize", e));
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
              <Alert variant="destructive" className="mt-4 text-left w-full max-w-2xl">
                <TriangleAlert className="h-4 w-4" />
                <AlertTitle>
                  {errorKind === "transcribe"
                    ? "Transcription failed"
                    : errorKind === "evaluate"
                      ? "Scoring failed"
                      : errorKind === "finalize"
                        ? "Report generation failed"
                        : "Something went wrong"}
                </AlertTitle>
                <AlertDescription className="mt-1">
                  <p>{error}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {errorKind && (
                      <Button size="sm" variant="secondary" onClick={retry} disabled={busy}>
                        {busy ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : null}
                        Retry {errorKind === "transcribe" ? "transcription" : errorKind === "evaluate" ? "scoring" : "report"}
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={clearError}>Dismiss</Button>
                  </div>
                </AlertDescription>
              </Alert>
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
            <Card className="p-3 flex items-center justify-between gap-3">
              <Label htmlFor="webcam-toggle" className="flex items-center gap-2 text-sm cursor-pointer">
                {webcamEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                Webcam monitoring
              </Label>
              <Switch
                id="webcam-toggle"
                checked={webcamEnabled}
                onCheckedChange={setWebcamEnabled}
              />
            </Card>
            <WebcamMonitor active={started && webcamEnabled} onAnalytics={handleAnalytics} />
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
