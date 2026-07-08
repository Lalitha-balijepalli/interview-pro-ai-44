import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { VideoOff } from "lucide-react";

const DEFAULT_BASE =
  "https://glorious-waffle-r4r5w4rw6xj7f5557-8000.app.github.dev";

function baseUrl(): string {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
  return (env?.VITE_INTERVIEW_API_URL || DEFAULT_BASE).replace(/\/+$/, "");
}

type EmotionResp = { dominant_emotion?: string; scores?: Record<string, number> };
type AnalysisResp = { attention_score?: number; eye_contact?: string };
type MonitorResp = { overall_score?: number; status?: string };

interface Props {
  active: boolean;
}

export function WebcamMonitor({ active }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [emotion, setEmotion] = useState<EmotionResp | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResp | null>(null);
  const [monitor, setMonitor] = useState<MonitorResp | null>(null);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    async function startCam() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setPermissionError(null);
        intervalRef.current = setInterval(captureAndSend, 3000);
      } catch (e) {
        console.error(e);
        setPermissionError("Camera permission required for AI monitoring.");
      }
    }

    async function captureAndSend() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;
      const w = video.videoWidth || 640;
      const h = video.videoHeight || 480;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, w, h);
      const blob: Blob | null = await new Promise((res) =>
        canvas.toBlob((b) => res(b), "image/jpeg", 0.8),
      );
      if (!blob) return;

      const url = baseUrl();
      const send = async <T,>(path: string): Promise<T | null> => {
        try {
          const fd = new FormData();
          fd.append("file", blob, "frame.jpg");
          const r = await fetch(`${url}${path}`, { method: "POST", body: fd });
          if (!r.ok) return null;
          return (await r.json()) as T;
        } catch {
          return null;
        }
      };

      const [em, an, mo] = await Promise.all([
        send<EmotionResp>("/emotion/detect"),
        send<AnalysisResp>("/analysis/analyze"),
        send<MonitorResp>("/monitor/live"),
      ]);
      if (em) setEmotion(em);
      if (an) setAnalysis(an);
      if (mo) setMonitor(mo);
      // On failure, last successful values are kept; interval retries in 3s.
    }

    startCam();

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [active]);

  if (!active) return null;

  return (
    <div className="space-y-3">
      <Card className="overflow-hidden">
        <div className="relative bg-black aspect-video">
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {permissionError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white p-4 text-center text-xs">
              <div className="flex flex-col items-center gap-2">
                <VideoOff className="h-6 w-6" />
                <span>{permissionError}</span>
              </div>
            </div>
          )}
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </Card>

      {permissionError ? (
        <Alert variant="destructive">
          <AlertDescription>{permissionError}</AlertDescription>
        </Alert>
      ) : (
        <Card className="p-4 space-y-3">
          <h3 className="font-semibold text-sm">Live AI Analytics</h3>

          <div className="grid grid-cols-2 gap-2">
            <StatCard
              icon="😊"
              label="Emotion"
              value={emotion?.dominant_emotion ?? "—"}
            />
            <StatCard
              icon="👁"
              label="Eye Contact"
              value={analysis?.eye_contact ?? "—"}
            />
            <StatCard
              icon="🧠"
              label="Focus"
              value={monitor?.status ?? "—"}
            />
            <StatCard
              icon="⭐"
              label="Overall"
              value={
                typeof monitor?.overall_score === "number"
                  ? `${monitor.overall_score}`
                  : "—"
              }
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">🎯 Attention</span>
              <Badge variant="secondary">
                {typeof analysis?.attention_score === "number"
                  ? `${analysis.attention_score}%`
                  : "—"}
              </Badge>
            </div>
            <Progress value={analysis?.attention_score ?? 0} />
          </div>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border p-2.5 bg-muted/30">
      <div className="text-xs text-muted-foreground flex items-center gap-1">
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      <div className="text-sm font-semibold mt-1 truncate capitalize">{value}</div>
    </div>
  );
}
