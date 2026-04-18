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
    const page = parseInt(searchParams.get("page") || "0");
    const limit = parseInt(searchParams.get("limit") || "25");
    const search = searchParams.get("q") || "";
    const filter = searchParams.get("filter") || "all";

    const offset = page * limit;

    let query = supabaseAdmin
      .from("subscriptions")
      .select(`
        id,
        paypal_subscription_id,
        plan_id,
        status,
        current_period_start,
        current_period_end,
        created_at,
        user_id,
        profiles ( email, full_name )
      `, { count: "exact" });

    // DEBUG: Log search/filter
    console.log(`[Admin Subscriptions] Page: ${page}, Search: "${search}", Filter: "${filter}"`);

    // Handle Search via 2-step process to avoid Logic Tree errors
    if (search) {
      console.log(`[Admin Subscriptions] Performing 2-step search for: ${search}`);
      // 1. Find users matching search
      const { data: matchedProfiles } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);

      const userIds = matchedProfiles?.map(p => p.id) || [];
      console.log(`[Admin Subscriptions] Found ${userIds.length} matching profiles`);

      // 2. Build or conditions for subscriptions
      let orConditions = `paypal_subscription_id.ilike.%${search}%`;
      if (userIds.length > 0) {
        // Use user_id.in instead of nested or to avoid logic tree parsing
        orConditions += `,user_id.in.(${userIds.join(",")})`;
      }
      
      query = query.or(orConditions);
    }

    if (filter !== "all") {
        // Use ilike to handle cases like "Active" vs "active"
        query = query.ilike("status", filter);
    }

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("[Admin Subscriptions API] DB Error:", error);
      throw error;
    }

    return NextResponse.json({
      data: data || [],
      count: count || 0,
      hasMore: (offset + (data?.length || 0)) < (count || 0)
    });

  } catch (err) {
    console.error("[Admin Subscriptions API] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
