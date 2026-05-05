import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase-admin";
import { getServerUser } from "@/app/lib/supabase-server";

export const dynamic = 'force-dynamic';

/**
 * Admin API to cleanup orphaned files in Storage
 */
export async function GET(req) {
  try {
    const { user: adminUser } = await getServerUser();
    if (!adminUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 1. Verify admin role
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", adminUser.id)
      .single();

    if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const dryRun = searchParams.get("dryRun") !== "false"; // Default to true for safety

    // 2. Fetch all storage_paths from DB
    const { data: dbResources, error: dbError } = await supabaseAdmin
      .from("resources")
      .select("storage_path");

    if (dbError) throw dbError;
    const dbPaths = new Set(dbResources.map(r => r.storage_path).filter(Boolean));

    // 3. List all files in Storage (recursive scan)
    const orphanedFiles = [];
    const totalFiles = { count: 0 };
    
    // Get categories to scan folders
    const { data: categories } = await supabaseAdmin.from("categories").select("slug");
    const foldersToScan = ["", ...(categories?.map(c => c.slug) || [])];

    for (const folder of foldersToScan) {
      const { data: files, error: storageError } = await supabaseAdmin.storage
        .from("resources")
        .list(folder, { limit: 1000 });

      if (storageError) continue;

      for (const file of files) {
        if (file.id === null) continue; // It's a folder (if using folders)
        
        const fullPath = folder ? `${folder}/${file.name}` : file.name;
        totalFiles.count++;

        if (!dbPaths.has(fullPath)) {
          orphanedFiles.push(fullPath);
        }
      }
    }

    // 4. Delete if not dry run
    let deletedCount = 0;
    if (!dryRun && orphanedFiles.length > 0) {
      const { data, error: deleteError } = await supabaseAdmin.storage
        .from("resources")
        .remove(orphanedFiles);
      
      if (deleteError) throw deleteError;
      deletedCount = data?.length || 0;
    }

    return NextResponse.json({
      success: true,
      dryRun,
      totalFilesScanned: totalFiles.count,
      orphanedCount: orphanedFiles.length,
      orphanedFiles: orphanedFiles,
      deletedCount: deletedCount
    });

  } catch (err) {
    console.error("[Storage Cleanup API] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
