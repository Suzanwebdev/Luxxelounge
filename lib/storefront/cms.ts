import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getPublishedCmsPage<T extends Record<string, unknown>>(pageKey: string, fallback: T): Promise<T> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return fallback;

  const { data } = await supabase
    .from("cms_pages")
    .select("content")
    .eq("page_key", pageKey)
    .eq("status", "published")
    .maybeSingle();

  const content = data?.content;
  if (!content || typeof content !== "object" || Array.isArray(content)) return fallback;
  return content as T;
}
