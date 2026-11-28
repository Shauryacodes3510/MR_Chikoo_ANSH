# AI Copilot v1 – Notes & Wave 0 Audit

> Context file for any human or AI agent working on the Copilot. Read this first.
> Owner: Ansh. Repo: `Shauryacodes3510/MR_Chikoo_ANSH`. Env: Windows + PowerShell.
> Source docs: `AI Copilot v1 – Master Audit File (MR Chikoo).pdf` (repo root) + planning chat decisions (28 Nov 2026).
> **Where this file and the PDF disagree, THIS FILE WINS** (the PDF has a few outdated/incorrect points, listed in section 1).

---

## 1. Corrections to the PDF

| Topic | PDF said | Truth / decision |
|---|---|---|
| Branch | use `feat/ai-copilot-v1`, never `deployment` | **Build on `Deployment`.** `main` = safe live version (never experiment there). `Deployment` = experiment branch. Merge to `main` only after the verification checklist passes. |
| Generate-audio route | `POST /api/screen-audio/generate` | Real route: `POST /api/admin/generate-screen-narration` (alias `/api/admin/generate-screen-voice`), `server.app.ts:~3494`. |
| Locked fields | xpValue, difficulty, media URLs, audio locked | `xpValue`, `difficulty`, `imageUrl`, `mediaUrl` are **editable by AI** (see 4). Audio stays protected in v1. |
| Modes | Ask + Action | **Ask + Action + Audit** (Audit is new, see 3). |
| Step 2 status | "in progress" | **Done** on `Deployment` (extracted into `src/features/admin/curriculum/`). |

## 2. Goal
AI Copilot inside Curriculum Studio that can read, audit and edit lesson screens (later add lessons/screens) without breaking student content. **Nothing is applied without an admin click.** Students are live (500+ users) and `lessons` is the live table, so every Apply must have a diff preview and Undo.

## 3. Modes (enforced server-side, not in the prompt)
- **Ask** – read-only chat about selected screen / lesson / unit. Text only.
- **Action** – AI proposes structured edits → code validates → diff (old vs new) → Apply / Reject / Apply all → Undo.
- **Audit** (new) – admin picks lesson/unit, "check all answers". AI scans read-only, returns findings (screen, what is wrong, why, suggested fix). Each finding has a **Fix** button that becomes a normal Action. Main use case: wrong MCQ answers, wrong fill-in-the-blanks.
- **Review screen button** in the Copilot panel: reuse the existing full-screen preview (`src/components/admin/ChallengePreviewWrapper.tsx`, student component `components/exercises/VisualLessonScreen.tsx`) to show how a screen looks with the proposed edit applied, before Apply. Do not build a second renderer.
- **AI context**: read-only Supabase context layer (worlds/modules/lessons/screens/sync status) so the AI knows what is going on. **Writes never go as raw SQL from the LLM** – only validated actions → `saveCurriculumToStorage()`.

## 4. Field rules
**Editable (v1):** question, options[] text, explanation, heading, subheading, contentBody, badge, quote, bottomMessage, mascotMessage, pairs[].left/right, `xpValue`, `difficulty`, `imageUrl`, `mediaUrl`.
- **Media rule:** the LLM must NEVER type a media URL itself (hallucination risk). URLs come only from an upload tool (admin uploads → backend stores → real URL → Copilot proposes it).
- **Sensitive-field warning:** xpValue / difficulty / media edits get a highlighted row in the diff.

**Locked (v1):** `id`, `type`, `quoteAuthor`, True/False option labels, `audioNarrations` url/hash/voiceId/ttsModel, all `*_audio_url`, `explanation_example`, `explanation_confused`.

## 5. Code rules (still valid from PDF)
1. AI returns ONE logical field; **code writes mirrors**. AI never sees mirror field names.
2. Mirror only if the mirror's current value equals the OLD logical value.
3. MCQ: AI returns `correctOptionIndex`; code sets `correctAnswer = options[index]` (correctAnswer is option TEXT, not index). Reject out of range. Option count must stay equal.
4. Preserve explanation shape (string OR `{text, audioUrl, audioDuration}`).
5. Spoken-text change → set `status: "stale"` on every existing audio entry (all aliases en/english, mr/marathi, hinglish/hi). Never touch url/hash.
6. English only in v1.
7. No delete actions in v1.
8. Scope check: every lessonId/screenId must be inside selected scope.
9. Unsupported types rejected by validator.
10. Saves via `saveCurriculumToStorage()`; Undo = in-memory snapshot + normal save. Fresh DB backup before go-live.

**Decision (stale audio):** student app is NOT changed in v1. "Stale" is an admin-side flag only. After Apply show a banner "Audio outdated on N screens" + manual Regenerate button. Reason: hiding audio from students is worse than a short text/audio mismatch. No auto-regeneration (TTS costs money).

## 6. Architecture: handler per screen type
Each type = one handler: schema (editable fields), locked list, mirror logic, validator. Framework built once in Wave 1; adding a type = one handler file + one test.

**Type rollout:** 1) c1_multiple_choice (239) + c9_true_false (49) → 2) content_screen (429) → 3) c4_concept_matcher (52) → 4) c2_fill_in_blank (56, needs a real JSON example) → 5) the rest.
Production screen counts (~900): content_screen 429, c1 239, c2 56, c4 52, c9 49, c16 19, visual_lesson_screen 16, c7 14, c3 9, c5/c6 8 each, c10 3, c15 1.

## 7. Data model (from DB audit)
World (uuid) → Module/Unit (text id, `world_id`) → Lesson (text id, `module_id`) → Screen (object inside `lessons.challenges`, id like `scr_<timestamp>_<rand>`).
- `modules` has two order columns: `order` and `sort_order`.
- `lesson_screen_audio` = server-persisted narration records (text_hash, audio_url, status, voice_id…).
- Student tables `user_lesson_progress`, `user_world_progress` must never be touched.
- Backups that exist: `backup_lessons_20261127`, `backup_modules_20261127`, `backup_worlds_20261127`, `modules_backup_20261126`.
- Real shapes: `explanation` is sometimes string, sometimes object. Same explanation text duplicated in `explanation.text`, `explanation_concept`, `explanation_takeaway`, `explanation_speech_script`. `content_screen` always has nested `contentScreen`; `visualLessonScreen` is an exact duplicate; `explanation.text == contentBody`. Languages: English, Marathi, Hinglish (fields `explanation_marathi*`).

## 8. Wave 0 audit results (answers verified in code, 28 Nov 2026, branch `Deployment`)

| # | Question | Answer |
|---|---|---|
| 1 | Does the student overlay show narration text? | **Yes**, word-by-word highlight. Text priority in `ChikooExplanationOverlay.tsx` (~607-700): `challenge.explanation` (string or `.english.text`/`.text`) → `challenge.audioNarrations.<lang>.text` → server `dbRecord.text`. So editing `explanation` changes what students read immediately; `audioNarrations.text` is only a fallback. |
| 2 | Does server data (`dbNarrations`) override challenge JSON? | **No.** Challenge JSON wins; `GET /api/screen-audio` (`server.app.ts:~3266`, reads `lesson_screen_audio`) is only fetched when url/text is missing (overlay ~907-940) and only fills gaps. |
| 3 | Does the student app check `status`/`hash`? | **Partly.** `src/hooks/useScreenAudio.ts`: cache path (~252) and API path (~310) require `status==='ready'` or empty. BUT the challenge-JSON path (~269-282) sets `hasAudio: true` whenever `url` exists and ignores status. The overlay ignores status entirely. **Consequence: marking `stale` does NOT stop students hearing old audio** (accepted, see decision in 5). No hash check anywhere. |
| 4 | How is `hash` computed? | Simple 32-bit string hash `computeHash` (`server.app.ts:~3532`, base36). Not cryptographic; low collision risk. Ready-check: `status==='ready' && url && (hash===textHash || !hash)`. |
| 5 | Where is generate route / admin auth / env keys? | `POST /api/admin/generate-screen-narration` (`server.app.ts:~3494`). Admin check: `isAdmin(req)` (`server.app.ts:236`, Supabase auth). Env: `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (fallbacks `SUPABASE_SERVICE_KEY`, `VITE_SUPABASE_ANON_KEY`). Copilot routes should follow this pattern. |
| 6 | `order` or `sort_order`? | Student app reads `sort_order ?? order` (`ChikooHomescreen.tsx:969`, `lib/content.ts:96,147`); one spot in `content.ts:30` sorts by `order` only. Keep writing both. |
| 7 | c2_fill_in_blank JSON example | NOT in repo. Needs DB query: `select e from lessons, jsonb_array_elements(challenges) e where e->>'type'='c2_fill_in_blank' limit 2;` |
| 8 | RLS / foreign keys | Repo migrations (`supabase/migrations/20260927_add_worlds_table.sql`): worlds/modules/lessons readable by authenticated users; "Admins can manage" ALL for `profiles.is_admin = TRUE`. **Live DB is source of truth: still run `select * from pg_policies` and check FKs.** |
| 9 | Is Step 2 merged? | **Yes** on `Deployment` (`src/features/admin/curriculum/*`). |

**Other findings**
- LLM stack: only `@google/genai` (Gemini) is wired. Decision: build Copilot on Gemini first, keep the provider behind one adapter so Claude can be swapped in later.
- No test runner existed → `vitest` added in Wave 1 (`npm test`).
- `BulkNarrationQueue.tsx:61-63` decides "missing" only by `!narrations.<lang>?.url` (no status/hash). Needs patch: missing = `!url || status === 'stale'` (do together with stale marking in Wave 1/2, not yet done).
- Student-facing audio shapes: `audioNarrations` keys have aliases en/english, mr/marathi, hinglish/hi; entries: url, hash, text, status, voiceId, ttsModel, updatedAt, errorMessage, durationMs. `ScreenVoiceSection.tsx`, `ExplanationAudioManager.tsx`, `ChikooExplanationOverlay.tsx` all read these aliases; Copilot must stay compatible.
- Known risk: two admins editing the same module/lesson → last write wins.
- `saveCurriculumToStorage` call-site count on Deployment (`grep -rn`, lines incl. import/definition): 34. Keep this count unchanged by Copilot-unrelated refactors.
- Baseline: `npx tsc --noEmit` = 0 errors; `npx vite build` passes.

## 9. Save pipeline recap (Step 1, already in repo)
All saves go through `saveCurriculumToStorage(newAi, newPrac)` in `src/lib/content.ts`: hash-based diff (only changed modules/lessons upserted, modules first), uninitialised/error guard (localStorage only + error), sync status store (`getCurriculumSyncStatus`, `subscribeCurriculumSyncStatus`, `retryFailedCurriculumSync`, `removeSyncedHash`), explicit deletes only.

## 10. Build waves & status
- **Wave 0 – Investigate** ✅ DONE (patches 0001/0002): section 8 answered; normalizer extracted to `src/lib/curriculumNormalize.ts` (`mapUserFriendlyScreenType`, `mapScreenDataForImport`, verbatim move from `AdminPanel.tsx`, no behaviour change). Note: the "normalizer" in the code is the import-time one (AdminPanel ~1785); there is no other copy.
- **Wave 1 – Pure logic + tests** ✅ DONE (code in `src/lib/copilot/`, shared by client and `server.app.ts`; run `npm test`):
  - `types.ts` (action contract, scope, diff, handler interface), `shared.ts` (locked-field rules, explanation shape + mirror sync, stale marking), `validate.ts` (`parseActionPayload` for LLM JSON, `checkScope`), `applyActions.ts` (`validateActions` dry run / `applyActions`; pure, structural sharing, `atomic` option), `handlers/mcq.ts` (c1_multiple_choice + c9_true_false, action `updateMcq`), `handlers/index.ts` (registry: add a screen type = add a handler).
  - 60 unit tests (vitest) incl. mutation-checked: option/index → `correctAnswer`, index range, option count, duplicates, locked/unknown fields, explanation shape + mirrors only when equal to old text, stale on all aliases without touching url/hash, scope (screen/lesson/unit), unsupported type/unknown action, immutability, atomic apply, payload parsing.
  - Behaviour notes: spoken fields (flag audio stale) = question, options, explanation, mascotMessage. xpValue 0–1000 integer; difficulty keeps its current type. Changing the correct answer, xpValue or difficulty is flagged `sensitive` in the diff. Options changed without index keep the same index and return a warning if the correct text changed. `imageUrl`/`mediaUrl` are not in the c1/c9 schema (these types have no media fields); unlock them in the handlers of types that do.
  - NOT done yet (later waves): `content_screen` / c4 handlers, `BulkNarrationQueue` stale patch (`!url || status==='stale'`), server routes, UI, saving (Wave 3 passes `nextModules` to `saveCurriculumToStorage`; Undo = keep the old modules reference). Practice vs space lists: pass one combined list or run per list and split back by module id.
- **Wave 2 – Server:** ✅ DONE (code in `src/lib/copilot/server/`, routes registered in `server.app.ts` via `registerCopilotRoutes(app, { isAdmin })`; 13 new tests, 73 total): `POST /api/copilot/ask` (text only), `/action` (LLM JSON → `parseActionPayload` → `validateActions` dry run → diffs; ONE retry on invalid JSON; saves nothing), `/audit` (read-only, batches of 12 screens, max 120 screens, each Fix is a pre-validated action; hallucinated ids dropped). Client sends the SCOPED modules (`{scope, modules, instruction|question, history}`); server strips audio urls/hashes/mirrors before the LLM sees them (`context.ts`). Gemini sits behind `LlmAdapter` (`llm.ts`, model `gemini-3.5-flash`, override with env `COPILOT_MODEL`). Admin check = `isAdmin`; key = `GEMINI_API_KEY`. Errors: 400 bad input, 403 not admin, 413 too large, 502 AI failed. Context cap 120k chars. No rate limiting yet.
- **Wave 3 – UI:** `CopilotPanel` (mode toggle, scope selector, chat, diff preview, Apply/Reject/Apply all, Undo, Review screen button, audio-outdated banner). Mobile-first, follow ui-ux-pro-max rules (4.5:1 contrast, 44px targets, SVG icons, 150–300ms animation, visible focus).
- **Then:** one new screen type at a time.

**Rules for every step:** explain before implementing · one commit per step · deliver code as `.patch` files · run `npx tsc --noEmit` and `npx vite build` (errors never above baseline of 0) · stop and report if a finding contradicts this file.

## 11. Verification checklist (dummy lesson, dev/staging)
Ask mode saves nothing · Action on content_screen updates contentScreen, visualLessonScreen and explanation.text, survives refresh, sync sends only that lesson · MCQ option+index change keeps correctAnswer = new option text · audio entries marked stale, Bulk queue lists them, Regenerate works · Undo restores previous version · out-of-scope ids and unsupported types rejected · Audit finds a planted wrong answer and Fix produces a valid diff · Review screen shows proposed version before Apply · tsc and vite build pass.

## 12. Risks
Old audio playing with new text (accepted, admin banner) · mirror fields drifting if mirror logic is wrong · two admins editing at once · LLM changing a question's meaning so the answer becomes wrong (diff + Audit reasons are the guard) · editable xpValue/difficulty can unbalance the game (sensitive-field warning + Undo) · hallucinated media URLs (upload-tool rule).

## 13. Future (v2+)
addScreen, addLesson, updateLesson; remaining screen types; Marathi/Hinglish editing; bulk edits ("change tone of whole unit"); image/video upload → URL pipeline; audio generation hooks; reorder + JSON tools from Step 2 Phase 2.

## 14. Current status & handoff (updated 29 Nov 2026) – READ THIS FIRST

> This section is newer than section 10. Where section 10 (build waves & status) disagrees with this section, **this section wins**.
> A fresh AI session should read: this section → sections 1–5 (rules) → section 6 (handlers) → then start with "14.4 Next steps".

### 14.1 What is DONE (all on branch `Deployment`)

| Wave | What | Where |
|---|---|---|
| 0 | Investigation, audit answers (section 8), normalizer extracted | `src/lib/curriculumNormalize.ts` |
| 1 | Pure engine: validation, scope check, locked fields, mirror sync, stale marking, diff. Handler for `c1_multiple_choice` + `c9_true_false` (action `updateMcq`) | `src/lib/copilot/` (`types.ts`, `shared.ts`, `validate.ts`, `applyActions.ts`, `handlers/mcq.ts`, `handlers/index.ts`) |
| 2 | Server: `POST /api/copilot/ask`, `/action`, `/audit` (admin only via `isAdmin`, Gemini behind `LlmAdapter`). **Nothing is saved server-side.** | `src/lib/copilot/server/` (`routes.ts`, `service.ts`, `context.ts`, `prompts.ts`, `llm.ts`); registered in `server.app.ts` via `registerCopilotRoutes(app, { isAdmin })` |
| 2b | Manual test script (no UI needed): `npx tsx scripts/copilot-try.ts <ask\|action\|audit> <lessonId> "text"` (needs `$env:ADMIN_EMAIL`, `$env:ADMIN_PASSWORD`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) | `scripts/copilot-try.ts` |
| 3 step 1 | **AI Copilot tab** in the admin sidebar ("Curriculum & Content" section, between "AI Co-Creator" and "Chikoo Worlds") and in the mobile "Create" sub-bar. **Ask mode only** (simple chat, read-only). Unit → Lesson → Screen scope selector. Chat survives tab switches (module-level store). | `src/features/admin/curriculum/copilot/` (`CopilotPanel.tsx`, `api.ts`, `chatStore.ts`, `index.ts`); wired in `src/components/AdminPanel.tsx` (`activeTab === 'ai-copilot'`) |
| 3 steps 2–6 | **Mode switch Ask / Action / Audit.** Action: AI proposes → fresh client-side dry run → diff (old vs new, sensitive rows highlighted) → Apply / Reject / Apply all → saved via `saveCurriculumToStorage` → Undo (lesson-wise, refuses if the lesson was edited again). Audit: "Check all answers" → findings → **Fix** turns a finding into a normal Action. **Review screen**: student-style preview of the proposed edit (with a Current tab) before Apply. **Audio-outdated banner** (counts screens with a `stale` narration entry; button opens the audio queue tab). | `src/features/admin/curriculum/copilot/` (`CopilotPanel.tsx` shell, `AskView.tsx`, `ActionView.tsx`, `AuditView.tsx`, `DiffCard.tsx`, `ReviewModal.tsx`, `workStore.ts`, `api.ts`); pure logic `src/lib/copilot/applyToLists.ts` (`validateOnLists`, `applyOnLists`, `undoChanges`) and `lookup.ts` (`locateScreen`, `countStaleAudioScreens`); save wired in `AdminPanel.tsx` (`onCommit`) |
| 3 fix | `BulkNarrationQueue.tsx`: missing = `!url \|\| status === 'stale'` | `src/components/admin/BulkNarrationQueue.tsx` |
| 3 fix | Ask now sees the REAL fields of non-MCQ screens (options, correctAnswer, pairs, items…), with audio/hash/voice keys and mirror blobs stripped. | `context.ts` (`sanitize`, `toAiScreenView`) |

Quality gates at this point: `npx tsc --noEmit` = 0 errors, `npx vite build` passes, `npm test` = **88 tests pass**.

### 14.2 How things work right now (facts a new session must know)

- **Request shape (all 3 routes):** `{ scope, modules, ... }` where `scope` = `{kind:'screen',lessonId,screenId}` | `{kind:'lesson',lessonId}` | `{kind:'unit',unitId}`. The CLIENT sends only the scoped modules (server body limit is 1 MB; `api.ts` pre-filters with `resolveScope`). Ask adds `question` + `history`; Action adds `instruction` + `history`; Audit adds nothing.
- **Auth from browser:** `supabase.auth.getSession()` → `Authorization: Bearer <access_token>` (see `api.ts`). Server checks `isAdmin(req)`.
- **Ask:** returns `{ success, answer }` (text only; never actions).
- **Action:** returns `{ success, actions, results, message?, errors, retried }`. `results[i]` is an `ActionResult` (`status: 'ok'|'rejected'`, `errors`, `warnings`, `diff[]` with `{field,before,after,sensitive}`, `mirrorsWritten`, `staleAudioAliases`). The server already did a dry run (`validateActions`). One retry on invalid JSON.
- **Audit:** returns `{ success, findings, scanned, skippedUnsupported, batchErrors }`. Each finding: `{lessonId, screenId, severity, problem, why, fixAction?, fixResult?, fixError?}`. `fixAction` is a ready, already-validated `CopilotAction` → it becomes a normal Action when the admin clicks **Fix**. Limits: batches of 12 screens, max 120 screens per audit.
- **Applying (built):** `ActionView` re-validates on the CURRENT full lists (`validateOnLists`), applies with `applyOnLists(fullSpace, fullPrac, actions, scope)` (routes each action to the list that holds its lesson; `atomic` is all-or-nothing across both lists), then calls `onCommit(nextSpace, nextPrac)` = `setModulesList` + `setPracticeModulesList` + `saveCurriculumToStorage` + `setRawJsonText` in `AdminPanel.tsx`. Undo history lives in `workStore.ts` (max 20 records, cleared on refresh); `undoChanges` restores only the lessons an Apply touched and only if they still equal the version the Apply produced.
- **Where the data lives in the UI:** `AdminPanel.tsx` holds `modulesList`, `practiceModulesList` (+ setters), `selectedModuleId`, `selectedLessonId`, `isModuleInSelectedWorld`. `CopilotPanel` receives world-filtered copies as props (`modulesList`, `practiceModulesList`, `selectedModuleId`, `selectedLessonId`). The panel also gets the FULL lists (`fullModulesList`, `fullPracticeList`) and `onCommit` / `onOpenAudioQueue` callbacks (do NOT import AdminPanel state into the panel).
- **Review screen:** reuses `ChallengePreview` from `src/components/admin/ChallengePreviewWrapper.tsx` (no second renderer). That preview does NOT draw the question for `c1_multiple_choice` / `c9_true_false`, so `ReviewModal` shows the question above it. When you add a screen type, check what the preview draws and add a small header for anything it leaves out.
- **Editable screen types today:** only `c1_multiple_choice`, `c9_true_false`. Other types are readable in Ask, but Action/Audit reject or skip them (`isEditableType` in `context.ts`, `HANDLERS` in `handlers/index.ts`).
- **Decision taken by the assistant, owner should confirm:** `xpValue` must be an integer 0–1000 (`LIMITS.xpMax` in `handlers/mcq.ts`). Change it if the game uses another range.
- **Model:** `gemini-3.5-flash`, override with env `COPILOT_MODEL`. Key: `GEMINI_API_KEY` (server only, never `VITE_`).

### 14.3 Gotchas (learned the hard way)

1. **Restart the backend after every pull/patch.** `npm run dev` = `tsx server.ts` does NOT hot-reload server code (only the Vite frontend reloads). Symptom of a stale server: `[API 404] Unmatched API route: POST /api/copilot/...`. Fix: `Get-Process node | Stop-Process -Force` then `npm run dev`.
2. `npm start` runs the prebuilt `dist-server/server.js`, which is tracked in git and is NOT updated by patches. Use `npm run dev`, or `npm run build` first.
3. Env is Windows + PowerShell. Deliver code as `.patch` files (`git am`). Don't include `dist-server/server.js` in patches.
4. The LLM must see clean data: never send audio urls/hashes/voice ids or the mirror blobs (`explanation_*`, `contentScreen`, `visualLessonScreen`). Handled in `context.ts`.
5. No rate limiting on `/api/copilot/*` yet (admin-only, but Gemini costs money). Consider adding before wide use.
6. Two admins editing the same lesson → last write wins (known risk, section 12).

### 14.4 Next steps

Wave 3 UI is BUILT (ask/action/audit/undo/review/banner) but was verified only by `tsc`, `vite build`, 88 unit tests and server-side render smoke tests. **It has not been clicked through in a real browser against the real DB yet.**

1. **Browser verification on a dummy lesson (dev/staging)** with the checklist in section 11 / 14.6. Fix whatever it shows (layout heights `h-[calc(100dvh-14rem)]`, mobile nav overlap, etc.).
2. **Audio regeneration is NOT usable yet** (see 14.8 finding 1): `BulkNarrationQueue` calls a route that does not exist, and regenerating stale audio must pass the NEW text as `approvedTexts`, because the server otherwise reuses the old `audioNarrations.<lang>.text`. After a regenerate the client must write the returned `audioNarrations` back into its lists (otherwise the next client save overwrites the DB with the old audio). Build this as its own step, with the owner's OK (it costs TTS money).
3. **Then add the remaining screen types** (14.5), one per step.

Rules for every step (unchanged): explain before implementing · one commit per step · run `npx tsc --noEmit`, `npx vite build`, `npm test` (never above baseline: 0 tsc errors, 88 tests) · stop and report if a finding contradicts this file · UI follows the ui-ux-pro-max rules (mobile-first, 4.5:1 contrast, 44px targets, SVG icons, 150–300 ms animation, visible focus).

### 14.5 After Wave 3: add the remaining screen types (one at a time)

Order and counts are in section 6. Order: **`content_screen` (429)** → `c4_concept_matcher` (52) → `c2_fill_in_blank` (56, needs a real JSON example first: `select e from lessons, jsonb_array_elements(challenges) e where e->>'type'='c2_fill_in_blank' limit 2;`) → the rest.

**Recipe to add a screen type (framework is done):**
1. Get 2–3 real JSON examples of the type from the DB (do not guess the shape).
2. Write `src/lib/copilot/handlers/<name>.ts` implementing `ScreenHandler` (`actionName`, `types`, `plan(screen, fields)`): schema of editable fields, locked list, mirror logic (write a mirror only if it equals the OLD logical value), validation (lengths, counts, ranges), diff entries (`sensitive` where needed), `spokenTextChanged` for audio stale marking. Never mutate input.
3. Register it in `handlers/index.ts` (`HANDLERS`).
4. Write tests in `src/lib/copilot/__tests__/` (valid edit, locked fields, mirrors, stale audio, immutability, bad input) and **mutation-check** them (break the code on purpose, tests must fail, then restore).
5. Update the prompts in `server/prompts.ts` (allowed action name + fields for the new type) and `context.ts` if the AI view needs a special shape (`toAiScreenView`).
6. Unlock `imageUrl` / `mediaUrl` only on types that really have them. The LLM never types a URL itself (upload-tool rule, section 4).
7. Update this section and the counts.

**`content_screen` specifics:** the same text lives in `contentScreen.*`, `visualLessonScreen.*` (exact duplicate), and `explanation.text == contentBody` (+ `explanation_concept/takeaway/speech_script`). The AI returns ONE logical field; code writes all mirrors. Editable fields: heading, subheading, contentBody, badge, quote, bottomMessage, mascotMessage (+ `imageUrl`/`mediaUrl` via upload tool only). `quoteAuthor` stays locked.

### 14.6 Go-live checklist (from section 11) – still open

Fresh DB backup (existing: `backup_lessons_20261127`, `backup_modules_20261127`, `backup_worlds_20261127`, `modules_backup_20261126`) · run `select * from pg_policies` and check foreign keys on the live DB · full dummy-lesson test on dev/staging (Ask saves nothing; Apply/Undo work; audio becomes stale; Audit finds a planted wrong answer; Review shows the proposed version) · merge `Deployment` → `main` ONLY after all of this passes.

### 14.7 v2+ (unchanged, section 13)

addScreen / addLesson / updateLesson, Marathi & Hinglish editing, bulk edits ("change tone of whole unit"), image/video upload → URL pipeline, audio generation hooks, reorder + JSON tools from Step 2 Phase 2.

### 14.8 Findings from Wave 3 (29 Nov 2026) – these contradict or extend earlier sections

1. **`BulkNarrationQueue` is partly broken (pre-existing).** `handleGenerateSingle` posts to `/api/screen-audio/generate`, which does NOT exist in `server.app.ts` (the real route is `POST /api/admin/generate-screen-narration`, section 1). It also never writes the generated audio back into the curriculum lists. Wave 3 only fixed what the notes asked (`!url || status==='stale'` so stale screens are LISTED). Regenerate through that queue will fail until fixed. The per-screen flow in `ScreenVoiceSection.tsx` uses the real route and `approvedTexts`.
2. **Stale audio keeps the OLD text.** The engine flags `status:"stale"` but never touches `audioNarrations.<lang>.text` / url / hash (rule 5). The generate route falls back to that old text when `approvedTexts` is missing, so a naive regenerate would recreate the OLD audio. Always pass the new approved text.
3. **The shared admin preview does not draw the question for c1/c9** (only options / True-False buttons). `ReviewModal` shows the question separately.
4. **Server code is not hot-reloaded.** After pulling patches: stop all `node` processes and run `npm run dev` again; `npm start` runs the stale `dist-server/server.js`.
5. `dist-server/server.js` is tracked in git but changes on every build; keep it out of patches.
