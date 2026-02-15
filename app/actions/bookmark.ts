"use server";

import { createClient } from "@/lib/supabase/server";

export async function addBookmark(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error("Not authenticated");

  const url = formData.get("url") as string;
  const title = formData.get("title") as string;

  const { data,error } = await supabase
    .from("bookmarks")
    .insert([{ url, title, user_id: user.id }])
    .select()
    .single();

  if (error) throw new Error("Failed to add bookmark");
  return data;
}


export async function deleteBookmark(bookmarkId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("id", bookmarkId)
    .eq("user_id", user.id);

  if (error) throw new Error("Failed to delete bookmark");
}