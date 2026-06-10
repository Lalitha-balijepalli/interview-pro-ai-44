import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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
});

export type ParsedResume = z.infer<typeof parsedResumeSchema>;

const inputSchema = z.object({
  fileName: z.string(),
  // base64-encoded PDF bytes (no data URL prefix)
  base64: z.string().min(10),
});

export const parseResume = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<ParsedResume> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    // Decode base64 -> Uint8Array
    const binary = atob(data.base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    // Extract text using unpdf (edge/Worker-safe)
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(bytes);
    const { text } = await extractText(pdf, { mergePages: true });
    const resumeText = (Array.isArray(text) ? text.join("\n") : text)
      .slice(0, 20000)
      .trim();

    if (!resumeText) throw new Error("Could not extract any text from the PDF");

    // Call Lovable AI Gateway with structured JSON output via tool calling
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
                "You extract structured resume data. Always call the extract_resume tool with concise, deduplicated values. If a field is unknown, use a sensible empty value (empty string or empty array). Periods like '2021 — 2023' or 'Jan 2022 — Present'.",
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
                description: "Return structured resume data",
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
                  },
                  required: [
                    "name",
                    "title",
                    "skills",
                    "projects",
                    "experience",
                    "education",
                    "certifications",
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
