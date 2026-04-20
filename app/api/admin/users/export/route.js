import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase-admin";
import { getServerUser } from "@/app/lib/supabase-server";

export async function GET(req) {
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

    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get("limit") || "100";
    const limit = limitParam === "all" ? 10000 : parseInt(limitParam);

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("email, full_name, role, subscription_status, created_at, last_active_at, email_verified_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Convert to CSV
    const headers = ["Email", "Full Name", "Role", "Subscription", "Joined", "Last Active", "Verified"];
    const rows = data.map(u => [
      u.email,
      u.full_name || "",
      u.role,
      u.subscription_status || "free",
      u.created_at,
      u.last_active_at || "",
      u.email_verified_at ? "Yes" : "No"
    ].map(val => `"${val.toString().replace(/"/g, '""')}"`).join(","));

    const csvContent = [headers.join(","), ...rows].join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="users_export_${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (err) {
    console.error("[Admin Users Export API] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
