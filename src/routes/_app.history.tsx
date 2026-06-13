import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useInterviewHistory, removeInterview, setCurrentConfig } from "@/lib/session-store";
import { Search, RotateCcw, FileBarChart, Inbox, Trash2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_app/history")({
  head: () => ({ meta: [{ title: "Interview History — InterviewAI Pro" }] }),
  component: History,
});

function History() {
  const { history, loading, isAuthenticated } = useInterviewHistory();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const filtered = history.filter((h) =>
    `${h.role} ${h.difficulty} ${h.date}`.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <>
      <AppHeader title="Interview History" />
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-end flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-semibold">All interviews</h2>
            <p className="text-sm text-muted-foreground">Review and retake any past session.</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." className="pl-9 w-64" />
          </div>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Score</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                      <Inbox className="h-8 w-8 mb-2 opacity-60" />
                      <div className="font-medium text-foreground">No interviews yet</div>
                      <div className="text-xs mt-1">Start your first session to see it here.</div>
                      <Link to="/interview-setup"><Button size="sm" className="mt-4 bg-gradient-primary border-0">Start interview</Button></Link>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filtered.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="text-muted-foreground">{h.date}</TableCell>
                  <TableCell className="font-medium">{h.role}</TableCell>
                  <TableCell>
                    <Badge variant={h.difficulty === "Hard" ? "destructive" : h.difficulty === "Medium" ? "secondary" : "outline"}>
                      {h.difficulty}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{h.duration}</TableCell>
                  <TableCell>
                    <span className={`font-semibold ${h.score >= 85 ? "text-success" : h.score >= 75 ? "text-warning" : "text-destructive"}`}>{h.score}%</span>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Link to="/reports"><Button variant="ghost" size="sm" className="gap-1"><FileBarChart className="h-3.5 w-3.5" />Report</Button></Link>
                    <Button variant="ghost" size="sm" className="gap-1" onClick={() => {
                      const mins = parseInt(h.duration);
                      setCurrentConfig({ role: h.role, difficulty: h.difficulty, durationMin: isNaN(mins) ? 15 : mins });
                      navigate({ to: "/interview-setup" });
                    }}><RotateCcw className="h-3.5 w-3.5" />Retake</Button>
                    <Button variant="ghost" size="sm" className="gap-1 text-destructive hover:text-destructive" onClick={() => { if (window.confirm("Delete this interview session?")) removeInterview(h.id); }}><Trash2 className="h-3.5 w-3.5" />Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </>
  );
}
