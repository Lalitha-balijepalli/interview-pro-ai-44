import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  role: z.string().min(1),
  experience: z.enum(["Fresher", "1-3 Years", "3-5 Years", "5+ Years"]),
  type: z.enum(["Technical", "HR", "Behavioral", "Mixed"]),
  number: z.number().int().min(1).max(30),
});

export const generateInterviewQuestions = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI service is not configured.");

    const prompt = `Generate ${data.number} high-quality interview questions for a ${data.experience} candidate applying for a ${data.role} position. Interview type is ${data.type}. Return only a JSON array of questions (an array of strings), no markdown, no commentary.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an expert technical interviewer. Respond ONLY with a valid JSON array of question strings." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("Rate limit reached. Please try again in a moment.");
      if (res.status === 402) throw new Error("AI credits exhausted. Please add credits to continue.");
      throw new Error(`Question generation failed (${res.status}): ${text.slice(0, 200)}`);
    }

    const json = await res.json();
    const content: string = json?.choices?.[0]?.message?.content ?? "";

    // Extract a JSON array from the model output
    let questions: string[] = [];
    const tryParse = (s: string) => {
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) return parsed.map((x) => String(x)).filter(Boolean);
      } catch {}
      return null;
    };

    const direct = tryParse(content.trim());
    if (direct) {
      questions = direct;
    } else {
      const match = content.match(/\[[\s\S]*\]/);
      if (match) {
        const arr = tryParse(match[0]);
        if (arr) questions = arr;
      }
    }

    if (!questions.length) {
      throw new Error("AI returned an unexpected response. Please retry.");
    }

    return { questions: questions.slice(0, data.number) };
  });
