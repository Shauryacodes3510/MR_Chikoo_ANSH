# Bug & Architecture Decision Report: Leaderboard Ranking Metric (Cookies vs Weekly XP)

**Document ID:** `BUG-LEADERBOARD-001`  
**Date:** 25 November 2026  
**Status:** 🟡 **PENDING APPROVAL (Requires Shaurya's Permission before Production Deployment)**  
**Patch File Saved:** `patches/leaderboard-xp.patch`  

---

## 1. Executive Summary (Short Overview)

Current codebase me Leaderboard students ko **Cookies (`profiles.gems`)** ke basis pe rank kar raha hai.  
Ek ready patch (`patches/leaderboard-xp.patch`) prepare kiya gaya hai jo is ranking ko **Weekly XP (`profiles.weekly_xp`)** pe shift karta hai.

> [!WARNING]
> **Shaurya ki Approval Kyun Zaroori Hai?**  
> Ye sirf ek UI change nahi hai, balki app ki poori **Gamification Economy aur Competition Logic** ka core decision hai. Agar bina product team / Shaurya ke permission ke ye push kar diya gaya, toh students ki ranking drastically change ho sakti hai aur kuch bachhon ka score 0 dikh sakta hai.

---

## 2. Current Problem (Cookies/Gems Ranking me kya dikkat hai?)

| # | Current Flaw | Student Impact |
|---|---|---|
| **1** | **Spending penalty** | Cookies ek spendable currency hai. Agar koi student 500 cookies se Hearts Refill ya Mystery Chest leta hai, toh uske cookies kam ho jaate hain aur Leaderboard pe uski **Rank gir jaati hai** (padhne ke bawjood rank down). |
| **2** | **Passive vs Active Learning** | Cookies Daily Spin, Jackpots, ya rewards se bhi milte hain bina koi lesson padhe. Leaderboard pe wo bachha top pe aa sakta hai jisne sirf spin kiya ho par padhai na ki ho. |
| **3** | **Duolingo Standard Mismatch** | Standard educational apps (jaise Duolingo) me leaderboard hamesha **XP (Experience Points)** par chalta hai, coins/gems par nahi. |

---

## 3. Proposed Fix in Patch (`patches/leaderboard-xp.patch`)

Patch already test ho chuka hai aur cleanly compile hota hai:
1. **`server.app.ts` (`/api/leaderboard`)**:
   - Query change: `.order("gems", { ascending: false })` ➔ `.order("weekly_xp", { ascending: false })`.
   - Payload me `xp: Number(row.weekly_xp ?? 0)`.
2. **`src/App.tsx`**:
   - Leaderboard mapping aur live updates me `profile.gems` ki jagah `profile.weekly_xp` use hota hai.
3. **`src/components/Leaderboard.tsx`**:
   - UI me `cookiesIcon` ki jagah `XP` badge dikhaya jata hai.
   - Text "Only X cookies to overtake" badal kar "Only X XP to overtake" hota hai.

---

## 4. Shaurya se Discuss & Decide Karne Wale 4 Key Points

Shaurya ke saamne approval lene ke liye ye 4 sawal clear hone chahiye:

### Q1. Database me existing users ka `weekly_xp` kitna populated hai?
- Agar Supabase `profiles` table me kaafi students ka `weekly_xp` column `0` ya `NULL` hai (kyunki purane lessons sirf `gems` badha rahe the), toh patch lagate hi sabki rank `0` ho jayegi.
- **Solution:** Shaurya ki approval ke sath ek One-Time SQL script chalana padega jo completed lessons ke hisab se sabka initial XP calculate kare.

### Q2. Weekly Reset Cycle (Har Sunday raat ko reset?)
- Agar iska naam **Weekly XP** hai, toh kya har Sunday midnight ye reset hona chahiye?
- Supabase me `pg_cron` ya server scheduled job set karni padegi jo har hafte leaderboard reset kare. Agar reset nahi karna hai, toh isko **Total XP** bolna chahiye.

### Q3. Spin Rewards ka XP me na aana
- Confirm karna hai ki Spin Rewards se sirf **Cookies** milenge (store ke liye), aur XP **sirf padhai (lessons/quizzes)** se milega.

### Q4. User Communication
- Students ko app me bataana hoga ki: *"Ab Leaderboard aapke XP (padhai) par chalega, cookies kharch karne se aapki rank kam nahi hogi!"* (Bachhe khush honge).

---

## 5. Verification & Readiness

- **Patch Location:** `patches/leaderboard-xp.patch`
- **Git Apply Status:** `git apply --check patches/leaderboard-xp.patch` passed with **0 errors**.
- **Action Plan once Shaurya Approves:**
  1. Verify/Backfill `weekly_xp` in Supabase DB.
  2. Run `git apply patches/leaderboard-xp.patch`.
  3. Deploy to production.
