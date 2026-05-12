import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { AICalculatorResponse } from "@/types/ai";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication using getUser() (server-verified, not from cookie)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required. Please sign in to save calculators." },
        { status: 401 },
      );
    }

    const { id, config } = await request.json();

    if (!config || !config.title) {
      return NextResponse.json(
        { error: "Invalid calculator configuration" },
        { status: 400 },
      );
    }

    let data;
    let error;

    if (id) {
      // ── UPDATE EXISTING PLAN ─────────────────────────────────
      // Only allow updating plans that belong to the current user
      const result = await supabase
        .from("saved_plans")
        .update({
          title: config.title,
          config,
        })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      data = result.data;
      error = result.error;

      if (!error && !data) {
        // Plan not found or doesn't belong to user
        return NextResponse.json(
          { error: "Plan not found or access denied" },
          { status: 404 },
        );
      }
    } else {
      // ── INSERT NEW PLAN ──────────────────────────────────────
      const result = await supabase
        .from("saved_plans")
        .insert({
          user_id: user.id,
          title: config.title,
          config,
        })
        .select()
        .single();

      data = result.data;
      error = result.error;
    }

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
      updated: !!id,
    });
  } catch (error) {
    console.error("Save Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
