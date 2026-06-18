import { generateInterviewQuestions as generateFn } from "./gemini.functions";

export type ExperienceLevel = "Fresher" | "1-3 Years" | "3-5 Years" | "5+ Years";
export type InterviewType = "Technical" | "HR" | "Behavioral" | "Mixed";

export interface GenerateQuestionsParams {
  role: string;
  experience: ExperienceLevel;
  type: InterviewType;
  number: number;
}

/**
 * Generate AI-powered interview questions via Lovable AI Gateway (Google Gemini).
 * Returns an array of question strings.
 */
export async function generateInterviewQuestions(
  params: GenerateQuestionsParams,
): Promise<string[]> {
  const result = await generateFn({ data: params });
  return result.questions;
}
