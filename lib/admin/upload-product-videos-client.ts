import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const MAX_BYTES = 120 * 1024 * 1024; // 120MB per file

function isAllowedVideoFile(file: File): boolean {
  const name = file.name.toLowerCase();
  if (name.endsWith(".mp4") || name.endsWith(".webm") || name.endsWith(".mov")) return true;
  const t = (file.type || "").toLowerCase();
  return t === "video/mp4" || t === "video/webm" || t === "video/quicktime";
}

export async function uploadProductVideoFilesToStorage(
  files: File[]
): Promise<{ ok: true; urls: string[] } | { ok: false; message: string }> {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) {
    return { ok: false, message: "Supabase is not configured. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY." };
  }

  const urls: string[] = [];

  for (const file of files) {
    if (file.size <= 0) continue;
    if (file.size > MAX_BYTES) {
      return { ok: false, message: `Video "${file.name}" is too large (max 120MB per file).` };
    }
    if (!isAllowedVideoFile(file)) {
      return {
        ok: false,
        message: `Unsupported video type for "${file.name}". Use MP4, WebM, or MOV.`
      };
    }

    const safeName = file.name.replace(/\s+/g, "-");
    const path = `admin/${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${safeName}`;
    const contentType = file.type || "video/mp4";

    const { error: uploadError } = await supabase.storage.from("product-videos").upload(path, file, {
      upsert: true,
      contentType
    });

    if (uploadError) {
      return { ok: false, message: `Upload failed for "${file.name}": ${uploadError.message}` };
    }

    const { data: publicUrlData } = supabase.storage.from("product-videos").getPublicUrl(path);
    if (!publicUrlData.publicUrl) {
      return { ok: false, message: `Upload succeeded but public URL was missing for "${file.name}".` };
    }
    urls.push(publicUrlData.publicUrl);
  }

  return { ok: true, urls };
}
