import { NextResponse } from "next/server";
import { getSearchSuggestions } from "@/app/lib/api";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";

    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const results = await getSearchSuggestions(q);

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Suggestions API failed:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
