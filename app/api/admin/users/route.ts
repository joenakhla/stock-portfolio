import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { SupabaseClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let admin: SupabaseClient;
  try {
    admin = getSupabaseAdmin();
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server misconfigured" }, { status: 500 });
  }

  const { data: { user }, error: authError } = await admin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: authUsers, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listError) return NextResponse.json({ error: listError.message }, { status: 500 });

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, display_name, phone_number, country_code, is_admin, created_at");

  const profileMap = new Map((profiles ?? []).map((p: { id: string }) => [p.id, p]));

  const users = authUsers.users.map((u) => {
    const p = profileMap.get(u.id) as { display_name?: string; phone_number?: string; country_code?: string; is_admin?: boolean } | undefined;
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
