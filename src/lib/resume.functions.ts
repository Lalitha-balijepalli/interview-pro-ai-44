import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getAiKey } from "./ai-key.server";

const confidenceSchema = z.object({
  score: z.number().min(0).max(1),
  reason: z.string().optional().default(""),
});

const parsedResumeSchema = z.object({
  name: z.string(),
  title: z.string(),
  skills: z.array(z.string()),
  projects: z.array(z.object({ name: z.string(), desc: z.string() })),
  experience: z.array(
    z.object({ role: z.string(), company: z.string(), period: z.string() }),
  ),
  education: z.array(
    z.object({ degree: z.string(), school: z.string(), period: z.string() }),
  ),
  certifications: z.array(z.string()),
  confidence: z.object({
    name: confidenceSchema,
    title: confidenceSchema,
    skills: confidenceSchema,
    projects: confidenceSchema,
    experience: confidenceSchema,
    education: confidenceSchema,
    certifications: confidenceSchema,
    overall: confidenceSchema,
  }),
});

export type ParsedResume = z.infer<typeof parsedResumeSchema>;
export type SectionConfidence = z.infer<typeof confidenceSchema>;

const inputSchema = z.object({
  fileName: z.string(),
  base64: z.string().min(10),
});

export const parseResume = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<ParsedResume> => {
    const apiKey = getAiKey();

    const binary = atob(data.base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(bytes);
    const { text } = await extractText(pdf, { mergePages: true });
    const resumeText = (Array.isArray(text) ? text.join("\n") : text)
      .slice(0, 20000)
      .trim();

    if (!resumeText) throw new Error("Could not extract any text from the PDF");

    const confidenceProp = {
      type: "object",
      properties: {
        score: { type: "number", description: "0.0 (unsure) to 1.0 (certain)" },
        reason: {
          type: "string",
          description: "Short reason for the score, e.g. 'inferred from email signature' or 'no dedicated section found'.",
        },
      },
      required: ["score", "reason"],
    } as const;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content:
                "You extract structured resume data. Always call the extract_resume tool with concise, deduplicated values. If a field is unknown, use a sensible empty value (empty string or empty array). For EVERY section also return a calibrated confidence score from 0 to 1 reflecting how certain you are the extracted values are accurate and complete. Use <0.5 when guessing or inferring, 0.5-0.8 when partially supported by the text, and >0.8 only when the section is explicit and unambiguous. Provide a short reason explaining the score (e.g. 'no dedicated education section', 'dates ambiguous', 'clearly listed in Skills section').",
            },
            {
              role: "user",
              content: `Extract structured data from this resume:\n\n${resumeText}`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "extract_resume",
                description: "Return structured resume data with per-section confidence",
                parameters: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    title: { type: "string" },
                    skills: { type: "array", items: { type: "string" } },
                    projects: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          desc: { type: "string" },
                        },
                        required: ["name", "desc"],
                      },
                    },
                    experience: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          role: { type: "string" },
                          company: { type: "string" },
                          period: { type: "string" },
                        },
                        required: ["role", "company", "period"],
                      },
                    },
                    education: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          degree: { type: "string" },
                          school: { type: "string" },
                          period: { type: "string" },
                        },
                        required: ["degree", "school", "period"],
                      },
                    },
                    certifications: {
                      type: "array",
                      items: { type: "string" },
                    },
                    confidence: {
                      type: "object",
                      properties: {
                        name: confidenceProp,
                        title: confidenceProp,
                        skills: confidenceProp,
                        projects: confidenceProp,
                        experience: confidenceProp,
                        education: confidenceProp,
                        certifications: confidenceProp,
                        overall: confidenceProp,
                      },
                      required: [
                        "name",
                        "title",
                        "skills",
                        "projects",
                        "experience",
                        "education",
                        "certifications",
                        "overall",
                      ],
                    },
                  },
                  required: [
                    "name",
                    "title",
                    "skills",
                    "projects",
                    "experience",
                    "education",
                    "certifications",
                    "confidence",
                  ],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "extract_resume" },
          },
        }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      if (response.status === 429)
        throw new Error("Rate limit reached. Please try again in a moment.");
      if (response.status === 402)
        throw new Error(
          "AI credits exhausted. Add credits in Workspace Settings.",
        );
      throw new Error(`AI gateway error (${response.status}): ${body}`);
    }

    const json = (await response.json()) as {
      choices?: Array<{
        message?: {
          tool_calls?: Array<{
            function?: { name?: string; arguments?: string };
          }>;
        };
      }>;
    };

    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("AI returned no structured output");

    const parsed = parsedResumeSchema.parse(JSON.parse(args));
    return parsed;
  });
