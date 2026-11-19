import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://krlbmbkrzexgplwbbnwi.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtybGJtYmtyemV4Z3Bsd2JibndpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUxMDE4NTQsImV4cCI6MjExMDY3Nzg1NH0.UZDvZxbUW7yi3kNFmujlFqC67rJdgOpaPiRrV9IIYDk";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});