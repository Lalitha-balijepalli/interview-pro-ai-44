// Backend-free interview helpers: transcription runs on Lovable AI, no external server.

import { transcribe } from "@/lib/speech.functions";

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < buf.length; i += chunk) {
    bin += String.fromCharCode(...buf.subarray(i, i + chunk));
  }
  return btoa(bin);
}

export async function transcribeAudio(wav: Blob): Promise<string> {
  const audioBase64 = await blobToBase64(wav);
  const res = await transcribe({ data: { audioBase64 } });
  return res.text;
}

// Kept for API compatibility with the session page; no external backend needed.
export async function startInterview(_payload: Record<string, unknown> = {}) {
  return null;
}
