import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  // data URL of a JPEG webcam frame
  imageDataUrl: z.string().startsWith("data:image/"),
});

export type FrameAnalysis = {
  dominant_emotion: string;
  attention_score: number;
  eye_contact: string;
  overall_score: number;
  status: string;
};

const clamp = (n: unknown, d: number) => {
  const v = typeof n === "number" && Number.isFinite(n) ? n : d;
  return Math.max(0, Math.min(100, Math.round(v)));
};

export const analyzeFrame = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => Input.parse(i))
  .handler(async ({ data }): Promise<FrameAnalysis> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI service is not configured.");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-lite",
        messages: [
          {
            role: "system",
            content:
              "You analyze a single webcam frame of a job-interview candidate. Reply ONLY with JSON: " +
              '{"dominant_emotion": one of happy|neutral|sad|angry|surprise|fear|disgust, ' +
              '"attention_score": 0-100 integer, "eye_contact": "Good"|"Fair"|"Poor", ' +
              '"overall_score": 0-100 integer, "status": "Focused"|"Distracted"|"Away"}. ' +
              'If no face is visible use status "Away", low scores, emotion "neutral".',
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this frame." },
              { type: "image_url", image_url: { url: data.imageDataUrl } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Frame analysis failed (${res.status}): ${text.slice(0, 160)}`);
    }

    const json = await res.json();
    const raw: string = json?.choices?.[0]?.message?.content ?? "";
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          parsed = JSON.parse(m[0]);
        } catch {
          parsed = {};
        }
      }
    }

    return {
      dominant_emotion: String(parsed.dominant_emotion ?? "neutral"),
      attention_score: clamp(parsed.attention_score, 70),
      eye_contact: String(parsed.eye_contact ?? "Fair"),
      overall_score: clamp(parsed.overall_score, 70),
      status: String(parsed.status ?? "Focused"),
    };
  });
