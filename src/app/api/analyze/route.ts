import { NextRequest, NextResponse } from "next/server";

// In-memory rate limiter: IP -> { count, resetAt }
const rateMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }

  if (entry.count >= 20) return false;
  entry.count++;
  return true;
}

const SYSTEM_PROMPT = `You are WasThatAI — a witty, slightly savage AI text analyst. Analyze the provided text and determine if it reads as AI-generated or human-written.

Return ONLY valid JSON with this exact structure:
{
  "score": <number 0-100, where 100 = definitely AI>,
  "verdict": <"DEFINITELY AI" | "PROBABLY AI" | "SUSPICIOUS" | "FEELS HUMAN" | "DEFINITELY HUMAN">,
  "autopsy": [<string>, <string>, <string>],
  "tell": <exact quote from the text that is most suspicious or most human, max 100 chars>,
  "roast": <one savage one-liner summary, max 80 chars>
}

Be specific — reference actual words, phrases, or patterns from the text. Be funny and slightly savage. Do NOT be preachy about AI being bad.`;

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again in a minute." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text is required." },
        { status: 400 }
      );
    }

    const trimmed = text.trim();

    if (trimmed.length < 50) {
      return NextResponse.json(
        { error: "Text must be at least 50 characters." },
        { status: 400 }
      );
    }

    if (trimmed.length > 5000) {
      return NextResponse.json(
        { error: "Text must be 5000 characters or less." },
        { status: 400 }
      );
    }

    const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || "76a615004da286b1e7dc98b977038d4e7f4fc4df6667249f";
    const GATEWAY_URL = process.env.OPENCLAW_BASE_URL || "http://127.0.0.1:18789/v1";

    const res = await fetch(`${GATEWAY_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GATEWAY_TOKEN}`,
      },
      body: JSON.stringify({
        model: "openclaw:lead",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: trimmed },
        ],
        max_tokens: 800,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("LLM API error:", res.status, errText);
      return NextResponse.json(
        { error: "Analysis service unavailable. Try again later." },
        { status: 502 }
      );
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "Empty response from analysis service." },
        { status: 502 }
      );
    }

    // Extract JSON from the response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    try {
      const result = JSON.parse(jsonStr.trim());

      // Validate structure
      if (
        typeof result.score !== "number" ||
        !result.verdict ||
        !Array.isArray(result.autopsy) ||
        !result.tell ||
        !result.roast
      ) {
        throw new Error("Invalid response structure");
      }

      return NextResponse.json(result);
    } catch {
      console.error("Failed to parse LLM response:", content);
      return NextResponse.json(
        { error: "Failed to parse analysis. Please try again." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Analyze route error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
