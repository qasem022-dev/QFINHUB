/**
 * Gemini API client for QFINHUB.
 * Uses gemini-3.1-flash-lite for content generation.
 *
 * NOTE: This is INACTIVE until the API key is funded.
 * Set GEMINI_API_KEY in .env.local to enable.
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

/** Check if Gemini is funded and ready to use */
export function isGeminiReady(): boolean {
  return GEMINI_API_KEY.length > 0 && GEMINI_API_KEY !== "YOUR_GEMINI_API_KEY_HERE";
}

/**
 * Generate text content using Gemini Flash Lite.
 * Used for: tweet variations, image prompts, blog snippets.
 */
export async function generateWithGemini(
  prompt: string,
  options?: { temperature?: number; maxTokens?: number }
): Promise<string | null> {
  if (!isGeminiReady()) {
    console.warn("[Gemini] Not funded yet. Skipping.");
    return null;
  }

  try {
    const resp = await fetch(
      `${BASE_URL}/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: options?.temperature ?? 0.8,
            maxOutputTokens: options?.maxTokens ?? 1000,
          },
        }),
      }
    );

    if (!resp.ok) {
      console.error("[Gemini] API error:", resp.status);
      return null;
    }

    const data = await resp.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
    return text;
  } catch (err: any) {
    console.error("[Gemini] Request failed:", err?.message || err);
    return null;
  }
}

/**
 * Generate an image prompt optimized for creating finance infographics.
 * Uses Gemini to craft the perfect prompt, then returns it.
 * (Actual image generation would need Imagen — for now we use SVG generation)
 */
export async function generateImagePrompt(
  topic: string,
  data?: Record<string, any>
): Promise<string | null> {
  if (!isGeminiReady()) return null;

  const prompt = `Create a detailed image generation prompt for a financial infographic about "${topic}".
The infographic should be clean, professional, blue-themed, include data points, and be suitable for Twitter/X.
Brand: QFINHUB (qfinhub.com).
${data ? "Include these data points: " + JSON.stringify(data) : ""}
Output just the prompt, no explanation.`;

  return generateWithGemini(prompt, { temperature: 0.7, maxTokens: 300 });
}
