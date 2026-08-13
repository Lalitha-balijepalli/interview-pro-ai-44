import process from "node:process";

/**
 * Reads the Lovable AI Gateway key at request time.
 * Works on Lovable hosting automatically; on external hosts (Netlify, Vercel…)
 * set LOVABLE_API_KEY in the site's environment variables.
 */
export function getAiKey(): string {
  const key = process.env.LOVABLE_API_KEY ?? process.env.VITE_LOVABLE_API_KEY;
  if (!key) {
    throw new Error(
      "AI service is not configured. If you deployed outside Lovable, add a LOVABLE_API_KEY environment variable to your hosting provider and redeploy.",
    );
  }
  return key;
}
