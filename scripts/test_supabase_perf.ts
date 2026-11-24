import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !serviceKey) {
  console.log("No supabase configured, using fallback");
  process.exit(0);
}

const client = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function testSupabase() {
  const dummyBuffer = Buffer.alloc(500000); // 500KB fake WAV
  console.log("Testing Supabase Storage upload...");
  const t0 = performance.now();
  const { error: upErr } = await client.storage
    .from("story_audio")
    .upload("benchmark_test/test_audio.wav", dummyBuffer, {
      contentType: "audio/wav",
      upsert: true,
    });
  const t1 = performance.now();
  console.log(`Storage upload took: ${(t1 - t0).toFixed(0)}ms, error:`, upErr?.message || "none");

  console.log("Testing DB upsert...");
  const t2 = performance.now();
  const { error: dbErr } = await client
    .from("lesson_screen_audio")
    .upsert({
      lesson_id: "benchmark_test",
      screen_id: "test_screen",
      language: "en",
      narration_text: "test text",
      text_hash: "123",
      audio_url: "https://example.com/audio.wav",
      status: "ready",
      voice_id: "Puck",
      tts_model: "gemini-3.1-flash-tts-preview",
      duration_ms: 5000,
      updated_at: new Date().toISOString()
    }, { onConflict: "lesson_id,screen_id,language" });
  const t3 = performance.now();
  console.log(`DB upsert took: ${(t3 - t2).toFixed(0)}ms, error:`, dbErr?.message || "none");
}

testSupabase();
