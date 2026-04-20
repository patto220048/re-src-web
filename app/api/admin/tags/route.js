import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase-admin";
import { getServerUser } from "@/app/lib/supabase-server";
import { getAdminTags } from "@/app/lib/api";

export const dynamic = 'force-dynamic';

/**
 * Get all tags (uncached for Admin)
 */
export async function GET() {
  try {
    const { user: adminUser } = await getServerUser();
    if (!adminUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify admin role
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", adminUser.id)
      .single();

    if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const tags = await getAdminTags();
    return NextResponse.json(tags);
  } catch (err) {
    console.error("[Admin Tags GET] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
