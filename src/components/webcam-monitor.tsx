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
  onAnalytics?: (data: {
    emotion: EmotionResp | null;
    analysis: AnalysisResp | null;
    monitor: MonitorResp | null;
  }) => void;
}

export function WebcamMonitor({ active, onStream, onAnalytics }: Props) {
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
      if (em || an || mo) onAnalytics?.({ emotion: em, analysis: an, monitor: mo });
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
  }, [active, onStream, retryKey]);

  if (!active) {
    return (
      <Card className="p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <VideoOff className="h-4 w-4 text-muted-foreground" />
          <span>Webcam monitoring is off</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          No problem — your interview still runs normally.
          <span className="inline-flex items-center gap-1 ml-1">
            <Mic className="h-3 w-3" /> Voice recording, transcription and AI scoring keep working.
          </span>
        </p>
        <p className="text-xs text-muted-foreground">
          Turn the toggle above back on any time to enable live emotion, eye-contact and focus analytics.
        </p>
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
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white p-4 text-center text-xs">
              <div className="flex flex-col items-center gap-2">
                <VideoOff className="h-6 w-6" />
                <span>Camera unavailable</span>
              </div>
            </div>
          )}
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </Card>

      {status === "error" && (
        <Alert variant="destructive">
          <Camera className="h-4 w-4" />
          <AlertDescription className="text-xs space-y-2">
            <p className="font-medium">
              {isPermissionDenied
                ? "Camera permission is blocked"
                : "Couldn't start the camera"}
            </p>
            {isPermissionDenied ? (
              isMobile ? (
                <ol className="list-decimal list-inside space-y-1 opacity-90">
                  <li className="flex items-start gap-1">
                    <Smartphone className="h-3 w-3 mt-0.5 shrink-0" />
                    <span>Tap the <b>lock/︙ menu</b> in your browser's address bar.</span>
                  </li>
                  <li>Open <b>Site settings</b> → <b>Permissions</b> → <b>Camera</b>.</li>
                  <li>Set Camera to <b>Allow</b>, then reload this page.</li>
                  <li>iOS Safari: also check <b>Settings → Safari → Camera</b>.</li>
                </ol>
              ) : (
                <ol className="list-decimal list-inside space-y-1 opacity-90">
                  <li>Click the <b>camera / lock icon</b> in your browser's address bar.</li>
                  <li>Set <b>Camera</b> to <b>Allow</b> for this site.</li>
                  <li>Reload the page, then toggle Webcam monitoring on.</li>
                </ol>
              )
            ) : (
              <p className="opacity-90">{errorMsg ?? "Please check your camera and try again."}</p>
            )}
            <p className="opacity-80">
              You can keep the interview going without the camera — audio recording and scoring still work.
            </p>
            <Button
              size="sm"
              variant="secondary"
              className="mt-1 h-7 gap-1"
              onClick={() => setRetryKey((k) => k + 1)}
            >
              <RefreshCw className="h-3 w-3" /> Try again
            </Button>
          </AlertDescription>
        </Alert>
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
