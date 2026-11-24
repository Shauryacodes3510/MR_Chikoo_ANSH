import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (supabaseUrl && supabaseAnonKey) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  async function test() {
    try {
      console.log("Fetching modules...");
      const { data: mods, error: mErr } = await supabase
        .from('modules')
        .select('*');
      console.log("Modules details:");
      mods?.forEach(m => {
        console.log(`Module ID: ${m.id}`);
        console.log(`Title: ${m.title}`);
        console.log(`Description: ${m.description}`);
        console.log(`Metadata: ${JSON.stringify(m.metadata || null)}`);
        console.log(`Order: ${m.order}`);
        console.log("-------------------");
      });
    } catch (e) {
      console.error(e);
    }
  }
  
  test();
}
