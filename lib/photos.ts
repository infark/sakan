import { supabase } from "./supabase";

export function urlPhoto(chemin: string) {
  return supabase.storage.from("logements-photos").getPublicUrl(chemin).data
    .publicUrl;
}