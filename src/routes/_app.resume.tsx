import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { resume as defaultResume } from "@/lib/mock-data";
import {
  parseResume,
  type ParsedResume,
  type SectionConfidence,
} from "@/lib/resume.functions";
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
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  Plus,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/resume")({
  head: () => ({ meta: [{ title: "Resume Manager — InterviewAI Pro" }] }),
  component: ResumePage,
});

type FileMeta = { name: string; sizeKb: number; uploadedAt: Date };

const defaultConfidence: ParsedResume["confidence"] = {
  name: { score: 1, reason: "Sample data" },
  title: { score: 1, reason: "Sample data" },
  skills: { score: 1, reason: "Sample data" },
  projects: { score: 1, reason: "Sample data" },
  experience: { score: 1, reason: "Sample data" },
  education: { score: 1, reason: "Sample data" },
  certifications: { score: 1, reason: "Sample data" },
  overall: { score: 1, reason: "Sample data" },
};

const initialResume: ParsedResume = {
  ...defaultResume,
  confidence: defaultConfidence,
};

function confidenceLevel(score: number): "high" | "medium" | "low" {
  if (score >= 0.8) return "high";
  if (score >= 0.5) return "medium";
  return "low";
}

function ConfidenceBadge({ c }: { c: SectionConfidence }) {
  const level = confidenceLevel(c.score);
  const pct = Math.round(c.score * 100);
  const styles = {
    high: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    low: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  }[level];
  const Icon =
    level === "high" ? CheckCircle2 : level === "medium" ? CircleAlert : AlertTriangle;
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
              styles,
            )}
          >
            <Icon className="h-3 w-3" />
            {pct}%
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">
          <div className="font-medium capitalize">{level} confidence</div>
          {c.reason && <div className="text-muted-foreground mt-0.5">{c.reason}</div>}
          {level !== "high" && (
            <div className="text-muted-foreground mt-1">
              Review and edit this section if it looks off.
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function uncertainRingClass(c: SectionConfidence) {
  const level = confidenceLevel(c.score);
  if (level === "high") return "";
  if (level === "medium")
    return "ring-1 ring-amber-500/30 border-amber-500/30";
  return "ring-1 ring-rose-500/40 border-rose-500/40";
}

function uncertainItemClass(c: SectionConfidence) {
  const level = confidenceLevel(c.score);
  if (level === "high") return "";
  if (level === "medium") return "border-l-2 border-amber-500/50 pl-2";
  return "border-l-2 border-rose-500/60 pl-2";
}

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

// Mark a section as user-confirmed (100% confidence) whenever it's edited.
const confirmed = (reason = "Edited by you"): SectionConfidence => ({
  score: 1,
  reason,
});

function ResumePage() {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resume, setResume] = useState<ParsedResume>(initialResume);
  const [fileMeta, setFileMeta] = useState<FileMeta>({
    name: "resume_alex_morgan_2026.pdf",
    sizeKb: 248,
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const parse = useServerFn(parseResume);

  const conf = resume.confidence;
  const uncertainSections = (
    ["name", "title", "skills", "projects", "experience", "education", "certifications"] as const
  ).filter((k) => conf[k].score < 0.8);

  // Generic patcher — updates a field and marks its section confidence as confirmed.
  function update<K extends keyof ParsedResume>(
    key: K,
    value: ParsedResume[K],
    confKey: keyof ParsedResume["confidence"] = key as keyof ParsedResume["confidence"],
  ) {
    setResume((r) => ({
      ...r,
      [key]: value,
      confidence: { ...r.confidence, [confKey]: confirmed() },
    }));
  }

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
      const overall = Math.round(parsed.confidence.overall.score * 100);
      toast.success(`Resume parsed (${overall}% overall confidence)`);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to parse resume");
    } finally {
      setLoading(false);
    }
  }

  // --- Skills ---
  const [skillDraft, setSkillDraft] = useState("");
  function addSkill() {
    const v = skillDraft.trim();
    if (!v) return;
    if (resume.skills.includes(v)) {
      setSkillDraft("");
      return;
    }
    update("skills", [...resume.skills, v]);
    setSkillDraft("");
  }
  function removeSkill(s: string) {
    update("skills", resume.skills.filter((x) => x !== s));
  }

  // --- Certifications ---
  const [certDraft, setCertDraft] = useState("");
  function addCert() {
    const v = certDraft.trim();
    if (!v) return;
    update("certifications", [...resume.certifications, v]);
    setCertDraft("");
  }
  function updateCert(i: number, v: string) {
    update(
      "certifications",
      resume.certifications.map((c, idx) => (idx === i ? v : c)),
    );
  }
  function removeCert(i: number) {
    update(
      "certifications",
      resume.certifications.filter((_, idx) => idx !== i),
    );
  }

  // --- Projects / Experience / Education helpers ---
  function updateList<T>(
    key: "projects" | "experience" | "education",
    i: number,
    patch: Partial<T>,
  ) {
    const list = resume[key] as unknown as T[];
    const next = list.map((item, idx) =>
      idx === i ? { ...item, ...patch } : item,
    );
    update(key, next as ParsedResume[typeof key]);
  }
  function removeAt(
    key: "projects" | "experience" | "education",
    i: number,
  ) {
    const list = resume[key] as unknown as unknown[];
    update(key, list.filter((_, idx) => idx !== i) as ParsedResume[typeof key]);
  }
  function addProject() {
    update("projects", [...resume.projects, { name: "New project", desc: "" }]);
  }
  function addExperience() {
    update("experience", [
      ...resume.experience,
      { role: "Role", company: "Company", period: "" },
    ]);
  }
  function addEducation() {
    update("education", [
      ...resume.education,
      { degree: "Degree", school: "School", period: "" },
    ]);
  }

  return (
    <>
      <AppHeader title="Resume Manager" />
      <div className="p-6 space-y-6 max-w-6xl">
        <div>
          <h2 className="text-2xl font-semibold">Your resume</h2>
          <p className="text-sm text-muted-foreground">
            Upload your resume so the AI can tailor questions to your experience.
            Click any field to edit it inline — edits mark the section as
            confirmed.
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
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Input
                  value={resume.name}
                  onChange={(e) => update("name", e.target.value)}
                  className="h-8 max-w-xs font-semibold"
                  placeholder="Your name"
                />
                <Badge variant="secondary">Active</Badge>
                <ConfidenceBadge c={conf.overall} />
              </div>
              <Input
                value={resume.title}
                onChange={(e) => update("title", e.target.value)}
                className="h-8 max-w-md text-sm"
                placeholder="Headline / title"
              />
              <p className="text-xs text-muted-foreground">
                {fileMeta.name} · {fileMeta.sizeKb} KB · uploaded{" "}
                {fileMeta.uploadedAt.toLocaleDateString()}
              </p>
            </div>
            <Button variant="ghost" size="icon">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {uncertainSections.length > 0 && (
            <div className="mt-4 flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <div className="font-medium text-amber-700 dark:text-amber-400">
                  Review {uncertainSections.length} uncertain{" "}
                  {uncertainSections.length === 1 ? "section" : "sections"}
                </div>
                <div className="text-muted-foreground mt-0.5 capitalize">
                  {uncertainSections.join(", ")} — click any field to fix.
                </div>
              </div>
            </div>
          )}
        </Card>

        <div className="grid lg:grid-cols-2 gap-4">
          {/* Skills */}
          <Card className={cn("p-5", uncertainRingClass(conf.skills))}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Skills</h3>
              </div>
              <ConfidenceBadge c={conf.skills} />
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {resume.skills.map((s) => (
                <Badge
                  key={s}
                  variant="secondary"
                  className="gap-1 pr-1"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => removeSkill(s)}
                    className="rounded-sm hover:bg-background/60 p-0.5"
                    aria-label={`Remove ${s}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={skillDraft}
                onChange={(e) => setSkillDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                placeholder="Add a skill and press Enter"
                className="h-8"
              />
              <Button size="sm" variant="outline" onClick={addSkill}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </Card>

          {/* Certifications */}
          <Card className={cn("p-5", uncertainRingClass(conf.certifications))}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Certifications</h3>
              </div>
              <ConfidenceBadge c={conf.certifications} />
            </div>
            <ul className="space-y-2 mb-3">
              {resume.certifications.map((c, i) => (
                <li key={i} className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <Input
                    value={c}
                    onChange={(e) => updateCert(i, e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeCert(i)}
                    className="h-8 w-8 shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <Input
                value={certDraft}
                onChange={(e) => setCertDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCert();
                  }
                }}
                placeholder="Add a certification"
                className="h-8"
              />
              <Button size="sm" variant="outline" onClick={addCert}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </Card>

          {/* Projects */}
          <Card className={cn("p-5", uncertainRingClass(conf.projects))}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FolderGit2 className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Projects</h3>
              </div>
              <ConfidenceBadge c={conf.projects} />
            </div>
            <div className="space-y-3">
              {resume.projects.map((p, i) => (
                <div
                  key={i}
                  className={cn(
                    "p-3 rounded-lg bg-muted/40 space-y-2",
                    uncertainItemClass(conf.projects),
                  )}
                >
                  <div className="flex gap-2 items-start">
                    <Input
                      value={p.name}
                      onChange={(e) =>
                        updateList<typeof p>("projects", i, {
                          name: e.target.value,
                        })
                      }
                      placeholder="Project name"
                      className="h-8 text-sm font-medium"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeAt("projects", i)}
                      className="h-8 w-8 shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Textarea
                    value={p.desc}
                    onChange={(e) =>
                      updateList<typeof p>("projects", i, {
                        desc: e.target.value,
                      })
                    }
                    placeholder="Short description"
                    rows={2}
                    className="text-xs resize-none"
                  />
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={addProject}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-1" /> Add project
              </Button>
            </div>
          </Card>

          {/* Experience */}
          <Card className={cn("p-5", uncertainRingClass(conf.experience))}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Experience</h3>
              </div>
              <ConfidenceBadge c={conf.experience} />
            </div>
            <div className="space-y-3">
              {resume.experience.map((e, i) => (
                <div
                  key={i}
                  className={cn(
                    "space-y-2 p-3 rounded-lg bg-muted/40",
                    uncertainItemClass(conf.experience),
                  )}
                >
                  <div className="flex gap-2 items-start">
                    <Input
                      value={e.role}
                      onChange={(ev) =>
                        updateList<typeof e>("experience", i, {
                          role: ev.target.value,
                        })
                      }
                      placeholder="Role"
                      className="h-8 text-sm font-medium"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeAt("experience", i)}
                      className="h-8 w-8 shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={e.company}
                      onChange={(ev) =>
                        updateList<typeof e>("experience", i, {
                          company: ev.target.value,
                        })
                      }
                      placeholder="Company"
                      className="h-8 text-xs"
                    />
                    <Input
                      value={e.period}
                      onChange={(ev) =>
                        updateList<typeof e>("experience", i, {
                          period: ev.target.value,
                        })
                      }
                      placeholder="2022 — Present"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={addExperience}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-1" /> Add experience
              </Button>
            </div>
          </Card>

          {/* Education */}
          <Card
            className={cn("p-5 lg:col-span-2", uncertainRingClass(conf.education))}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Education</h3>
              </div>
              <ConfidenceBadge c={conf.education} />
            </div>
            <div className="space-y-3">
              {resume.education.map((e, i) => (
                <div
                  key={i}
                  className={cn(
                    "grid md:grid-cols-[1fr_1fr_180px_auto] gap-2 items-start p-3 rounded-lg bg-muted/40",
                    uncertainItemClass(conf.education),
                  )}
                >
                  <Input
                    value={e.degree}
                    onChange={(ev) =>
                      updateList<typeof e>("education", i, {
                        degree: ev.target.value,
                      })
                    }
                    placeholder="Degree"
                    className="h-8 text-sm font-medium"
                  />
                  <Input
                    value={e.school}
                    onChange={(ev) =>
                      updateList<typeof e>("education", i, {
                        school: ev.target.value,
                      })
                    }
                    placeholder="School"
                    className="h-8 text-xs"
                  />
                  <Input
                    value={e.period}
                    onChange={(ev) =>
                      updateList<typeof e>("education", i, {
                        period: ev.target.value,
                      })
                    }
                    placeholder="2018 — 2022"
                    className="h-8 text-xs"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeAt("education", i)}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={addEducation}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-1" /> Add education
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
