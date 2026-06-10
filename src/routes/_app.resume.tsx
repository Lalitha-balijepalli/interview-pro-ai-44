import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { resume as defaultResume } from "@/lib/mock-data";
import { parseResume, type ParsedResume } from "@/lib/resume.functions";
import {
  Upload,
  FileText,
  Briefcase,
  GraduationCap,
  Award,
  Code2,
  FolderGit2,
  Trash2,
  Loader2,
} from "lucide-react";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/resume")({
  head: () => ({ meta: [{ title: "Resume Manager — InterviewAI Pro" }] }),
  component: ResumePage,
});

type FileMeta = { name: string; sizeKb: number; uploadedAt: Date };

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function ResumePage() {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resume, setResume] = useState<ParsedResume>(defaultResume);
  const [fileMeta, setFileMeta] = useState<FileMeta>({
    name: "resume_alex_morgan_2026.pdf",
    sizeKb: 248,
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const parse = useServerFn(parseResume);

  async function handleFile(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large (max 5MB)");
      return;
    }
    if (!/\.pdf$/i.test(file.name)) {
      toast.error("Only PDF files are supported right now");
      return;
    }
    setLoading(true);
    try {
      const base64 = await fileToBase64(file);
      const parsed = await parse({ data: { fileName: file.name, base64 } });
      setResume(parsed);
      setFileMeta({
        name: file.name,
        sizeKb: Math.max(1, Math.round(file.size / 1024)),
        uploadedAt: new Date(),
      });
      toast.success("Resume parsed and fields auto-filled");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to parse resume");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AppHeader title="Resume Manager" />
      <div className="p-6 space-y-6 max-w-6xl">
        <div>
          <h2 className="text-2xl font-semibold">Your resume</h2>
          <p className="text-sm text-muted-foreground">
            Upload your resume so the AI can tailor questions to your experience.
          </p>
        </div>

        <Card
          className={`p-10 border-2 border-dashed transition-all ${dragging ? "border-primary bg-primary/5" : "border-border"} ${loading ? "opacity-70 pointer-events-none" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files?.[0];
            if (f) void handleFile(f);
          }}
        >
          <div className="flex flex-col items-center text-center">
            <div className="h-14 w-14 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow mb-4">
              {loading ? (
                <Loader2 className="h-6 w-6 text-primary-foreground animate-spin" />
              ) : (
                <Upload className="h-6 w-6 text-primary-foreground" />
              )}
            </div>
            <h3 className="font-semibold">
              {loading ? "Parsing your resume…" : "Drag and drop your resume"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {loading ? "This usually takes a few seconds" : "PDF up to 5MB"}
            </p>
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
                e.target.value = "";
              }}
            />
            <Button
              className="mt-4 bg-gradient-primary border-0"
              onClick={() => inputRef.current?.click()}
              disabled={loading}
            >
              {loading ? "Parsing…" : "Browse files"}
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <FileText className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold">{resume.name}</h3>
                <Badge variant="secondary">Active</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{resume.title}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {fileMeta.name} · {fileMeta.sizeKb} KB · uploaded{" "}
                {fileMeta.uploadedAt.toLocaleDateString()}
              </p>
            </div>
            <Button variant="ghost" size="icon">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        <div className="grid lg:grid-cols-2 gap-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Code2 className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Skills</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {resume.skills.map((s) => (
                <Badge key={s} variant="secondary">
                  {s}
                </Badge>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Award className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Certifications</h3>
            </div>
            <ul className="space-y-2">
              {resume.certifications.map((c) => (
                <li key={c} className="text-sm flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {c}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <FolderGit2 className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Projects</h3>
            </div>
            <div className="space-y-3">
              {resume.projects.map((p) => (
                <div key={p.name} className="p-3 rounded-lg bg-muted/40">
                  <div className="text-sm font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {p.desc}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Experience</h3>
            </div>
            <div className="space-y-3">
              {resume.experience.map((e, i) => (
                <div key={`${e.company}-${i}`} className="flex justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{e.role}</div>
                    <div className="text-xs text-muted-foreground">{e.company}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{e.period}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Education</h3>
            </div>
            <div className="space-y-3">
              {resume.education.map((e, i) => (
                <div key={`${e.school}-${i}`} className="flex justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{e.degree}</div>
                    <div className="text-xs text-muted-foreground">{e.school}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{e.period}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
