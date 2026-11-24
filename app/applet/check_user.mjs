import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(url, key);

async function run() {
  const emailQuery = 'anshvasvani764@gmail.com';
  console.log(`Querying profile for email: ${emailQuery}`);

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('email', emailQuery);

  if (error) {
    console.error("Error querying profiles:", error);
  } else {
    console.log("Found profiles result:", JSON.stringify(data, null, 2));
  }
}

run().catch(console.error);
