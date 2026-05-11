window.SUPABASE_URL = "https://vlebjyeghgtqucbsqooj.supabase.co";
window.SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsZWJqeWVnaGd0cXVjYnNxb29qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNTc2NTEsImV4cCI6MjA5MjkzMzY1MX0.kVdxkF3J0j8Uy48_uI8eEvd8xwWI9hjL1Ttq0hGdsC0";

if (!window.supabase) {
  throw new Error("Supabase JS was not loaded before supabaseClient.js");
}

window.supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
