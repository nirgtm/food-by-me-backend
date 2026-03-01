const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

let supabase;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("❌ CRITICAL: Supabase credentials not configured!");
  console.error(`   SUPABASE_URL: ${supabaseUrl ? 'SET' : 'MISSING'}`);
  console.error(`   SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceRoleKey ? 'SET' : 'MISSING'}`);
  
  // Throw error instead of returning mock - this will make issues obvious
  throw new Error("Supabase credentials are required. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.");
}

try {
  // Validate URL format
  if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
    throw new Error(`Invalid SUPABASE_URL format: ${supabaseUrl}. Must start with http:// or https://`);
  }

  // Use service role key for admin operations (database access)
  supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { 
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  
  console.log("✅ Supabase client initialized successfully");
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Using service role key for database operations`);
} catch (error) {
  console.error("❌ Failed to initialize Supabase:", error.message);
  throw error;
}

module.exports = supabase;
