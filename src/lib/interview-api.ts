// Client for the user's FastAPI backend.

const DEFAULT_BASE =
  "https://glorious-waffle-r4r5w4rw6xj7f5557-8000.app.github.dev";

function base(): string {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
  const url = env?.VITE_INTERVIEW_API_URL || DEFAULT_BASE;
  return url.replace(/\/+$/, "");
}

export async function transcribeAudio(wav: Blob): Promise<string> {
  const fd = new FormData();
  fd.append("file", wav, "answer.wav");
  const res = await fetch(`${base()}/speech/transcribe`, { method: "POST", body: fd });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Transcription failed (${res.status}): ${t.slice(0, 200)}`);
  }
  const data = (await res.json()) as { transcription?: string; text?: string };
  return data.transcription ?? data.text ?? "";
}

export async function startInterview(payload: Record<string, unknown> = {}) {
  try {
    const res = await fetch(`${base()}/interview/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return (await res.json()) as unknown;
  } catch {
    return null;
  }
}
