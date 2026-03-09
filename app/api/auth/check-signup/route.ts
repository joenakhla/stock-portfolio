import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const MAX_USERS = 2;

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    // If not configured, allow signup (fail-open for development)
    return NextResponse.json({ allowed: true, currentCount: 0, maxUsers: MAX_USERS });
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      console.error("Check signup error:", error);
      return NextResponse.json(
        { allowed: false, error: "Could not verify user count" },
        { status: 500 }
      );
    }

    const userCount = data.users.length;

    return NextResponse.json({
      allowed: userCount < MAX_USERS,
      currentCount: userCount,
      maxUsers: MAX_USERS,
    });
  } catch (err) {
    console.error("Check signup error:", err);
    return NextResponse.json(
      { allowed: false, error: "Server error" },
      { status: 500 }
    );
  }
}
