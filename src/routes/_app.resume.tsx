import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { resume } from "@/lib/mock-data";
import { Upload, FileText, Briefcase, GraduationCap, Award, Code2, FolderGit2, Trash2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_app/resume")({
  head: () => ({ meta: [{ title: "Resume Manager — InterviewAI Pro" }] }),
  component: ResumePage,
});

function ResumePage() {
  const [dragging, setDragging] = useState(false);
  return (
    <>
      <AppHeader title="Resume Manager" />
      <div className="p-6 space-y-6 max-w-6xl">
        <div>
          <h2 className="text-2xl font-semibold">Your resume</h2>
          <p className="text-sm text-muted-foreground">Upload your resume so the AI can tailor questions to your experience.</p>
        </div>

        <Card
          className={`p-10 border-2 border-dashed transition-all ${dragging ? "border-primary bg-primary/5" : "border-border"}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); }}
        >
          <div className="flex flex-col items-center text-center">
            <div className="h-14 w-14 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow mb-4">
              <Upload className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="font-semibold">Drag and drop your resume</h3>
            <p className="text-sm text-muted-foreground mt-1">PDF, DOCX up to 5MB</p>
            <Button className="mt-4 bg-gradient-primary border-0">Browse files</Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><FileText className="h-6 w-6" /></div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold">{resume.name}</h3>
                <Badge variant="secondary">Active</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{resume.title}</p>
              <p className="text-xs text-muted-foreground mt-1">resume_alex_morgan_2026.pdf · 248 KB · uploaded 2 days ago</p>
            </div>
            <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4" /></Button>
          </div>
        </Card>

        <div className="grid lg:grid-cols-2 gap-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4"><Code2 className="h-4 w-4 text-primary" /><h3 className="font-semibold">Skills</h3></div>
            <div className="flex flex-wrap gap-2">{resume.skills.map(s => <Badge key={s} variant="secondary">{s}</Badge>)}</div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4"><Award className="h-4 w-4 text-primary" /><h3 className="font-semibold">Certifications</h3></div>
            <ul className="space-y-2">{resume.certifications.map(c => <li key={c} className="text-sm flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-primary" />{c}</li>)}</ul>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4"><FolderGit2 className="h-4 w-4 text-primary" /><h3 className="font-semibold">Projects</h3></div>
            <div className="space-y-3">{resume.projects.map(p => (
              <div key={p.name} className="p-3 rounded-lg bg-muted/40">
                <div className="text-sm font-medium">{p.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{p.desc}</div>
              </div>
            ))}</div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4"><Briefcase className="h-4 w-4 text-primary" /><h3 className="font-semibold">Experience</h3></div>
            <div className="space-y-3">{resume.experience.map(e => (
              <div key={e.company} className="flex justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">{e.role}</div>
                  <div className="text-xs text-muted-foreground">{e.company}</div>
                </div>
                <div className="text-xs text-muted-foreground">{e.period}</div>
              </div>
            ))}</div>
          </Card>

          <Card className="p-5 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4"><GraduationCap className="h-4 w-4 text-primary" /><h3 className="font-semibold">Education</h3></div>
            <div className="space-y-3">{resume.education.map(e => (
              <div key={e.school} className="flex justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">{e.degree}</div>
                  <div className="text-xs text-muted-foreground">{e.school}</div>
                </div>
                <div className="text-xs text-muted-foreground">{e.period}</div>
              </div>
            ))}</div>
          </Card>
        </div>
      </div>
    </>
  );
}
