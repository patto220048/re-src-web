import { NextResponse } from "next/server";
import { 
  getAdminCategoriesWithCounts, 
  getAdminFolders, 
  getAdminTags 
} from "@/app/lib/api";
import { getServerUser } from "@/app/lib/supabase-server";
import { supabaseAdmin } from "@/app/lib/supabase-admin";

export const dynamic = 'force-dynamic';

/**
 * Global Admin Metadata Fetcher (Uncached)
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

    // Fetch all fresh meta in parallel
    const [folders, categories, tags] = await Promise.all([
      getAdminFolders(),
      getAdminCategoriesWithCounts(),
      getAdminTags()
    ]);

    // Additional Stats for Dashboard & Users
    const [
      { count: totalResources },
      { count: totalUsers },
      { count: totalPremium },
      { count: totalAdmins },
      { data: recentResources },
      { data: downloadData },
      { count: subsActive },
      { count: subsCancelled },
      { count: subsExpired }
    ] = await Promise.all([
      supabaseAdmin.from("resources").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }).eq("role", "premium"),
      supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }).eq("role", "admin"),
      supabaseAdmin.from("resources").select("id, name, file_format, download_count, created_at, categories(name)").order("created_at", { ascending: false }).limit(5),
      supabaseAdmin.from("resources").select("download_count"),
      supabaseAdmin.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "ACTIVE"),
      supabaseAdmin.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "CANCELLED"),
      supabaseAdmin.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "EXPIRED")
    ]);

    const totalDownloads = downloadData?.reduce((sum, r) => sum + (r.download_count || 0), 0) || 0;

    const stats = {
      totalResources: totalResources || 0,
      totalFolders: folders.length || 0,
      totalDownloads,
      totalUsers: totalUsers || 0,
      totalPremium: totalPremium || 0,
      totalAdmins: totalAdmins || 0,
      subscriptionStats: {
        active: subsActive || 0,
        cancelled: subsCancelled || 0,
        expired: subsExpired || 0,
        total: (subsActive || 0) + (subsCancelled || 0) + (subsExpired || 0)
      },
      recentResources: (recentResources || []).map(r => ({
        id: r.id,
        name: r.name,
        category: r.categories?.name || "Uncategorized",
        fileFormat: r.file_format,
        downloadCount: r.download_count
      }))
    };

    return NextResponse.json({ folders, categories, tags, stats });
  } catch (err) {
    console.error("[Admin Metadata GET] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
