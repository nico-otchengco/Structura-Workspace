import { supabase } from "../lib/supabase";

export async function getUserOrganization(userId: string) {
  const { data, error } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Failed to fetch organization:", error.message);
    return null;
  }

  return data;
}