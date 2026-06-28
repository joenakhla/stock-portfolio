import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  // Verify the caller is the admin — check their JWT against profiles.is_admin
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authError } = await getSupabaseAdmin().auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await getSupabaseAdmin()
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Fetch all auth users
  const { data: authUsers, error: listError } = await getSupabaseAdmin().auth.admin.listUsers({ perPage: 1000 });
  if (listError) return NextResponse.json({ error: listError.message }, { status: 500 });

  // Fetch all profiles
  const { data: profiles } = await getSupabaseAdmin()
    .from("profiles")
    .select("id, display_name, phone_number, country_code, is_admin, created_at");

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const users = authUsers.users.map((u) => {
    const p = profileMap.get(u.id);
    return {
      id: u.id,
      email: u.email,
      displayName: p?.display_name ?? null,
      phoneNumber: p?.phone_number ?? null,
      countryCode: p?.country_code ?? null,
      isAdmin: p?.is_admin ?? false,
      registeredAt: u.created_at,
      lastSignIn: u.last_sign_in_at ?? null,
      emailConfirmed: !!u.email_confirmed_at,
    };
  });

  return NextResponse.json({ users });
}
