// Client for the user's FastAPI backend.

const DEFAULT_BASE = "https://backend-d0vy.onrender.com";

function base(): string {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
  const url = env?.VITE_INTERVIEW_API_URL || DEFAULT_BASE;
  return url.replace(/\/+$/, "");
}

export async function pingBackend(timeoutMs = 90000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${base()}/`, { method: "GET" });
      if (res.ok) return true;
    } catch {
      /* server likely cold-starting */
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  return false;
}

export async function transcribeAudio(wav: Blob): Promise<string> {
  const attempt = async () => {
    const fd = new FormData();
    fd.append("file", wav, "answer.wav");
    return fetch(`${base()}/speech/transcribe`, { method: "POST", body: fd });
  };

  let res: Response;
  try {
    res = await attempt();
  } catch {
    // Cold start / transient network: wake the server, then retry once.
    const awake = await pingBackend();
    if (!awake) {
      throw new Error(
        "Couldn't reach the transcription server — it may still be starting up. Wait a moment and retry.",
      );
    }
    res = await attempt();
  }

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
