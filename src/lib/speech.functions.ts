import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  // base64-encoded WAV audio (no data: prefix)
  audioBase64: z.string().min(16),
});

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export const transcribe = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => Input.parse(i))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI service is not configured.");

    const bytes = b64ToBytes(data.audioBase64);
    if (bytes.byteLength < 2048) {
      throw new Error("The recording was too short or silent — please record again.");
    }

    const fd = new FormData();
    fd.append("model", "openai/gpt-4o-transcribe");
    fd.append("file", new Blob([bytes], { type: "audio/wav" }), "answer.wav");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: fd,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("Rate limit reached. Try again shortly.");
      if (res.status === 402) throw new Error("AI credits exhausted.");
      throw new Error(`Transcription failed (${res.status}): ${text.slice(0, 200)}`);
    }

    const json = (await res.json()) as { text?: string };
    return { text: json.text ?? "" };
  });
