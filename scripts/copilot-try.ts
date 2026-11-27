/**
 * Copilot Wave 2 – quick manual tester (no UI needed).
 *
 * Usage (PowerShell, `npm run dev` must be running in another terminal):
 *   $env:ADMIN_EMAIL="you@mail.com"; $env:ADMIN_PASSWORD="yourpass"
 *   npx tsx scripts/copilot-try.ts ask    <lessonId> "Is lesson ke answers check karo"
 *   npx tsx scripts/copilot-try.ts action <lessonId> "Pehle question ko simple banao"
 *   npx tsx scripts/copilot-try.ts audit  <lessonId>
 *
 * It logs in as admin, reads the lesson from Supabase, and calls /api/copilot/*.
 * Nothing is saved to the database. Needs .env: VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY.
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const [mode, lessonId, ...rest] = process.argv.slice(2);
const text = rest.join(' ');
const base = process.env.COPILOT_BASE_URL || 'http://localhost:3000';
const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const anon = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const die = (m: string): never => { console.error('\n' + m + '\n'); process.exit(1); };
if (!['ask', 'action', 'audit'].includes(mode) || !lessonId) die('Usage: npx tsx scripts/copilot-try.ts <ask|action|audit> <lessonId> "<text>"');
if (!url || !anon) die('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY .env mein nahi mile.');
if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) die('Pehle set karo: $env:ADMIN_EMAIL="..."; $env:ADMIN_PASSWORD="..."');
if (mode !== 'audit' && !text) die(`"${mode}" ke saath sawal/instruction bhi likho.`);

const sb = createClient(url!, anon!);
const { data: auth, error: authErr } = await sb.auth.signInWithPassword({
  email: process.env.ADMIN_EMAIL!, password: process.env.ADMIN_PASSWORD!,
});
if (authErr || !auth.session) die('Login fail: ' + (authErr?.message || 'no session'));
const token = auth.session!.access_token;

const { data: lesson, error: lErr } = await sb.from('lessons').select('*').eq('id', lessonId).maybeSingle();
if (lErr || !lesson) die('Lesson nahi mila: ' + (lErr?.message || lessonId));
const modules = [{ id: lesson.module_id, lessons: [{ ...lesson, challenges: lesson.challenges || [] }] }];
const scope = { kind: 'lesson', lessonId };
console.log(`Lesson "${lesson.title ?? lessonId}": ${(lesson.challenges || []).length} screens\n`);

const body =
  mode === 'ask' ? { scope, modules, question: text }
  : mode === 'action' ? { scope, modules, instruction: text }
  : { scope, modules };

const res = await fetch(`${base}/api/copilot/${mode}`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
  body: JSON.stringify(body),
});
const out: any = await res.json().catch(() => ({}));
console.log('HTTP', res.status, '\n');
if (!out.success) die('Error: ' + (out.error || JSON.stringify(out)));

if (mode === 'ask') console.log(out.answer);
if (mode === 'action') {
  if (out.message) console.log('AI note:', out.message, '\n');
  for (const r of out.results) {
    console.log(`#${r.index} ${r.status.toUpperCase()}  ${r.action.lessonId} / ${r.action.screenId}`);
    r.errors.forEach((e: string) => console.log('   ERROR:', e));
    r.warnings.forEach((w: string) => console.log('   WARN :', w));
    r.diff.forEach((d: any) => console.log(`   ${d.sensitive ? '[!] ' : ''}${d.field}: ${JSON.stringify(d.before)}  ->  ${JSON.stringify(d.after)}`));
  }
  if (!out.results.length) console.log('Koi change propose nahi hua.', out.errors?.join(' ') || '');
}
if (mode === 'audit') {
  console.log(`Scanned ${out.scanned} screens, ${out.skippedUnsupported} skipped (unsupported type), ${out.findings.length} findings\n`);
  for (const f of out.findings) {
    console.log(`[${f.severity}] ${f.screenId}: ${f.problem}\n   why: ${f.why}`);
    if (f.fixResult) f.fixResult.diff.forEach((d: any) => console.log(`   fix: ${d.field}: ${JSON.stringify(d.before)} -> ${JSON.stringify(d.after)}`));
    if (f.fixError) console.log('   ', f.fixError);
  }
  out.batchErrors.forEach((e: string) => console.log('BATCH ERROR:', e));
}
console.log('\n(Preview only - database mein kuch save nahi hua.)');
