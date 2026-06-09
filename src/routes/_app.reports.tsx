import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { strengths, weaknesses, recommendations } from "@/lib/mock-data";
import { Download, Share2, ThumbsUp, TriangleAlert, Lightbulb, Trophy } from "lucide-react";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({ meta: [{ title: "Report — InterviewAI Pro" }] }),
  component: Report,
});

const breakdown = [
  { label: "Technical Knowledge", value: 88 },
  { label: "Communication", value: 82 },
  { label: "Confidence", value: 76 },
  { label: "Problem Solving", value: 85 },
  { label: "Eye Contact", value: 71 },
  { label: "Voice Analysis", value: 90 },
];

function Report() {
  const overall = Math.round(breakdown.reduce((s, b) => s + b.value, 0) / breakdown.length);
  return (
    <>
      <AppHeader title="Interview Report" />
      <div className="p-6 space-y-6 max-w-6xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-semibold">Software Engineer · Medium</h2>
            <p className="text-sm text-muted-foreground">June 8, 2026 · 15 minutes · 8 questions</p>
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
          <Badge variant="secondary" className="mt-3">Strong performance · Top 18%</Badge>
        </Card>

        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3"><ThumbsUp className="h-4 w-4 text-success" /><h3 className="font-semibold">Strengths</h3></div>
            <ul className="space-y-2">{strengths.map(s => <li key={s} className="text-sm flex gap-2"><div className="h-1.5 w-1.5 rounded-full bg-success mt-1.5" />{s}</li>)}</ul>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3"><TriangleAlert className="h-4 w-4 text-warning" /><h3 className="font-semibold">Areas to improve</h3></div>
            <ul className="space-y-2">{weaknesses.map(w => <li key={w} className="text-sm flex gap-2"><div className="h-1.5 w-1.5 rounded-full bg-warning mt-1.5" />{w}</li>)}</ul>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3"><Lightbulb className="h-4 w-4 text-primary" /><h3 className="font-semibold">Recommendations</h3></div>
            <ul className="space-y-2">{recommendations.map(r => <li key={r} className="text-sm flex gap-2"><div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />{r}</li>)}</ul>
          </Card>
        </div>

        <Card className="p-5">
          <h3 className="font-semibold mb-4">Score breakdown</h3>
          <div className="space-y-4">
            {breakdown.map((b) => (
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
