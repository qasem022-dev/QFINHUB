import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    // Step 1: Verify the user is authenticated (using the regular server client)
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required. Please sign in." },
        { status: 401 },
      );
    }

    const userId = user.id;

    // Step 2: Verify the request body includes a confirmation flag
    const { confirmed } = await request.json();
    if (!confirmed) {
      return NextResponse.json(
        { error: "Account deletion requires confirmation." },
        { status: 400 },
      );
    }

    // Step 3: Create admin client (bypasses RLS using service_role key)
    const adminClient = createAdminClient();

    // Step 3a: Delete all saved plans for this user
    const { error: plansError } = await adminClient
      .from("saved_plans")
      .delete()
      .eq("user_id", userId);

    if (plansError) {
      console.error("Error deleting saved plans:", plansError);
      return NextResponse.json(
        { error: "Failed to delete user data." },
        { status: 500 },
      );
    }

    // Step 3b: Delete the user from Supabase Auth
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(
      userId,
    );

    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete account. Please try again later." },
        { status: 500 },
      );
    }

    // Step 4: Sign out the user's current session
    await supabase.auth.signOut();

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully.",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again later." },
      { status: 500 },
    );
  }
}
