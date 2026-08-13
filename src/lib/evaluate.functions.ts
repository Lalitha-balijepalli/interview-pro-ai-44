import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getAiKey } from "./ai-key.server";

const EvalInput = z.object({
  question: z.string().min(1),
  answer: z.string().default(""),
  role: z.string().default("Software Engineer"),
  difficulty: z.string().default("Medium"),
});

const FinalInput = z.object({
  role: z.string().default("Software Engineer"),
  difficulty: z.string().default("Medium"),
  items: z
    .array(
      z.object({
        question: z.string(),
        answer: z.string().default(""),
        score: z.number().min(0).max(100).default(0),
        feedback: z.string().default(""),
      }),
    )
    .min(1),
});

async function callGemini(system: string, user: string): Promise<string> {
  const apiKey = getAiKey();
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("Rate limit reached. Try again shortly.");
    if (res.status === 402) throw new Error("AI credits exhausted.");
    throw new Error(`AI failed (${res.status}): ${text.slice(0, 200)}`);
  }
  const json = await res.json();
  return json?.choices?.[0]?.message?.content ?? "";
}

function extractJson<T>(raw: string): T {
  const tryParse = (s: string) => {
    try {
      return JSON.parse(s) as T;
    } catch {
      return null;
    }
  };
  const direct = tryParse(raw.trim());
  if (direct) return direct;
  const m = raw.match(/\{[\s\S]*\}/);
  if (m) {
    const v = tryParse(m[0]);
    if (v) return v;
  }
  throw new Error("AI returned an unexpected response.");
}

export const evaluateAnswer = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => EvalInput.parse(i))
  .handler(async ({ data }) => {
    const system =
      "You are a senior technical interviewer. Grade a candidate's spoken answer. " +
      "Return ONLY valid JSON with keys: score (0-100 integer), feedback (string), " +
      "strengths (string[]), weaknesses (string[]), suggestions (string[]), idealAnswer (string). " +
      "Be concise but specific. If the answer is empty or unrelated, score honestly (0-30).";
    const user = JSON.stringify({
      role: data.role,
      difficulty: data.difficulty,
      question: data.question,
      candidateAnswer: data.answer,
    });
    const raw = await callGemini(system, user);
    const parsed = extractJson<{
      score: number;
      feedback: string;
      strengths: string[];
      weaknesses: string[];
      suggestions: string[];
      idealAnswer: string;
    }>(raw);
    return {
      score: Math.max(0, Math.min(100, Math.round(parsed.score ?? 0))),
      feedback: String(parsed.feedback ?? ""),
      strengths: (parsed.strengths ?? []).map(String),
      weaknesses: (parsed.weaknesses ?? []).map(String),
      suggestions: (parsed.suggestions ?? []).map(String),
      idealAnswer: String(parsed.idealAnswer ?? ""),
    };
  });

export const generateFinalReport = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => FinalInput.parse(i))
  .handler(async ({ data }) => {
    const system =
      "You are an expert interview coach. Given per-question scores and feedback, " +
      "produce a final report as JSON with keys: overallScore (0-100 integer), " +
      "summary (string), strengths (string[]), weaknesses (string[]), " +
      "recommendations (string[]), breakdown (array of {label, value 0-100} covering " +
      "Technical Knowledge, Communication, Confidence, Problem Solving, Depth, Clarity). " +
      "Base scores strictly on the provided evaluations.";
    const user = JSON.stringify({
      role: data.role,
      difficulty: data.difficulty,
      evaluations: data.items,
    });
    const raw = await callGemini(system, user);
    const parsed = extractJson<{
      overallScore: number;
      summary: string;
      strengths: string[];
      weaknesses: string[];
      recommendations: string[];
      breakdown: { label: string; value: number }[];
    }>(raw);
    return {
      overallScore: Math.max(0, Math.min(100, Math.round(parsed.overallScore ?? 0))),
      summary: String(parsed.summary ?? ""),
      strengths: (parsed.strengths ?? []).map(String),
      weaknesses: (parsed.weaknesses ?? []).map(String),
      recommendations: (parsed.recommendations ?? []).map(String),
      breakdown: (parsed.breakdown ?? []).map((b) => ({
        label: String(b.label),
        value: Math.max(0, Math.min(100, Math.round(b.value ?? 0))),
      })),
    };
  });
