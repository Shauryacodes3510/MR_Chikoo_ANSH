import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (supabaseUrl && supabaseAnonKey) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  async function test() {
    try {
      console.log("Fetching lessons for module m_979275...");
      const { data: less, error: lErr } = await supabase
        .from('lessons')
        .select('*')
        .eq('module_id', 'm_979275');
      console.log("Lessons error:", lErr);
      console.log("Lessons details:", JSON.stringify(less, null, 2));
    } catch (e) {
      console.error(e);
    }
  }
  
  test();
}
