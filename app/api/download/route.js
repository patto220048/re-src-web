import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/app/lib/supabase-server";
import { incrementDownloadCount } from "@/app/lib/api";

export async function POST(request) {
  try {
    const { resourceId } = await request.json();

    if (!resourceId) {
      return NextResponse.json(
        { error: "resourceId is required" },
        { status: 400 }
      );
    }

    // 1. Check if user is authenticated
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required. Please sign in to download." },
        { status: 401 }
      );
    }

    // 2. Check if the resource is premium
    const { data: resource } = await supabase
      .from("resources")
      .select("id, is_premium, download_url, name")
      .eq("id", resourceId)
      .single();

    if (!resource) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 }
      );
    }

    // 3. User must have premium/admin role for ALL resources
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, subscription_status")
      .eq("id", user.id)
      .single();

    const hasAccess =
      profile?.role === "admin" ||
      profile?.role === "premium" ||
      profile?.subscription_status === "active";

    if (!hasAccess) {
      return NextResponse.json(
        {
          error: "Premium subscription required to download resources.",
          requiresPremium: true,
        },
        { status: 403 }
      );
    }

    // 4. Increment download count
    await incrementDownloadCount(resourceId);

    // 5. Return download URL
    return NextResponse.json({
      success: true,
      downloadUrl: resource.download_url,
    });
  } catch (error) {
    console.error("Download API error:", error);
    return NextResponse.json(
      { error: "Failed to process download" },
      { status: 500 }
    );
  }
}
