import { NextRequest, NextResponse } from "next/server";
import { generateCalculator } from "@/lib/ai/generate";
import type { ChatMessage } from "@/types/ai";

export async function POST(request: NextRequest) {
  try {
    const { query, context } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required and must be a string" },
        { status: 400 },
      );
    }

    const calculator = await generateCalculator(query, context as ChatMessage[] | undefined);

    return NextResponse.json({
      calculator,
      content: `I've created a **${calculator.title}** for you. Check the results panel to interact with it.`,
    });
  } catch (error) {
    console.error("AI Generate Error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 },
    );
  }
}
