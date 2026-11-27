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
- No test runner in `package.json` → add `vitest` in Wave 1.
- `BulkNarrationQueue.tsx:61-63` decides "missing" only by `!narrations.<lang>?.url` (no status/hash). Needs patch: missing = `!url || status === 'stale'` (do together with stale marking in Wave 1/2, not yet done).
- Student-facing audio shapes: `audioNarrations` keys have aliases en/english, mr/marathi, hinglish/hi; entries: url, hash, text, status, voiceId, ttsModel, updatedAt, errorMessage, durationMs. `ScreenVoiceSection.tsx`, `ExplanationAudioManager.tsx`, `ChikooExplanationOverlay.tsx` all read these aliases; Copilot must stay compatible.
- Known risk: two admins editing the same module/lesson → last write wins.
- `saveCurriculumToStorage` call-site count on Deployment (`grep -rn`, lines incl. import/definition): 34. Keep this count unchanged by Copilot-unrelated refactors.
- Baseline: `npx tsc --noEmit` = 0 errors; `npx vite build` passes.

## 9. Save pipeline recap (Step 1, already in repo)
All saves go through `saveCurriculumToStorage(newAi, newPrac)` in `src/lib/content.ts`: hash-based diff (only changed modules/lessons upserted, modules first), uninitialised/error guard (localStorage only + error), sync status store (`getCurriculumSyncStatus`, `subscribeCurriculumSyncStatus`, `retryFailedCurriculumSync`, `removeSyncedHash`), explicit deletes only.

## 10. Build waves & status
- **Wave 0 – Investigate** ✅ DONE: section 8 answered; normalizer extracted to `src/lib/curriculumNormalize.ts` (`mapUserFriendlyScreenType`, `mapScreenDataForImport`, verbatim move from `AdminPanel.tsx`, no behaviour change). Note: the "normalizer" in the code is the import-time one (AdminPanel ~1785); there is no other copy.
- **Wave 1 – Pure logic + tests** ⏳ NEXT: add vitest; `copilot/types.ts`, `validate.ts`, `applyActions.ts`, handler framework, c1 + c9 handlers, unit tests (no AI, no UI). Tests: option change keeps `correctAnswer`; out-of-range index rejected; locked field rejected; out-of-scope id rejected; explanation shape preserved; stale marking never touches url/hash; mirror sync only when mirror equals old value.
- **Wave 2 – Server:** `/api/copilot/ask`, `/api/copilot/action`, `/api/copilot/audit`; `isAdmin` auth; server-side validation; one retry on invalid JSON; API key on server; send only scoped JSON (strip audio urls/hashes).
- **Wave 3 – UI:** `CopilotPanel` (mode toggle, scope selector, chat, diff preview, Apply/Reject/Apply all, Undo, Review screen button, audio-outdated banner). Mobile-first, follow ui-ux-pro-max rules (4.5:1 contrast, 44px targets, SVG icons, 150–300ms animation, visible focus).
- **Then:** one new screen type at a time.

**Rules for every step:** explain before implementing · one commit per step · deliver code as `.patch` files · run `npx tsc --noEmit` and `npx vite build` (errors never above baseline of 0) · stop and report if a finding contradicts this file.

## 11. Verification checklist (dummy lesson, dev/staging)
Ask mode saves nothing · Action on content_screen updates contentScreen, visualLessonScreen and explanation.text, survives refresh, sync sends only that lesson · MCQ option+index change keeps correctAnswer = new option text · audio entries marked stale, Bulk queue lists them, Regenerate works · Undo restores previous version · out-of-scope ids and unsupported types rejected · Audit finds a planted wrong answer and Fix produces a valid diff · Review screen shows proposed version before Apply · tsc and vite build pass.

## 12. Risks
Old audio playing with new text (accepted, admin banner) · mirror fields drifting if mirror logic is wrong · two admins editing at once · LLM changing a question's meaning so the answer becomes wrong (diff + Audit reasons are the guard) · editable xpValue/difficulty can unbalance the game (sensitive-field warning + Undo) · hallucinated media URLs (upload-tool rule).

## 13. Future (v2+)
addScreen, addLesson, updateLesson; remaining screen types; Marathi/Hinglish editing; bulk edits ("change tone of whole unit"); image/video upload → URL pipeline; audio generation hooks; reorder + JSON tools from Step 2 Phase 2.
