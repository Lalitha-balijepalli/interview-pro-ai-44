import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useInterviewHistory, getLatestReport, type FinalReport } from "@/lib/session-store";
import { Download, Share2, ThumbsUp, TriangleAlert, Lightbulb, Trophy, FileBarChart } from "lucide-react";
import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({ meta: [{ title: "Report — InterviewAI Pro" }] }),
  component: Report,
});

function Report() {
  const { history, loading, isAuthenticated } = useInterviewHistory();
  const [saved, setSaved] = useState<FinalReport | null>(null);

  useEffect(() => {
    setSaved(getLatestReport());
    const on = () => setSaved(getLatestReport());
    window.addEventListener("interviewai:history-changed", on);
    return () => window.removeEventListener("interviewai:history-changed", on);
  }, []);

  // Prefer the AI-generated final report (has real evaluations); fall back to
  // a derived view from the most recent history entry.
  const latest = history[0];
  const source =
    saved
      ? {
          role: saved.role,
          difficulty: saved.difficulty,
          duration: saved.duration,
          date: saved.date,
          overall: saved.overallScore,
          summary: saved.summary,
          strengths: saved.strengths,
          weaknesses: saved.weaknesses,
          recommendations: saved.recommendations,
          breakdown: saved.breakdown,
          evaluations: saved.evaluations,
        }
      : latest
        ? (() => {
            const s = latest.score;
            const skew = (d: number) => Math.max(0, Math.min(100, s + d));
            const breakdown = [
              { label: "Technical Knowledge", value: skew(3) },
              { label: "Communication", value: skew(-2) },
              { label: "Confidence", value: skew(-6) },
              { label: "Problem Solving", value: skew(1) },
              { label: "Depth", value: skew(-4) },
              { label: "Clarity", value: skew(5) },
            ];
            return {
              role: latest.role,
              difficulty: latest.difficulty,
              duration: latest.duration,
              date: latest.date,
              overall: s,
              summary: "",
              strengths: breakdown.filter((b) => b.value >= s).map((b) => `Strong ${b.label.toLowerCase()}`),
              weaknesses: breakdown.filter((b) => b.value < s).map((b) => `Improve ${b.label.toLowerCase()}`),
              recommendations: [
                "Practice mock interviews weekly to build consistency.",
                "Record and review answers to spot filler words.",
                "Prepare STAR-format stories for behavioral prompts.",
              ],
              breakdown,
              evaluations: [] as FinalReport["evaluations"],
            };
          })()
        : null;

  if (!source) {
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

  const overall = source.overall;

  function downloadPDF() {
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 48;
      let y = margin;

      const addLine = (text: string, opts: { size?: number; bold?: boolean; color?: [number, number, number]; gap?: number } = {}) => {
        const { size = 11, bold = false, color = [30, 30, 30], gap = 4 } = opts;
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.setFontSize(size);
        doc.setTextColor(color[0], color[1], color[2]);
        const lines = doc.splitTextToSize(text, pageWidth - margin * 2);
        for (const l of lines) {
          if (y > pageHeight - margin) { doc.addPage(); y = margin; }
          doc.text(l, margin, y);
          y += size + gap;
        }
      };

      addLine("Interview Report", { size: 22, bold: true, gap: 8 });
      addLine(`${source.role} · ${source.difficulty}`, { size: 13, bold: true });
      addLine(`${source.date} · ${source.duration}`, { size: 10, color: [110, 110, 110], gap: 12 });

      addLine(`Overall Score: ${overall}/100`, { size: 16, bold: true, gap: 10 });
      if (source.summary) addLine(source.summary, { size: 11, gap: 12 });

      addLine("Strengths", { size: 13, bold: true, gap: 6 });
      source.strengths.forEach((s) => addLine(`• ${s}`));
      y += 6;

      addLine("Areas to improve", { size: 13, bold: true, gap: 6 });
      source.weaknesses.forEach((w) => addLine(`• ${w}`));
      y += 6;

      addLine("Recommendations", { size: 13, bold: true, gap: 6 });
      source.recommendations.forEach((r) => addLine(`• ${r}`));
      y += 6;

      addLine("Score breakdown", { size: 13, bold: true, gap: 6 });
      source.breakdown.forEach((b) => addLine(`${b.label}: ${b.value}/100`));

      if (source.evaluations.length > 0) {
        y += 8;
        addLine("Per-question breakdown", { size: 13, bold: true, gap: 8 });
        source.evaluations.forEach((e, i) => {
          addLine(`Q${i + 1}. ${e.question}`, { bold: true, gap: 4 });
          addLine(`Score: ${e.score}/100`, { size: 10, color: [110, 110, 110] });
          addLine(`Your answer: ${e.answer || "—"}`, { size: 10 });
          addLine(`Feedback: ${e.feedback}`, { size: 10, gap: 10 });
        });
      }

      const filename = `interview-report-${source.role.replace(/\s+/g, "-").toLowerCase()}-${source.date}.pdf`;
      doc.save(filename);
      toast.success("Report downloaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate PDF");
    }
  }

  async function shareReport() {
    const text = `Interview Report — ${source!.role} (${source!.difficulty})\nOverall score: ${overall}/100\n${source!.summary || ""}`.trim();
    try {
      if (navigator.share) {
        await navigator.share({ title: "Interview Report", text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("Report summary copied to clipboard");
      }
    } catch {
      /* user cancelled */
    }
  }

  return (
    <>
      <AppHeader title="Interview Report" />
      <div className="p-6 space-y-6 max-w-6xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-semibold">{source.role} · {source.difficulty}</h2>
            <p className="text-sm text-muted-foreground">{source.date} · {source.duration}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={shareReport}><Share2 className="h-4 w-4" />Share</Button>
            <Button className="bg-gradient-primary border-0 gap-2" onClick={downloadPDF}><Download className="h-4 w-4" />Download PDF</Button>
          </div>
        </div>


        <Card className="p-8 bg-gradient-card text-center">
          <Trophy className="h-8 w-8 mx-auto text-warning mb-2" />
          <div className="text-sm text-muted-foreground">Overall Score</div>
          <div className="text-7xl font-bold text-gradient mt-2">{overall}</div>
          <Badge variant="secondary" className="mt-3">
            {overall >= 85 ? "Strong performance" : overall >= 70 ? "Solid effort" : "Keep practicing"}
          </Badge>
          {source.summary && (
            <p className="mt-4 text-sm text-muted-foreground max-w-2xl mx-auto">{source.summary}</p>
          )}
        </Card>

        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3"><ThumbsUp className="h-4 w-4 text-success" /><h3 className="font-semibold">Strengths</h3></div>
            <ul className="space-y-2">{source.strengths.map((s, i) => <li key={i} className="text-sm flex gap-2"><div className="h-1.5 w-1.5 rounded-full bg-success mt-1.5" />{s}</li>)}</ul>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3"><TriangleAlert className="h-4 w-4 text-warning" /><h3 className="font-semibold">Areas to improve</h3></div>
            <ul className="space-y-2">{source.weaknesses.map((w, i) => <li key={i} className="text-sm flex gap-2"><div className="h-1.5 w-1.5 rounded-full bg-warning mt-1.5" />{w}</li>)}</ul>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3"><Lightbulb className="h-4 w-4 text-primary" /><h3 className="font-semibold">Recommendations</h3></div>
            <ul className="space-y-2">{source.recommendations.map((r, i) => <li key={i} className="text-sm flex gap-2"><div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />{r}</li>)}</ul>
          </Card>
        </div>

        <Card className="p-5">
          <h3 className="font-semibold mb-4">Score breakdown</h3>
          <div className="space-y-4">
            {source.breakdown.map((b) => (
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

        {source.evaluations.length > 0 && (
          <Card className="p-5">
            <h3 className="font-semibold mb-4">Per-question breakdown</h3>
            <div className="space-y-4">
              {source.evaluations.map((e, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="text-sm font-medium">Q{i + 1}. {e.question}</div>
                    <Badge variant="secondary">{e.score}/100</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mb-2"><span className="font-medium text-foreground">Your answer:</span> {e.answer || "—"}</div>
                  <div className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Feedback:</span> {e.feedback}</div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
