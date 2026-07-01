import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useInterviewHistory } from "@/lib/session-store";
import { Download, Share2, ThumbsUp, TriangleAlert, Lightbulb, Trophy, FileBarChart } from "lucide-react";
import { useMemo } from "react";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({ meta: [{ title: "Report — InterviewAI Pro" }] }),
  component: Report,
});

function Report() {
  const { history, loading, isAuthenticated } = useInterviewHistory();
  const latest = history[0];

  const report = useMemo(() => {
    if (!latest) return null;
    const s = latest.score;
    const skew = (d: number) => Math.max(0, Math.min(100, s + d));
    const breakdown = [
      { label: "Technical Knowledge", value: skew(3) },
      { label: "Communication", value: skew(-2) },
      { label: "Confidence", value: skew(-6) },
      { label: "Problem Solving", value: skew(1) },
      { label: "Eye Contact", value: skew(-9) },
      { label: "Voice Analysis", value: skew(5) },
    ];
    const strengths = breakdown.filter((b) => b.value >= s).map((b) => `Strong ${b.label.toLowerCase()}`);
    const weaknesses = breakdown.filter((b) => b.value < s).map((b) => `Improve ${b.label.toLowerCase()}`);
    const recommendations = [
      "Practice mock interviews weekly to build consistency.",
      "Record and review answers to spot filler words.",
      "Prepare STAR-format stories for behavioral prompts.",
    ];
    return { breakdown, strengths, weaknesses, recommendations };
  }, [latest]);

  if (!latest || !report) {
    return (
      <>
        <AppHeader title="Interview Report" />
        <div className="p-6">
          <Card className="p-12 flex flex-col items-center text-center">
            <FileBarChart className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="font-semibold">No report available</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {loading ? "Loading…" : !isAuthenticated ? "Sign in and complete an interview to view your report." : "Finish an interview to see a detailed performance report here."}
            </p>
            <Link to={!isAuthenticated ? "/login" : "/interview-setup"}>
              <Button className="mt-4 bg-gradient-primary border-0">
                {!isAuthenticated ? "Sign in" : "Start interview"}
              </Button>
            </Link>
          </Card>
        </div>
      </>
    );
  }

  const overall = latest.score;
  return (
    <>
      <AppHeader title="Interview Report" />
      <div className="p-6 space-y-6 max-w-6xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-semibold">{latest.role} · {latest.difficulty}</h2>
            <p className="text-sm text-muted-foreground">{latest.date} · {latest.duration}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2"><Share2 className="h-4 w-4" />Share</Button>
            <Button className="bg-gradient-primary border-0 gap-2"><Download className="h-4 w-4" />Download PDF</Button>
          </div>
        </div>

        <Card className="p-8 bg-gradient-card text-center">
          <Trophy className="h-8 w-8 mx-auto text-warning mb-2" />
          <div className="text-sm text-muted-foreground">Overall Score</div>
          <div className="text-7xl font-bold text-gradient mt-2">{overall}</div>
          <Badge variant="secondary" className="mt-3">
            {overall >= 85 ? "Strong performance" : overall >= 70 ? "Solid effort" : "Keep practicing"}
          </Badge>
        </Card>

        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3"><ThumbsUp className="h-4 w-4 text-success" /><h3 className="font-semibold">Strengths</h3></div>
            <ul className="space-y-2">{report.strengths.map(s => <li key={s} className="text-sm flex gap-2"><div className="h-1.5 w-1.5 rounded-full bg-success mt-1.5" />{s}</li>)}</ul>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3"><TriangleAlert className="h-4 w-4 text-warning" /><h3 className="font-semibold">Areas to improve</h3></div>
            <ul className="space-y-2">{report.weaknesses.map(w => <li key={w} className="text-sm flex gap-2"><div className="h-1.5 w-1.5 rounded-full bg-warning mt-1.5" />{w}</li>)}</ul>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3"><Lightbulb className="h-4 w-4 text-primary" /><h3 className="font-semibold">Recommendations</h3></div>
            <ul className="space-y-2">{report.recommendations.map(r => <li key={r} className="text-sm flex gap-2"><div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />{r}</li>)}</ul>
          </Card>
        </div>

        <Card className="p-5">
          <h3 className="font-semibold mb-4">Score breakdown</h3>
          <div className="space-y-4">
            {report.breakdown.map((b) => (
              <div key={b.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span>{b.label}</span>
                  <span className="font-medium">{b.value}/100</span>
                </div>
                <Progress value={b.value} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
