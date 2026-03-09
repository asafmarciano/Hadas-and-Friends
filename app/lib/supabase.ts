import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ApprovedUser {
  id: string;
  display_name: string;
  avatar: string | null;
  pin_code: string;
  is_active: boolean;
  created_at?: string;
}
