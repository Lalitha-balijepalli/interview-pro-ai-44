import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { VideoOff, Loader2, Camera, RefreshCw, Mic, Smartphone } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const DEFAULT_BASE =
  "https://glorious-waffle-r4r5w4rw6xj7f5557-8000.app.github.dev";

function baseUrl(): string {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
  return (env?.VITE_INTERVIEW_API_URL || DEFAULT_BASE).replace(/\/+$/, "");
}

type EmotionResp = { dominant_emotion?: string; scores?: Record<string, number> };
type AnalysisResp = { attention_score?: number; eye_contact?: string };
type MonitorResp = { overall_score?: number; status?: string };

type CamStatus = "idle" | "requesting" | "ready" | "error";

interface Props {
  active: boolean;
  onStream?: (stream: MediaStream | null) => void;
}

export function WebcamMonitor({ active, onStream }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMobile = useIsMobile();

  const [status, setStatus] = useState<CamStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [emotion, setEmotion] = useState<EmotionResp | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResp | null>(null);
  const [monitor, setMonitor] = useState<MonitorResp | null>(null);

  useEffect(() => {
    if (!active) {
      setStatus("idle");
      return;
    }
    let cancelled = false;
    setStatus("requesting");
    setErrorMsg(null);
    setIsPermissionDenied(false);

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
    }

    async function startCam() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("getUserMedia not supported in this browser");
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        onStream?.(stream);
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          try {
            await video.play();
          } catch (playErr) {
            console.error("Camera Error (play):", playErr);
          }
        }
        setStatus("ready");
        intervalRef.current = setInterval(captureAndSend, 3000);
      } catch (error) {
        console.error("Camera Error:", error);
        if (!cancelled) {
          const name = error instanceof Error ? error.name : "";
          const denied =
            name === "NotAllowedError" ||
            name === "SecurityError" ||
            name === "PermissionDeniedError";
          setIsPermissionDenied(denied);
          setErrorMsg(
            error instanceof Error && error.message
              ? error.message
              : "Unable to access camera",
          );
          setStatus("error");
        }
      }
    }

    startCam();

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        onStream?.(null);
      }
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [active, onStream]);

  if (!active) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <VideoOff className="h-4 w-4" />
          <span>Webcam monitoring disabled.</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <Card className="overflow-hidden">
        <div className="relative bg-black aspect-video">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover rounded-lg"
          />
          {status === "requesting" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white p-4 text-center text-xs">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Requesting camera permission...</span>
              </div>
            </div>
          )}
          {status === "error" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white p-4 text-center text-xs">
              <div className="flex flex-col items-center gap-2">
                <VideoOff className="h-6 w-6" />
                <span>Unable to access camera</span>
              </div>
            </div>
          )}
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </Card>

      {status === "error" && errorMsg && (
        <Alert variant="destructive">
          <AlertDescription className="text-xs">{errorMsg}</AlertDescription>
        </Alert>
      )}

      {status === "ready" && (
        <Card className="p-4 space-y-3">
          <h3 className="font-semibold text-sm">Live AI Analytics</h3>

          <div className="grid grid-cols-2 gap-2">
            <StatCard icon="😊" label="Emotion" value={emotion?.dominant_emotion ?? "—"} />
            <StatCard icon="👁" label="Eye Contact" value={analysis?.eye_contact ?? "—"} />
            <StatCard icon="🧠" label="Focus" value={monitor?.status ?? "—"} />
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
