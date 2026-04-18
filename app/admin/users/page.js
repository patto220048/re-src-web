import { supabaseAdmin } from "@/app/lib/supabase-admin";
import { getServerUser } from "@/app/lib/supabase-server";
import UsersClient from "./UsersClient";
import { redirect } from "next/navigation";

export const metadata = { title: "Admin — Users" };

export default async function AdminUsersPage() {
  const { user } = await getServerUser();
  if (!user) redirect("/admin/login");

  // Fetch all profiles (admin client bypasses RLS)
  const { data: profiles, error } = await supabaseAdmin
    .from("profiles")
    .select("id, email, full_name, role, subscription_status, subscription_expires_at, created_at")
    .order("created_at", { ascending: false });

  if (error) console.error("Error fetching profiles:", error);

  return <UsersClient users={profiles || []} />;
}
