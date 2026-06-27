import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://ykhyvvqfxvqusihvkzzq.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_QZaLAcAQHuHN-8sF-G9FrA_7_xJ-7O9";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
