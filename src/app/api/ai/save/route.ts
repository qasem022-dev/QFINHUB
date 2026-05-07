import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { AICalculatorResponse } from "@/types/ai";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required. Please sign in to save calculators." },
        { status: 401 },
      );
    }

    const { config } = await request.json();

    if (!config || !config.title) {
      return NextResponse.json(
        { error: "Invalid calculator configuration" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("saved_plans")
      .insert({
        user_id: session.user.id,
        title: config.title,
        config,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase Save Error:", error);
      return NextResponse.json(
        { error: "Failed to save calculator. Database error." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      plan: data,
    });
  } catch (error) {
    console.error("Save Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
