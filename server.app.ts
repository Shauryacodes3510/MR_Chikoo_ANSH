import express from "express";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { appendEvent, processHeartbeat, aggregateSaaSMetrics, seedServerEventsIfEmpty, registerUserProfile, serverEvents } from "./src/lib/serverAnalytics";
import { 
  grantRewardTransaction, 
  checkClaimStatuses, 
  getUserRewardSummary,
  getDailySpinWheelStatus,
  consumeDailySpinWheel,
  getSpinWheelAdminStatistics
} from "./src/lib/serverRewards";
import { 
  createGenerationJob, 
  getGenerationJob, 
  listGenerationJobs, 
  retryJobStage, 
  skipJobStage, 
  cancelGenerationJob,
  runJobPipeline
} from "./src/lib/serverLessonPipeline";
import { generateDirectChikooLesson } from "./src/lib/serverDirectLessonGenerator";
import { registerCopilotRoutes } from "./src/lib/copilot/server/routes";
import { generateSitemapXml, generateRobotsTxt, CHIKOO_PLATFORM_SEO } from "./src/lib/seoRegistry";
import { resolveSeoForPath, injectSeoIntoHtml } from "./src/lib/serverSeo";
import { redis, CACHE_TTL } from "./src/lib/redis";
import { getISTWeekStart } from "./src/lib/questConfig";
import { logProductionError } from "./src/lib/errorUtils";

dotenv.config();

// Helper to resolve nice illustrations based on keywords
function getMatchingIllustrationUrl(topic: string, details: string): string {
  const query = `${topic} ${details}`.toLowerCase();
  
  if (query.includes("car") || query.includes("autonomous") || query.includes("drive")) {
    return "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600&auto=format&fit=crop";
  }
  if (query.includes("space") || query.includes("star") || query.includes("planet") || query.includes("galaxy")) {
    return "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop";
  }
  if (query.includes("security") || query.includes("fraud") || query.includes("shield") || query.includes("hack")) {
    return "https://images.unsplash.com/photo-1563013544-824ae1d704d3?w=600&auto=format&fit=crop";
  }
  if (query.includes("game") || query.includes("play") || query.includes("quiz") || query.includes("puppy")) {
    return "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop";
  }
  if (query.includes("bot") || query.includes("robot") || query.includes("chat") || query.includes("assistant")) {
    return "https://images.unsplash.com/photo-1531747118685-ca8fa6e08806?w=600&auto=format&fit=crop";
  }
  if (query.includes("vision") || query.includes("face") || query.includes("camera") || query.includes("eye")) {
    return "https://images.unsplash.com/photo-1527474305487-b87b222841cc?w=600&auto=format&fit=crop";
  }
  if (query.includes("brain") || query.includes("neural") || query.includes("mind") || query.includes("think")) {
    return "https://images.unsplash.com/photo-1677442136019-21780efad99a?w=600&auto=format&fit=crop";
  }
  if (query.includes("money") || query.includes("bank") || query.includes("loan") || query.includes("finance")) {
    return "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop";
  }
  if (query.includes("factory") || query.includes("pipeline") || query.includes("rocket") || query.includes("build")) {
    return "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop";
  }
  if (query.includes("ethics") || query.includes("fair") || query.includes("privacy") || query.includes("law")) {
    return "https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=600&auto=format&fit=crop";
  }
  if (query.includes("music") || query.includes("song") || query.includes("melody") || query.includes("sound")) {
    return "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop";
  }
  if (query.includes("nature") || query.includes("plant") || query.includes("crop") || query.includes("tree")) {
    return "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop";
  }
  
  // High-contrast, clean abstract learning background
  return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop";
}

async function startServer() {
  const app = express();
  app.set('trust proxy', 1); // Trust 1 proxy hop (Cloud Run / GFE load balancer)
  const PORT = Number(process.env.PORT) || 3000;

  // Disable Express fingerprinting
  app.disable('x-powered-by');

  // Security Middleware: HSTS, CSP, and Vulnerability Protection Headers
  app.use((req, res, next) => {
    // 1. Enforce HTTPS in production if requested over plain HTTP behind a reverse proxy
    const forwardedProto = req.headers['x-forwarded-proto'];
    if (process.env.NODE_ENV === 'production' && forwardedProto === 'http') {
      const host = req.headers['x-forwarded-host'] || req.headers.host;
      return res.redirect(301, `https://${host}${req.url}`);
    }

    // 2. HTTP Strict Transport Security (HSTS)
    // Instructs browsers to strictly load via HTTPS for 1 year, including subdomains and preloading
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );

    // 3. X-Content-Type-Options
    // Prevents MIME type sniffing (stops browsers from executing non-script types as scripts)
    res.setHeader("X-Content-Type-Options", "nosniff");

    // 4. Content Security Policy (CSP)
    // Mitigates Cross-Site Scripting (XSS), code injection, and rogue content loading
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://accounts.google.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "media-src 'self' data: blob: https:",
      "connect-src 'self' https: wss: ws:",
      "frame-src 'self' https://accounts.google.com https://*.google.com https://*.firebaseapp.com",
      "frame-ancestors 'self' https://*.google.com https://*.aistudio.google.com https://aistudio.google.com https://*.run.app https://*.web.app https://*.firebaseapp.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https:",
      "upgrade-insecure-requests"
    ];
    res.setHeader("Content-Security-Policy", cspDirectives.join("; "));

    // 5. Referrer-Policy
    // Prevents sensitive referrer leakage across origins
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

    // 6. Cross-Origin-Resource-Policy
    // Permits preview frames and verified cross-origin asset loading
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

    // 7. X-XSS-Protection
    // Defense-in-depth for legacy clients
    res.setHeader("X-XSS-Protection", "1; mode=block");

    // 8. Permissions-Policy
    // Restricts sensitive device hardware access
    res.setHeader(
      "Permissions-Policy",
      "camera=(), geolocation=(), microphone=(self), payment=(), usb=()"
    );

    // 9. X-DNS-Prefetch-Control
    res.setHeader("X-DNS-Prefetch-Control", "off");

    next();
  });

  const globalJsonParser = express.json({ limit: '1mb' });
  const largePayloadParser = express.json({ limit: '10mb' });

  const approvedLargePayloadPaths = new Set([
    "/api/database/lessons/save",
    "/api/database/modules/batch-save",
    "/api/database/worlds/save",
    "/api/database/rewards/save",
    "/api/generate-lesson-image"
  ]);

  app.use(async (req, res, next) => {
    const cleanPath = req.path.replace(/\/+$/, '') || '/';
    if (req.method === 'POST' && approvedLargePayloadPaths.has(cleanPath)) {
      // Admin authentication and authorization check before parsing large body (10MB limit)
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, error: "Unauthorized: Missing authentication token." });
      }
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      if (!token) {
        return res.status(401).json({ success: false, error: "Unauthorized: Invalid authentication token." });
      }
      const client = getSupabaseServer();
      if (!client) {
        return res.status(503).json({ success: false, error: "Database not configured" });
      }
      try {
        const { data: { user }, error: authErr } = await client.auth.getUser(token);
        if (authErr || !user || !user.id) {
          return res.status(401).json({ success: false, error: "Unauthorized: Invalid or expired session." });
        }
        const { data: profile, error: profErr } = await client
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .maybeSingle();
        if (profErr || !profile || profile.is_admin !== true) {
          return res.status(403).json({ success: false, error: "Unauthorized: Admin access required." });
        }
        return largePayloadParser(req, res, next);
      } catch (err: any) {
        console.error("[Pre-parser Admin Check Error]:", err);
        return res.status(401).json({ success: false, error: "Authentication verification failed." });
      }
    }
    return globalJsonParser(req, res, next);
  });
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // CORS middleware to ensure backend analytics endpoints are accessible cross-origin and in iframe previews
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  let supabaseServerClient: any = null;
  function getSupabaseServer() {
    if (supabaseServerClient) return supabaseServerClient;
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !serviceKey || url === 'https://your-project.supabase.co') {
      return null;
    }
    try {
      supabaseServerClient = createClient(url, serviceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      return supabaseServerClient;
    } catch (err) {
      console.error("[Supabase Server] Error initializing client:", err);
      return null;
    }
  }

  async function isAdmin(req: express.Request): Promise<boolean> {
    // 1. Strict Supabase Bearer token verification
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return false;
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return false;
    }

    const client = getSupabaseServer();
    if (!client) {
      return false;
    }

    try {
      // Cryptographically verify user identity using server-side Supabase Auth
      const { data: { user }, error: authErr } = await client.auth.getUser(token);
      if (authErr || !user || !user.id) {
        return false;
      }

      // Query database profile strictly by verified authenticated user ID
      const { data: profile, error: profErr } = await client
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle();

      if (profErr || !profile) {
        return false;
      }

      return profile.is_admin === true;
    } catch (authErr) {
      console.warn("[isAdmin] Supabase auth check exception:", authErr);
      return false;
    }
  }

  // In-memory rate limiter and auth verification for AI / generation endpoints
  const aiRateLimitMap = new Map<string, { count: number; resetAt: number }>();

  // Normalize and hash raw IP addresses securely using HMAC-SHA256 with production secret validation
  function getNormalizedIpHash(req: express.Request): string {
    const rawIp = req.ip || req.socket.remoteAddress || 'unknown';
    let cleanIp = rawIp.replace(/^::ffff:/, '').trim();
    if (cleanIp.includes(':') && cleanIp.includes('.')) {
      const parts = cleanIp.split(':');
      cleanIp = parts[parts.length - 1];
    }
    cleanIp = cleanIp.replace(/^\[(.*)\]:\d+$/, '$1');

    const secret = process.env.IP_HASH_SECRET;
    if (process.env.NODE_ENV === 'production' && (!secret || secret.length < 16)) {
      throw new Error("CRITICAL: IP_HASH_SECRET environment variable is missing or too short (< 16 chars) in production.");
    }
    const fallbackSecret = secret || 'chikoo-dev-fallback-secret-key-do-not-use-in-production';
    const hashed = crypto.createHmac('sha256', fallbackSecret)
      .update(cleanIp)
      .digest('hex')
      .substring(0, 16);
    return hashed;
  }

  // Distributed Redis-backed rate limiter using an atomic Lua script (Fixed-Window Counter with first-request expiration)
  async function checkDistributedAiRateLimit(
    req: express.Request, 
    res: express.Response, 
    maxRequests: number = 30
  ): Promise<boolean> {
    const authHeader = req.headers.authorization;
    let userId: string | null = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace(/^Bearer\s+/i, "").trim();
      const client = getSupabaseServer();
      if (client && token) {
        try {
          const { data: { user } } = await client.auth.getUser(token);
          if (user?.id) {
            userId = user.id;
          }
        } catch {
          // Fallback to IP if user resolution fails
        }
      }
    }

    const identifier = userId ? `user:${userId}` : `ip_hash:${getNormalizedIpHash(req)}`;
    const key = `ratelimit:ai:${identifier}`;
    const windowSeconds = 60;

    const rateLimitLuaScript = `
      local current = redis.call('INCR', KEYS[1])
      if current == 1 then
          redis.call('EXPIRE', KEYS[1], ARGV[1])
      end
      return current
    `;

    try {
      if (!redis) {
        logProductionError('redis_rate_limit_unavailable', 'server.app.ts', 'network', new Error("Redis client is null"));
        res.status(503).json({ success: false, error: "Service temporarily unavailable due to high load. Please try again later." });
        return false;
      }

      const result = await Promise.race([
        redis.eval(rateLimitLuaScript, 1, key, windowSeconds),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Redis operation timeout")), 2000))
      ]) as any;

      const currentCount = Number(result) || 1;
      if (currentCount > maxRequests) {
        res.status(429).json({ success: false, error: "Rate limit exceeded: Too many AI requests. Please wait a minute." });
        return false;
      }
    } catch (redisErr) {
      logProductionError('redis_rate_limit_error', 'server.app.ts', 'network', redisErr);
      res.status(503).json({ success: false, error: "Service temporarily unavailable due to high load. Please try again later." });
      return false;
    }

    return true;
  }

  const checkAiRateLimitAndAuth = checkDistributedAiRateLimit;

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Account Deletion Endpoints (Google Play Console Policy Compliance)
  app.post("/api/account/delete", async (req, res) => {
    res.setHeader("Content-Type", "application/json");

    // 1. Enforce strict Bearer token authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, error: "Unauthorized: Missing authentication token." });
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return res.status(401).json({ success: false, error: "Unauthorized: Invalid authentication token." });
    }

    const client = getSupabaseServer();
    if (!client) {
      return res.status(503).json({ success: false, error: "Database not configured" });
    }

    try {
      // 2. Verify identity with Supabase Auth
      const { data: { user }, error: authError } = await client.auth.getUser(token);
      if (authError || !user || !user.id) {
        return res.status(401).json({ success: false, error: "Unauthorized: Invalid or expired session." });
      }

      // 3. Derive target account strictly from verified authenticated user
      const targetUserId = user.id;
      const targetUserEmail = (user.email || '').toLowerCase().trim();

      console.log(`[Account Deletion] Verified deletion request for authenticated user ID: ${targetUserId} (${targetUserEmail})`);

      // 4. Scrub related user data across application tables
      await Promise.allSettled([
        client.from("profiles").delete().eq("id", targetUserId),
        client.from("user_world_progress").delete().eq("user_id", targetUserId),
        client.from("spin_wheel_claims").delete().eq("user_id", targetUserId),
        client.from("user_bookmarks").delete().eq("user_id", targetUserId),
        client.from("user_lesson_progress").delete().eq("user_id", targetUserId),
        client.from("user_challenge_progress").delete().eq("user_id", targetUserId),
        client.from("spin_wheel_daily_usage").delete().eq("user_id", targetUserId)
      ]);

      // 5. Delete Auth user via Supabase admin API
      try {
        if (client.auth?.admin?.deleteUser) {
          await client.auth.admin.deleteUser(targetUserId);
          console.log(`[Account Deletion] Auth user deleted via admin API: ${targetUserId}`);
        }
      } catch (authDeleteErr) {
        console.warn("[Account Deletion] Auth admin deleteUser warning:", authDeleteErr);
      }

      return res.json({
        success: true,
        message: "Account and associated personal data deleted successfully."
      });
    } catch (err: any) {
      console.error("[Account Deletion Error]:", err);
      return res.status(500).json({ success: false, error: err?.message || "Failed to process account deletion." });
    }
  });

  app.post("/api/account/request-deletion", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    const { email, reason } = req.body || {};

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ success: false, error: "Valid account email is required." });
    }

    const cleanEmail = email.toLowerCase().trim();
    const ticketId = `DEL-CHK-${Math.floor(100000 + Math.random() * 900000)}`;
    console.log(`[Account Deletion Ticket Logged] Ticket: ${ticketId}, Email: ${cleanEmail}, Reason: ${reason || 'N/A'}`);

    return res.json({
      success: true,
      ticketId,
      message: `Account deletion request logged under reference ${ticketId}. Associated data will be processed within 48 hours.`
    });
  });

  // Admin route protection middleware
  app.use("/api/admin", async (req, res, next) => {
    if (!(await isAdmin(req))) {
      return res.status(403).json({ success: false, error: "Unauthorized: Admin access required" });
    }
    next();
  });

  // Concrete fast database endpoints for instant reliable hydration
  app.get("/api/database/bootstrap", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    try {
      const client = getSupabaseServer();
      if (!client) {
        return res.status(503).json({ success: false, error: "Database not configured" });
      }

      const [modulesRes, lessonsRes, rewardsRes] = await Promise.all([
        client.from("modules").select("*").order("order", { ascending: true }),
        client.from("lessons").select("*").order("order_index", { ascending: true }),
        client.from("rewards").select("*").order("id", { ascending: true })
      ]);

      let modulesData = modulesRes.data || [];
      if (modulesRes.error) {
        console.warn("[Database Bootstrap] modules query error, retrying without order:", modulesRes.error.message);
        const retry = await client.from("modules").select("*");
        modulesData = retry.data || [];
      }

      let lessonsData = lessonsRes.data || [];
      if (lessonsRes.error) {
        console.warn("[Database Bootstrap] lessons query error, retrying without order:", lessonsRes.error.message);
        const retry = await client.from("lessons").select("*");
        lessonsData = retry.data || [];
      }

      const formattedRewards = (rewardsRes.data || []).map((item: any) => {
        let visualData: any = {};
        try {
          visualData = typeof item.visual === 'string' ? JSON.parse(item.visual) : (item.visual || {});
        } catch {
          visualData = {};
        }
        return {
          id: item.id,
          title: item.title,
          description: item.description || visualData.description || '',
          image: visualData.image || '',
          category: visualData.category || 'Spotlight Rewards',
          requirementType: visualData.requirementType || 'gems',
          xpRequirement: item.cost_xp ?? visualData.xpRequirement ?? 0,
          gemRequirement: item.cost_gems ?? visualData.gemRequirement ?? 0,
          plusRequirement: !!visualData.plusRequirement,
          isPlusExclusive: !!visualData.plusRequirement,
          eligibilityRules: visualData.eligibilityRules || '',
          featuredStatus: !!visualData.featuredStatus,
          isActive: visualData.isActive !== false,
          stock: visualData.stock ?? 99,
          rarity: visualData.rarity || 'common',
          visual: visualData.visual || visualData.image || ''
        };
      });

      return res.json({
        success: true,
        modules: modulesData,
        lessons: lessonsData,
        rewards: formattedRewards
      });
    } catch (err: any) {
      console.error("[Database Bootstrap Error]:", err);
      return res.status(500).json({ success: false, error: err?.message || "Bootstrap failed" });
    }
  });

  let curriculumMemoryCache: { timestamp: number; data: { success: boolean; modules: any[]; lessons: any[] } } | null = null;
  const CURRICULUM_CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL

  app.get("/api/database/curriculum", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

    const forceFresh = req.query.fresh === 'true' || req.query.fresh === '1';

    // Try Redis cache
    if (!forceFresh && redis) {
      try {
        const cached = await redis.get('curriculum_data');
        if (cached) {
          return res.json(JSON.parse(cached));
        }
      } catch (err) {
        logProductionError('redis_get', 'server.ts', 'network', err);
      }
    }

    try {
      const client = getSupabaseServer();
      if (!client) {
        return res.status(503).json({ success: false, error: "Database not configured" });
      }

      let modulesData: any[] = [];
      let lessonsData: any[] = [];

      try {
        const [modulesRes, lessonsRes] = await Promise.all([
          client.from("modules").select("*").order("order", { ascending: true }),
          client.from("lessons").select("*").order("order_index", { ascending: true })
        ]);
        modulesData = modulesRes.data || [];
        lessonsData = lessonsRes.data || [];
      } catch (queryErr) {
        console.warn("[Curriculum Query Warning]:", queryErr);
      }

      // Retry without ordering if ordering failed or returned empty
      if (modulesData.length === 0) {
        const mRetry = await client.from("modules").select("*");
        modulesData = mRetry.data || [];
      }
      if (lessonsData.length === 0) {
        const lRetry = await client.from("lessons").select("*");
        lessonsData = lRetry.data || [];
      }

      const responsePayload = {
        success: true,
        modules: modulesData,
        lessons: lessonsData
      };

      if (lessonsData.length > 0) {
        await redis?.set('curriculum_data', JSON.stringify(responsePayload), 'EX', CACHE_TTL).catch(err => logProductionError('redis_set', 'server.ts', 'network', err));
      }

      return res.json(responsePayload);
    } catch (err: any) {
      logProductionError('fetch_curriculum', 'server.ts', 'server', err);
      console.error("[Curriculum Fetch Error]:", err);
      return res.status(500).json({ success: false, error: err?.message || "Failed to fetch curriculum" });
    }
  });

  // Get single lesson by id with server credentials
  app.get("/api/database/lessons/:id", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    try {
      const client = getSupabaseServer();
      if (!client) {
        return res.status(503).json({ success: false, error: "Database not configured" });
      }
      const lessonId = req.params.id;
      let { data, error } = await client
        .from("lessons")
        .select("*")
        .eq("id", lessonId)
        .maybeSingle();

      if (!data) {
        const retry = await client
          .from("lessons")
          .select("*")
          .ilike("id", lessonId)
          .maybeSingle();
        data = retry.data;
      }

      if (error && !data) throw error;
      return res.json({ success: true, lesson: data });
    } catch (err: any) {
      logProductionError('fetch_single_lesson', 'server.ts', 'server', err);
      return res.status(500).json({ success: false, error: err?.message || "Failed to fetch lesson" });
    }
  });

  // Get all modules with server credentials
  app.get("/api/database/modules", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    try {
      const client = getSupabaseServer();
      if (!client) return res.status(503).json({ success: false, error: "Database not configured" });
      const { data, error } = await client.from("modules").select("*").order("order", { ascending: true });
      if (error) {
        const retry = await client.from("modules").select("*");
        return res.json({ success: true, modules: retry.data || [] });
      }
      return res.json({ success: true, modules: data || [] });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || "Failed to fetch modules" });
    }
  });

  // Get all lessons with server credentials
  app.get("/api/database/lessons", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    try {
      const client = getSupabaseServer();
      if (!client) return res.status(503).json({ success: false, error: "Database not configured" });
      const { data, error } = await client.from("lessons").select("*").order("order_index", { ascending: true });
      if (error) {
        const retry = await client.from("lessons").select("*");
        return res.json({ success: true, lessons: retry.data || [] });
      }
      return res.json({ success: true, lessons: data || [] });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || "Failed to fetch lessons" });
    }
  });

  // Get puzzle packs with service role
  app.get("/api/database/puzzle-packs", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    try {
      const client = getSupabaseServer();
      if (!client) return res.status(503).json({ success: false, error: "Database not configured" });
      const { data } = await client.from("puzzle_packs").select("*");
      return res.json({ success: true, packs: data || [] });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || "Failed to fetch puzzle packs" });
    }
  });

  // Get challenge packs with service role
  app.get("/api/database/challenge-packs", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    try {
      const client = getSupabaseServer();
      if (!client) return res.status(503).json({ success: false, error: "Database not configured" });
      const { data } = await client.from("challenge_packs").select("*");
      return res.json({ success: true, packs: data || [] });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || "Failed to fetch challenge packs" });
    }
  });

  // Save/Upsert single lesson directly to Supabase via server API
  app.post("/api/database/lessons/save", async (req, res) => {
    if (!(await isAdmin(req))) {
      return res.status(403).json({ success: false, error: "Unauthorized: Admin access required" });
    }
    res.setHeader("Content-Type", "application/json");
    await redis?.del('curriculum_data').catch(err => logProductionError('redis_del', 'server.ts', 'network', err));

    const lessonData = req.body;
    if (!lessonData || !lessonData.id || !lessonData.module_id) {
      return res.status(400).json({ success: false, error: "Missing required lesson fields (id, module_id)" });
    }

    try {
      const client = getSupabaseServer();
      if (!client) {
        return res.json({ success: true, localOnly: true, lesson: lessonData });
      }

      const payload: any = {
        id: lessonData.id,
        module_id: lessonData.module_id,
        title: lessonData.title || 'Untitled Lesson',
        description: lessonData.description || '',
        difficulty: lessonData.difficulty || 'Easy',
        xp_reward: Number(lessonData.xp_reward ?? 100),
        challenges: Array.isArray(lessonData.challenges) ? lessonData.challenges : []
      };
      if (typeof lessonData.order_index === 'number') {
        payload.order_index = lessonData.order_index;
      }

      // Fetch existing lesson to preserve content and video_url
      const { data: existingLesson } = await client
        .from('lessons')
        .select('content, video_url')
        .eq('id', payload.id)
        .maybeSingle();

      const upsertPayload = {
        ...payload,
        content: existingLesson?.content || null,
        video_url: existingLesson?.video_url || null
      };

      const { data, error } = await client
        .from("lessons")
        .upsert([upsertPayload])
        .select()
        .single();

      if (error) {
        console.error("[Supabase Server] Error saving lesson:", error);
        return res.status(500).json({ success: false, error: error.message });
      }

      curriculumMemoryCache = null;
      return res.json({ success: true, lesson: data || payload });
    } catch (err: any) {
      logProductionError('save_lesson', 'server.ts', 'server', err, { lessonId: lessonData.id });
      console.error("[Supabase Server] Exception saving lesson:", err);
      return res.status(500).json({ success: false, error: err?.message || "Save lesson failed" });
    }
  });

  // Save/Upsert module directly to Supabase via server API
  app.post("/api/database/modules/save", async (req, res) => {
    if (!(await isAdmin(req))) {
      return res.status(403).json({ success: false, error: "Unauthorized: Admin access required" });
    }
    res.setHeader("Content-Type", "application/json");
    const modData = req.body;
    if (!modData || !modData.id) {
      return res.status(400).json({ success: false, error: "Missing module id" });
    }
    try {
      curriculumMemoryCache = null;
      await redis?.del('curriculum_data').catch(err => logProductionError('redis_del', 'server.ts', 'network', err));
      const client = getSupabaseServer();
      if (!client) {
        return res.json({ success: true, localOnly: true, module: modData });
      }
      const { data, error } = await client
        .from("modules")
        .upsert([modData])
        .select()
        .single();
      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }
      return res.json({ success: true, module: data || modData });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || "Save module failed" });
    }
  });

  // Batch Save/Upsert modules directly to Supabase via server API (for reordering & batch updates)
  app.post("/api/database/modules/batch-save", async (req, res) => {
    if (!(await isAdmin(req))) {
      return res.status(403).json({ success: false, error: "Unauthorized: Admin access required" });
    }
    res.setHeader("Content-Type", "application/json");
    const { modules } = req.body;
    if (!Array.isArray(modules) || modules.length === 0) {
      return res.status(400).json({ success: false, error: "Missing or invalid modules array" });
    }
    try {
      curriculumMemoryCache = null;
      await redis?.del('curriculum_data').catch(err => logProductionError('redis_del', 'server.ts', 'network', err));
      const client = getSupabaseServer();
      if (!client) {
        return res.json({ success: true, localOnly: true, count: modules.length });
      }
      const payload = modules.map((m: any, idx: number) => ({
        id: m.id,
        title: m.title,
        description: m.description || '',
        icon: m.icon || 'Sparkles',
        order: m.order ?? m.sort_order ?? idx,
        is_practice: !!m.is_practice,
        world_id: m.world_id || null,
        metadata: m.metadata || null
      }));
      const { data, error } = await client
        .from("modules")
        .upsert(payload);
      if (error) {
        console.error("[Supabase Server] Error batch saving modules:", error);
        return res.status(500).json({ success: false, error: error.message });
      }
      return res.json({ success: true, count: payload.length });
    } catch (err: any) {
      console.error("[Supabase Server] Exception batch saving modules:", err);
      return res.status(500).json({ success: false, error: err?.message || "Batch save modules failed" });
    }
  });

  // Save/Upsert world directly to Supabase via server API
  app.post("/api/database/worlds/save", async (req, res) => {
    if (!(await isAdmin(req))) {
      return res.status(403).json({ success: false, error: "Unauthorized: Admin access required" });
    }
    res.setHeader("Content-Type", "application/json");
    const worldData = req.body;
    if (!worldData) {
      return res.status(400).json({ success: false, error: "Missing world data" });
    }
    try {
      const client = getSupabaseServer();
      if (!client) {
        return res.json({ success: true, localOnly: true, world: worldData });
      }
      let query = client.from("worlds");
      let data, error;
      if (worldData.id) {
        const resUpsert = await query.upsert([worldData]).select().single();
        data = resUpsert.data;
        error = resUpsert.error;
      } else {
        const resInsert = await query.insert([worldData]).select().single();
        data = resInsert.data;
        error = resInsert.error;
      }
      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }
      return res.json({ success: true, world: data || worldData });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || "Save world failed" });
    }
  });

  // Save/Upsert reward directly to Supabase via server API
  app.post("/api/database/rewards/save", async (req, res) => {
    if (!(await isAdmin(req))) {
      return res.status(403).json({ success: false, error: "Unauthorized: Admin access required" });
    }
    res.setHeader("Content-Type", "application/json");
    const rewardData = req.body;
    if (!rewardData || !rewardData.id) {
      return res.status(400).json({ success: false, error: "Missing reward id" });
    }
    try {
      const client = getSupabaseServer();
      if (!client) {
        return res.json({ success: true, localOnly: true, reward: rewardData });
      }
      const { data, error } = await client
        .from("rewards")
        .upsert([rewardData])
        .select()
        .single();
      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }
      return res.json({ success: true, reward: data || rewardData });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || "Save reward failed" });
    }
  });


  // Helper to ensure style reference assets exist locally and are uploaded to the chikoo-assets bucket
  async function ensureReferenceAsset(client: any, localPath: string, bucketPath: string) {
    try {
      const { data: list, error: listErr } = await client.storage
        .from('chikoo-assets')
        .list('references', {
          search: path.basename(bucketPath)
        });
        
      if (list && list.some((item: any) => item.name === path.basename(bucketPath))) {
        return;
      }
      
      const absoluteLocalPath = path.resolve(localPath);
      if (!fs.existsSync(absoluteLocalPath)) {
        console.warn(`[ensureReferenceAsset] Local file ${localPath} not found. Creating a fallback placeholder.`);
        const dir = path.dirname(absoluteLocalPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        // 1px transparent webp fallback
        const fallbackBase64 = "UklGRkoAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAwAAAARBxAR/Q9ERP8DAABWUDggGAAAABQBAJ0BKgEAAQAAAPgR/QAAAAA=";
        fs.writeFileSync(absoluteLocalPath, Buffer.from(fallbackBase64, 'base64'));
      }
      
      const fileBuffer = fs.readFileSync(absoluteLocalPath);
      const { error: uploadErr } = await client.storage
        .from('chikoo-assets')
        .upload(bucketPath, fileBuffer, {
          contentType: 'image/webp',
          upsert: true
        });
        
      if (uploadErr) {
        console.error(`[ensureReferenceAsset] Error uploading ${bucketPath} to storage:`, uploadErr);
      } else {
        console.log(`[ensureReferenceAsset] Successfully uploaded reference ${bucketPath} to storage.`);
      }
    } catch (err) {
      console.error(`[ensureReferenceAsset] Error ensuring reference asset ${bucketPath}:`, err);
    }
  }

  // Secure lesson image generation with Gemini and Supabase Storage
  app.post("/api/generate-lesson-image", async (req, res) => {
    res.setHeader("Content-Type", "application/json");

    if (!(await isAdmin(req))) {
      return res.status(403).json({ success: false, error: "Unauthorized: Admin access required" });
    }
    if (!(await checkDistributedAiRateLimit(req, res, 20))) {
      return;
    }
    
    const apiKey = process.env.GEMINI_API_KEY || '';
    const client = getSupabaseServer();
    const { lessonId, screenIndex, contentBody, aspectRatio, generateAllMissing } = req.body || {};

    try {
      // 1. Ensure Storage Bucket exists and reference files are uploaded once if Supabase is configured
      const references = [
        { local: 'references/chikoo-master.webp', bucket: 'references/chikoo-master.webp' },
        { local: 'references/jadoo-master.webp', bucket: 'references/jadoo-master.webp' },
        { local: 'references/chikoo-jadoo-style.webp', bucket: 'references/chikoo-jadoo-style.webp' },
        { local: 'references/environment-style.webp', bucket: 'references/environment-style.webp' }
      ];

      if (client) {
        try {
          const { data: buckets } = await client.storage.listBuckets();
          if (buckets && !buckets.some((b: any) => b.name === 'chikoo-assets')) {
            await client.storage.createBucket('chikoo-assets', {
              public: true,
              fileSizeLimit: 10485760, // 10MB
              allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
            });
          }
          for (const ref of references) {
            await ensureReferenceAsset(client, ref.local, ref.bucket);
          }
        } catch (err) {
          console.warn("Could not check/create bucket 'chikoo-assets':", err);
        }
      }

      let ai: GoogleGenAI | null = null;
      if (apiKey) {
        try {
          ai = new GoogleGenAI({
            apiKey,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build',
              }
            }
          });
        } catch (aiInitErr) {
          console.warn("Failed to initialize GoogleGenAI client:", aiInitErr);
        }
      }

      // Internal generator function for a single screen
      const generateForSingleScreen = async (lId: string, idx: number, body: string, aspect: string) => {
        if (!body || body.trim() === '') {
          throw new Error("Cannot generate image for empty content body.");
        }

        // A. Load lesson information to enrich prompt context if available
        let lessonTitle = 'Space Adventure';
        let lesRow: any = null;
        if (client) {
          try {
            const { data } = await client
              .from('lessons')
              .select('*')
              .eq('id', lId)
              .single();
            lesRow = data;
            if (lesRow?.title) {
              lessonTitle = lesRow.title;
            }
          } catch (lesErr) {
            console.warn(`Could not load lesson ${lId} row:`, lesErr);
          }
        }

        // B. Load reference assets from storage if available
        const refParts: any[] = [];
        if (client) {
          for (let i = 0; i < references.length; i++) {
            try {
              const { data: bufData } = await client.storage
                .from('chikoo-assets')
                .download(references[i].bucket);
              if (bufData) {
                const arrayBuffer = await bufData.arrayBuffer();
                // Only attach if it is a real image > 1KB (not an empty placeholder)
                if (arrayBuffer.byteLength > 1024) {
                  const base64 = Buffer.from(arrayBuffer).toString('base64');
                  refParts.push({
                    inlineData: {
                      data: base64,
                      mimeType: 'image/webp'
                    }
                  });
                }
              }
            } catch (dlErr) {
              // Ignore download errors on references
            }
          }
        }

        // C. Build final image prompt strictly anchored to the current screen story/event
        const cleanBody = body.replace(/•\s*/g, '').trim();
        const finalPrompt = `You are a high-quality children's educational content illustrator.
Generate a vibrant 3D-styled educational space digital illustration for:
Lesson Topic: "${lessonTitle}"
Current Lesson Screen Event / Action: "${cleanBody}"

Strict Requirements:
1. UNIFIED STORY EVENTS:
   - Must visually represent the exact events, characters, location, and action described by this current lesson screen ("${cleanBody}").
   - Never invent separate storylines or events not present in the lesson screen.
2. Playful, friendly 3D digital art style. Smooth vector-like shading, rich cosmic colors, soft glowing lights.
3. Character Accuracy:
   - "Chikoo" is a playful, friendly space-puppy character with cute round eyes, orange and cream fur, wearing a small blue space-collar.
   - "Jadoo" is a magical floating spherical silver watch/robot buddy with glowing cyan display eyes.
   - Both characters should look friendly, expressive, and interactive.
4. Setting: A beautiful cosmic, starry space or high-tech planetary classroom environment matching the screen scene.
5. Do NOT include any textual characters, letters, symbols, watermarks, or UI overlays inside the generated image. Pure illustration only.`;

        let publicUrl = '';

        // D. Try AI Image Generation if client & key available
        if (ai) {
          const cleanAspect = ['1:1', '3:4', '4:3', '9:16', '16:9'].includes(aspect) ? aspect : '4:3';
          console.log(`[Gemini Image Gen] Generating image for lesson ${lId}, screen ${idx} (${cleanAspect})...`);

          try {
            const response = await ai.models.generateContent({
              model: 'gemini-3.1-flash-lite-image',
              contents: {
                parts: [
                  ...refParts,
                  { text: finalPrompt }
                ]
              },
              config: {
                imageConfig: {
                  aspectRatio: cleanAspect
                }
              }
            });

            let base64Image = '';
            if (response.candidates?.[0]?.content?.parts) {
              for (const part of response.candidates[0].content.parts) {
                if (part.inlineData?.data) {
                  base64Image = part.inlineData.data;
                  break;
                }
              }
            }

            if (base64Image) {
              // Upload to Supabase Storage if client available
              if (client) {
                try {
                  const uploadBuffer = Buffer.from(base64Image, 'base64');
                  const storageFilename = `generated/lesson_${lId}_screen_${idx}_${Date.now()}.webp`;

                  const { error: uploadErr } = await client.storage
                    .from('chikoo-assets')
                    .upload(storageFilename, uploadBuffer, {
                      contentType: 'image/webp',
                      upsert: true
                    });

                  if (!uploadErr) {
                    const { data: { publicUrl: storageUrl } } = client.storage
                      .from('chikoo-assets')
                      .getPublicUrl(storageFilename);
                    publicUrl = storageUrl;
                  } else {
                    console.warn("[Storage Upload] Fallback to data URI:", uploadErr.message);
                    publicUrl = `data:image/webp;base64,${base64Image}`;
                  }
                } catch (upErr: any) {
                  console.warn("[Storage Upload Exception] Fallback to data URI:", upErr.message);
                  publicUrl = `data:image/webp;base64,${base64Image}`;
                }
              } else {
                publicUrl = `data:image/webp;base64,${base64Image}`;
              }
            }
          } catch (geminiErr: any) {
            console.warn(`[Gemini Image Gen Warning] AI generation unavailable (${geminiErr?.message || geminiErr}). Using high-quality curated visual.`);
          }
        }

        // E. Resilient Fallback: If AI generation was quota-limited or unavailable, use high-quality matching illustration
        if (!publicUrl) {
          publicUrl = getMatchingIllustrationUrl(lessonTitle, cleanBody);
          console.log(`[Image Fallback] Curated space visual assigned for "${lessonTitle}": ${publicUrl}`);
        }

        // F. Update the database record if Supabase is connected
        if (client && lesRow) {
          try {
            const challenges = Array.isArray(lesRow.challenges) ? lesRow.challenges : [];
            if (idx >= 0 && idx < challenges.length) {
              const chal = challenges[idx];
              if (chal.contentScreen) {
                chal.contentScreen.mediaUrl = publicUrl;
              }
              if (chal.visualLessonScreen) {
                chal.visualLessonScreen.mediaUrl = publicUrl;
              }
              chal.mediaUrl = publicUrl;

              await client
                .from('lessons')
                .update({ challenges })
                .eq('id', lId);
            }
          } catch (dbErr) {
            console.warn("Could not persist image URL to database record:", dbErr);
          }
        }

        return publicUrl;
      };

      // Flow routing: bulk generate missing OR single generation
      if (generateAllMissing) {
        console.log("[Supabase Server] Scanning for missing visual/content screen images...");
        let allLessons: any[] = [];
        if (client) {
          const { data, error: lessonsErr } = await client
            .from('lessons')
            .select('id, title, challenges');
          if (lessonsErr) {
            console.warn("Error fetching lessons for bulk generation:", lessonsErr);
          } else {
            allLessons = data || [];
          }
        }

        const generatedList: any[] = [];
        let successCount = 0;
        let failCount = 0;

        for (const les of allLessons) {
          const chals = Array.isArray(les.challenges) ? les.challenges : [];
          for (let i = 0; i < chals.length; i++) {
            const c = chals[i];
            if (c.type === 'content_screen' || c.type === 'visual_lesson_screen') {
              const payload = c.contentScreen || c.visualLessonScreen;
              const currentMediaUrl = payload?.mediaUrl || c.mediaUrl || '';
              const body = payload?.contentBody || c.contentBody || '';

              if (!currentMediaUrl && body) {
                console.log(`[Bulk Gen] Missing image detected: Lesson '${les.title}' (${les.id}), screen index ${i}`);
                try {
                  const url = await generateForSingleScreen(les.id, i, body, '4:3');
                  successCount++;
                  generatedList.push({ lessonId: les.id, lessonTitle: les.title, screenIndex: i, mediaUrl: url });
                } catch (bulkErr: any) {
                  failCount++;
                  console.error(`[Bulk Gen Failed] Lesson ${les.id}, screen index ${i}:`, bulkErr);
                }
              }
            }
          }
        }

        curriculumMemoryCache = null;

        return res.json({
          success: true,
          message: `Bulk generation complete! Success: ${successCount}, Failed: ${failCount}`,
          results: generatedList
        });
      } else {
        if (!lessonId || screenIndex === undefined) {
          return res.status(400).json({ success: false, error: "Missing required parameters: lessonId and screenIndex." });
        }

        const publicUrl = await generateForSingleScreen(lessonId, Number(screenIndex), contentBody || '', aspectRatio || '4:3');
        curriculumMemoryCache = null;

        return res.json({
          success: true,
          mediaUrl: publicUrl
        });
      }

    } catch (err: any) {
      console.error("❌ Exception in secure generate-lesson-image endpoint:", err);
      return res.status(200).json({ success: false, error: err.message || "Failed to generate visual illustration" });
    }
  });

  // Delete Unit Module from Supabase database with full cascade cleanup
  app.delete("/api/database/modules/:id", async (req, res) => {
    if (!(await isAdmin(req))) {
      return res.status(403).json({ success: false, error: "Unauthorized: Admin access required" });
    }
    res.setHeader("Content-Type", "application/json");
    const moduleId = req.params.id;
    if (!moduleId) {
      return res.status(400).json({ success: false, error: "Module ID is required" });
    }

    // Invalidate server-side curriculum cache immediately
    await redis?.del('curriculum_data').catch(err => logProductionError('redis_del', 'server.ts', 'network', err));

    try {
      const client = getSupabaseServer();
      if (!client) {
        return res.json({ success: true, localOnly: true, deletedId: moduleId });
      }

      console.log(`[Supabase Server] Deleting module '${moduleId}' and child records...`);

      // 1. Cascade delete all child lessons for this module
      try {
        await client.from("lessons").delete().eq("module_id", moduleId);
      } catch (lesErr) {
        console.warn(`[Supabase Server] Warning deleting child lessons for module ${moduleId}:`, lesErr);
      }

      // 2. Cascade delete learning path nodes if table exists
      try {
        await client.from("module_learning_path").delete().eq("module_id", moduleId);
      } catch (_) {}

      // 3. Delete the module row
      const { error } = await client.from("modules").delete().eq("id", moduleId);
      if (error) {
        console.error(`[Supabase Server] Error deleting module ${moduleId}:`, error);
        return res.status(500).json({ success: false, error: error.message });
      }

      console.log(`[Supabase Server] Module '${moduleId}' successfully deleted.`);
      return res.json({ success: true, deletedId: moduleId });
    } catch (err: any) {
      console.error(`[Supabase Server] Exception deleting module ${moduleId}:`, err);
      return res.status(500).json({ success: false, error: err?.message || "Delete failed" });
    }
  });

  // Delete Lesson from Supabase database
  app.delete("/api/database/lessons/:id", async (req, res) => {
    if (!(await isAdmin(req))) {
      return res.status(403).json({ success: false, error: "Unauthorized: Admin access required" });
    }
    res.setHeader("Content-Type", "application/json");
    const lessonId = req.params.id;
    if (!lessonId) {
      return res.status(400).json({ success: false, error: "Lesson ID is required" });
    }

    await redis.del('curriculum_data').catch(console.error);

    try {
      const client = getSupabaseServer();
      if (!client) {
        return res.json({ success: true, localOnly: true, deletedId: lessonId });
      }

      console.log(`[Supabase Server] Deleting lesson '${lessonId}'...`);
      const { error } = await client.from("lessons").delete().eq("id", lessonId);
      if (error) {
        console.error(`[Supabase Server] Error deleting lesson ${lessonId}:`, error);
        return res.status(500).json({ success: false, error: error.message });
      }

      console.log(`[Supabase Server] Lesson '${lessonId}' successfully deleted.`);
      return res.json({ success: true, deletedId: lessonId });
    } catch (err: any) {
      console.error(`[Supabase Server] Exception deleting lesson ${lessonId}:`, err);
      return res.status(500).json({ success: false, error: err?.message || "Delete failed" });
    }
  });

  // Invalidate Server Curriculum Cache
  app.post("/api/database/invalidate-cache", async (req, res) => {
    if (!(await isAdmin(req))) {
      return res.status(403).json({ success: false, error: "Unauthorized: Admin access required" });
    }
    res.setHeader("Content-Type", "application/json");
    await redis?.del('curriculum_data').catch(err => logProductionError('redis_del', 'server.ts', 'network', err));
    return res.json({ success: true, message: "Curriculum cache cleared" });
  });

  app.get("/api/database/leaderboard", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    try {
      const client = getSupabaseServer();
      if (!client) {
        return res.status(503).json({ success: false, error: "Database not configured" });
      }

      // Query only public gaming metrics, strictly omitting email and internal database UUIDs
      const { data, error } = await client
        .from("profiles")
        .select("username, xp, weekly_xp, weekly_xp_week, gems, streak, energy, avatar_id, theme_id, created_at")
        // Current-week rows first, then by XP, so stale rows can never outrank or crowd out active users.
        .order("weekly_xp_week", { ascending: false, nullsFirst: false })
        .order("weekly_xp", { ascending: false })
        .limit(500);

      if (error) {
        throw error;
      }

      // weekly_xp resets lazily (on the next claim), so rows from earlier weeks count as 0.
      const currentWeek = getISTWeekStart();

      // Sanitize each row: assign sequential rank and safe synthetic public ID
      const sanitizedLeaderboard = (data || []).map((row: any, index: number) => {
        const weeklyXp = String(row.weekly_xp_week ?? '').slice(0, 10) === currentWeek
          ? Number(row.weekly_xp ?? 0)
          : 0;
        let safeName = (row.username || '').trim();
        // If the username contains '@' or looks like an email, mask it to prevent PII exposure
        if (!safeName || safeName.includes('@')) {
          safeName = `Explorer_${index + 1}`;
        }

        return {
          rank: index + 1,
          id: `player_${index + 1}`,
          username: safeName,
          name: safeName,
          xp: weeklyXp,
          gems: Number(row.gems ?? 0),
          weekly_xp: weeklyXp,
          weekly_xp_week: row.weekly_xp_week ?? null,
          streak: Number(row.streak ?? 0),
          energy: Number(row.energy ?? 5),
          avatar_id: row.avatar_id || 'user',
          theme_id: row.theme_id || 'blue',
          created_at: row.created_at || new Date().toISOString()
        };
      });

      return res.json({
        success: true,
        leaderboard: sanitizedLeaderboard
      });
    } catch (err: any) {
      console.error("[Leaderboard Fetch Error]:", err);
      return res.status(500).json({ success: false, error: "Failed to fetch leaderboard" });
    }
  });

  // Admin Profile Modification Endpoint (Strictly authenticated administrators only)
  app.post("/api/admin/users/update-profile", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    if (!(await isAdmin(req))) {
      return res.status(403).json({ success: false, error: "Unauthorized: Admin access required" });
    }

    const { email, userId, updates } = req.body || {};
    if (!email && !userId) {
      return res.status(400).json({ success: false, error: "User email or userId is required." });
    }
    if (!updates || typeof updates !== "object") {
      return res.status(400).json({ success: false, error: "Valid updates payload is required." });
    }

    try {
      const client = getSupabaseServer();
      if (!client) {
        return res.status(503).json({ success: false, error: "Database not configured" });
      }

      let query = client.from("profiles").update({
        ...updates,
        updated_at: new Date().toISOString()
      });

      if (userId) {
        query = query.eq("id", userId);
      } else {
        query = query.eq("email", email.toLowerCase().trim());
      }

      const { data, error } = await query.select("*").maybeSingle();
      if (error) {
        throw error;
      }

      return res.json({ success: true, profile: data });
    } catch (err: any) {
      console.error("[Admin Update Profile Error]:", err);
      return res.status(500).json({ success: false, error: err?.message || "Failed to update profile." });
    }
  });

  app.get("/api/database/rewards", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    try {
      const client = getSupabaseServer();
      if (!client) {
        return res.status(503).json({ success: false, error: "Database not configured" });
      }

      const { data, error } = await client
        .from("rewards")
        .select("*")
        .order("id", { ascending: true });

      if (error) {
        throw error;
      }

      const formatted = (data || []).map((item: any) => {
        let visualData: any = {};
        try {
          visualData = typeof item.visual === 'string' ? JSON.parse(item.visual) : (item.visual || {});
        } catch {
          visualData = {};
        }
        return {
          id: item.id,
          title: item.title,
          description: item.description || visualData.description || '',
          image: visualData.image || '',
          category: visualData.category || 'Spotlight Rewards',
          requirementType: visualData.requirementType || 'gems',
          xpRequirement: item.cost_xp ?? visualData.xpRequirement ?? 0,
          gemRequirement: item.cost_gems ?? visualData.gemRequirement ?? 0,
          plusRequirement: !!visualData.plusRequirement,
          isPlusExclusive: !!visualData.plusRequirement,
          eligibilityRules: visualData.eligibilityRules || '',
          featuredStatus: !!visualData.featuredStatus,
          isActive: visualData.isActive !== false,
          stock: visualData.stock ?? 99,
          rarity: visualData.rarity || 'common',
          visual: visualData.visual || visualData.image || ''
        };
      });

      return res.json({
        success: true,
        rewards: formatted
      });
    } catch (err: any) {
      console.error("[Rewards Fetch Error]:", err);
      return res.status(500).json({ success: false, error: err?.message || "Failed to fetch rewards" });
    }
  });

  // Serve custom SoundEffects folder statically on both dev and production with MIME types and byte range support
  app.use("/SoundEffects", express.static(path.join(process.cwd(), "public", "SoundEffects"), {
    acceptRanges: true,
    maxAge: '7d',
    setHeaders: (res, filepath) => {
      res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
      if (filepath.endsWith('.mp3')) res.setHeader('Content-Type', 'audio/mpeg');
      if (filepath.endsWith('.wav')) res.setHeader('Content-Type', 'audio/wav');
    }
  }));
  app.use("/SoundEffects", express.static(path.join(process.cwd(), "SoundEffects"), {
    acceptRanges: true,
    maxAge: '7d',
    setHeaders: (res, filepath) => {
      res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
      if (filepath.endsWith('.mp3')) res.setHeader('Content-Type', 'audio/mpeg');
      if (filepath.endsWith('.wav')) res.setHeader('Content-Type', 'audio/wav');
    }
  }));

  // Route alias to handle Neon Orbit mp3 with or without URL encoding / spaces
  app.get(["/SoundEffects/Neon Orbit.mp3", "/SoundEffects/Neon%20Orbit.mp3", "/SoundEffects/Neon_Orbit.mp3"], (req, res) => {
    const filePath = path.join(process.cwd(), "public", "SoundEffects", "Neon Orbit.mp3");
    const fallbackPath = path.join(process.cwd(), "SoundEffects", "Neon Orbit.mp3");
    const target = fs.existsSync(filePath) ? filePath : fallbackPath;
    if (fs.existsSync(target)) {
      res.sendFile(target, { headers: { 'Content-Type': 'audio/mpeg', 'Accept-Ranges': 'bytes' } });
    } else {
      res.status(404).send("Audio file not found");
    }
  });

  // Serve root audio files directly and from public folder
  app.get(["/lesson_music.mp3", "/audio/lesson_music.mp3", "/public/lesson_music.mp3", "/public/audio/lesson_music.mp3"], (req, res) => {
    const filePath = path.join(process.cwd(), "public", "lesson_music.mp3");
    const fallbackPath = path.join(process.cwd(), "lesson_music.mp3");
    const target = fs.existsSync(filePath) ? filePath : fallbackPath;
    if (fs.existsSync(target)) {
      res.sendFile(target, { headers: { 'Content-Type': 'audio/mpeg', 'Accept-Ranges': 'bytes' } });
    } else {
      res.status(404).send("Audio file not found");
    }
  });

  app.get(["/snowy.wav", "/public/snowy.wav"], (req, res) => {
    const filePath = path.join(process.cwd(), "public", "snowy.wav");
    const fallbackPath = path.join(process.cwd(), "snowy.wav");
    const target = fs.existsSync(filePath) ? filePath : fallbackPath;
    if (fs.existsSync(target)) {
      res.sendFile(target, { headers: { 'Content-Type': 'audio/wav', 'Accept-Ranges': 'bytes' } });
    } else {
      res.status(404).send("Audio file not found");
    }
  });

  app.get(["/morning.mp3", "/public/morning.mp3", "/audio/morning.mp3", "/public/audio/morning.mp3"], (req, res) => {
    const filePath = path.join(process.cwd(), "public", "morning.mp3");
    const fallbackPath = path.join(process.cwd(), "morning.mp3");
    const target = fs.existsSync(filePath) ? filePath : fallbackPath;
    if (fs.existsSync(target)) {
      res.sendFile(target, { headers: { 'Content-Type': 'audio/mpeg', 'Accept-Ranges': 'bytes' } });
    } else {
      res.status(404).send("Audio file not found");
    }
  });

  // Serve exaplaination_screens statically
  app.use("/exaplaination_screens", express.static(path.join(process.cwd(), "exaplaination_screens")));

  // Serve service worker sw.js dynamically
  app.get("/sw.js", (req, res) => {
    res.setHeader("Content-Type", "application/javascript");
    const swPublic = path.join(process.cwd(), "public", "sw.js");
    res.sendFile(fs.existsSync(swPublic) ? swPublic : path.join(process.cwd(), "sw.js"));
  });

  // Serve PWA manifest
  app.get("/manifest.json", (req, res) => {
    res.setHeader("Content-Type", "application/manifest+json");
    const manifestPath = path.join(process.cwd(), "public", "manifest.json");
    if (fs.existsSync(manifestPath)) {
      res.sendFile(manifestPath);
    } else {
      res.sendFile(path.join(process.cwd(), "manifest.json"));
    }
  });

  // Serve Digital Asset Links for Google Play TWA verification
  app.get(["/.well-known/assetlinks.json", "/assetlinks.json"], (req, res) => {
    res.setHeader("Content-Type", "application/json");
    const assetLinksPath = path.join(process.cwd(), "public", ".well-known", "assetlinks.json");
    if (fs.existsSync(assetLinksPath)) {
      res.sendFile(assetLinksPath);
    } else {
      res.json([
        {
          relation: ["delegate_permission/common.handle_all_urls"],
          target: {
            namespace: "android_app",
            package_name: "com.mrchikoo.learn.twa",
            sha256_cert_fingerprints: [
              "34:6A:8F:27:EC:8A:95:1C:37:82:2E:18:AA:E5:88:2C:C8:53:30:ED:C0:D4:BE:59:D4:2F:25:F2:82:D7:A4:13",
              "CE:7A:EF:C5:2A:EF:B0:01:39:1F:D5:65:86:59:50:72:0B:74:FD:4E:A6:F0:ED:76:34:AD:65:B5:5A:A4:88:DA",
              "8D:87:03:5E:9E:46:F2:9B:62:CA:AC:4B:C0:96:DA:4E:2D:9C:17:4C:7C:58:61:A9:69:0A:80:04:87:35:D5:B0"
            ]
          }
        }
      ]);
    }
  });

  // API router for custom curriculum creation
  app.post("/api/curriculum/generate", async (req, res) => {
    if (!(await isAdmin(req))) {
      return res.status(403).json({ success: false, error: "Unauthorized: Admin access required" });
    }
    if (!(await checkDistributedAiRateLimit(req, res, 15))) {
      return;
    }
    const { topic, imageStyle } = req.body;
    
    if (!topic || typeof topic !== "string" || !topic.trim()) {
      return res.status(400).json({ error: "Please provide a valid topic name." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: "GEMINI_API_KEY environment variable is missing. Please configuration keys in Settings > Secrets." 
      });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `Generate a modern, highly interactive, Duolingo-inspired lesson chapter for school kids (having basic English and no technical background) based on the topic: "${topic}".
The lesson must be visual-first, using extremely short and punchy text (fewer than 100 words), zero jargon, and high-impact micro-explanations.
Whenever a lesson concept contains an explanation, use a simple everyday analogy.

Structure your response ENTIRELY as a single JSON object. Follow this strict schema:
- id: A short unique identifier (e.g., custom_lesson_${Math.floor(Math.random() * 10000)})
- title: A fun, kid-friendly lesson name with emojis (e.g. "🚀 Space AI Explorers")
- description: A short, 1-sentence catchy description of what they'll master in simple language.
- lessonContent: A short, simple, beautiful core concept definition (Strictly under 60 words, highly punchy, 1-2 sentences with a simple everyday analogies/real-world examples instead of technical lines).
- keyPoints: Exactly 3 essential memorable takeaway bullets. Keep them short, simple, and action-oriented.
- summary: A warm, simplified summary under 30 words.
- examples: Exactly 2 highly relatable everyday analogies or real-world examples (e.g., comparing AI to training a puppy or sorting toys).
- estimatedTime: E.g., "12 min"
- difficulty: 'Easy', 'Medium', or 'Hard'
- imageMetadata: An object describing the visual supports to generate:
  - imageStyle: Choose one of ('Illustration', 'Side-by-side visual', 'Infographic', 'Story scene', 'Product demonstration', 'Timeline graphic'). Match the selected style to the theme of the topic.
  - prompts: An object containing 4 custom-crafted visual illustration prompts:
    - educational: High-contrast schematic/diagram description.
    - illustration: Playful vector character scene (Duolingo style).
    - infographic: Clear step or timeline data illustration.
    - scenario: Story-based character panel description.
- flashcards: An array of exactly 2 flashcards (front, back).
- practicalActivities: An array of exactly 1 quick, fun homework protocol.
- mcqs: An array of exactly 2 engaging multiple choice quiz questions. Each question must focus on recognition, understanding, or application using simple everyday scenarios. Questions must avoid long reading. Each question must include an id, question title, array of 4 option text strings, correctAnswer string (must exactly match one option), and an explanation formatted precisely like this:
  "✅ Result\\n🧠 One Simple Explanation\\n🌎 Real-World Example\\n⭐ Fun Fact"
  Do not use any other headers, make each part only 1 short sentence, keeps it brief and fun.

Return ONLY the JSON document. No markdown wrappers.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              lessonContent: { type: Type.STRING },
              keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
              summary: { type: Type.STRING },
              examples: { type: Type.ARRAY, items: { type: Type.STRING } },
              estimatedTime: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              imageMetadata: {
                type: Type.OBJECT,
                properties: {
                  imageStyle: { type: Type.STRING },
                  prompts: {
                    type: Type.OBJECT,
                    properties: {
                      educational: { type: Type.STRING },
                      illustration: { type: Type.STRING },
                      infographic: { type: Type.STRING },
                      scenario: { type: Type.STRING }
                    },
                    required: ["educational", "illustration", "infographic", "scenario"]
                  }
                },
                required: ["imageStyle", "prompts"]
              },
              flashcards: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    front: { type: Type.STRING },
                    back: { type: Type.STRING }
                  },
                  required: ["front", "back"]
                }
              },
              practicalActivities: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    protocol: { type: Type.STRING }
                  },
                  required: ["title", "protocol"]
                }
              },
              mcqs: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctAnswer: { type: Type.STRING },
                    explanation: { type: Type.STRING }
                  },
                  required: ["id", "question", "options", "correctAnswer", "explanation"]
                }
              }
            },
            required: [
              "id", "title", "description", "lessonContent", "keyPoints", 
              "summary", "examples", "estimatedTime", "difficulty", 
              "imageMetadata", "flashcards", "practicalActivities", "mcqs"
            ]
          }
        }
      });

      const rawJson = response.text || "";
      const lessonObj = JSON.parse(rawJson);

      // Programmatically pre-associate a stunning corresponding Unsplash illustration
      const selectedUrl = getMatchingIllustrationUrl(lessonObj.title || topic, lessonObj.description || "");
      lessonObj.imageMetadata.illustrationUrl = selectedUrl;

      res.json(lessonObj);
    } catch (err: any) {
      console.error("Gemini Curriculum Generation Error:", err);
      res.status(500).json({ error: err.message || "Failed to generate visual-first chapter content." });
    }
  });

  // API router for Practice Arena bulk questions generation
  app.post("/api/practice/generate", async (req, res) => {
    if (!(await isAdmin(req))) {
      return res.status(403).json({ success: false, error: "Unauthorized: Admin access required" });
    }
    if (!(await checkDistributedAiRateLimit(req, res, 30))) {
      return;
    }
    const { unitTitle, lessonTitle, questionType, difficulty, quantity } = req.body;

    if (!unitTitle || !lessonTitle || !questionType) {
      return res.status(450).json({ error: "Missing required generation parameters." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: "GEMINI_API_KEY environment variable is missing. Please configure keys in Settings > Secrets." 
      });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `You are a curriculum expert creating highly engaging, educational, and fun practice questions of type "${questionType}" for the topic: "${lessonTitle}" inside the unit "${unitTitle}".
The questions must be structured for kids having basic English and no technical background, with a difficulty tier: "${difficulty || 'Easy'}".
Generate exactly ${quantity || 5} questions of this type.
Answer strictly with a JSON object. Ensure the output object contains exactly a "questions" array of objects.
Each question object in the "questions" array must have the following schema:
- id: A unique text identifier starting with "qi_"
- type: "${questionType}"
- question: A clear, simple question or scenario description suitable for kids.
- explanation: A concise, welcoming explanation of the correct choice using an everyday friendly analogy.

Depending on the questionType limit, inject these precise properties:
* If questionType is "MCQ":
  - options: An array of exactly 4 strings.
  - correctAnswer: A string matching exactly one of the options.
* If questionType is "MatchPairs":
  - pairs: An array of exactly 3 matching objects: { left: string, right: string } where "left" represents an AI concept and "right" matches its daily analogy.
* If questionType is "SpotAI":
  - items: An array of exactly 4 elements: { id: string, text: string, has_ai: boolean, explanation?: string } representing a list where 1 or more items are Powered by AI.
* If questionType is "ToolPicker":
  - toolPicker: An object: { situation: string, tools: An array of exactly 2 tools: { id: string, name: string, emoji: string, description: string, whyCorrect: string, isCorrect: boolean } }
* If questionType is "AIVsHuman":
  - outputs: An array of exactly 2 items comparing human text vs AI draft output: { id: string, title: string, text: string, authorLabel: string, isAI: boolean, emojis: string }
  - correctAnswer: "opt_ai" (or the id of the AI output option)

Return ONLY the raw JSON document. No markdown formatting wrappers.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    type: { type: Type.STRING },
                    question: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctAnswer: { type: Type.STRING },
                    pairs: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          left: { type: Type.STRING },
                          right: { type: Type.STRING }
                        },
                        required: ["left", "right"]
                      }
                    },
                    items: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          text: { type: Type.STRING },
                          has_ai: { type: Type.BOOLEAN },
                          explanation: { type: Type.STRING }
                        },
                        required: ["id", "text", "has_ai"]
                      }
                    },
                    toolPicker: {
                      type: Type.OBJECT,
                      properties: {
                        situation: { type: Type.STRING },
                        tools: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              id: { type: Type.STRING },
                              name: { type: Type.STRING },
                              emoji: { type: Type.STRING },
                              description: { type: Type.STRING },
                              whyCorrect: { type: Type.STRING },
                              isCorrect: { type: Type.BOOLEAN }
                            },
                            required: ["id", "name", "emoji", "description", "whyCorrect", "isCorrect"]
                          }
                        }
                      },
                      required: ["situation", "tools"]
                    },
                    outputs: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          title: { type: Type.STRING },
                          text: { type: Type.STRING },
                          authorLabel: { type: Type.STRING },
                          isAI: { type: Type.BOOLEAN },
                          emojis: { type: Type.STRING }
                        },
                        required: ["id", "title", "text", "authorLabel", "isAI"]
                      }
                    }
                  },
                  required: ["id", "type", "question", "explanation"]
                }
              }
            },
            required: ["questions"]
          }
        }
      });

      const rawJson = response.text || "";
      const resultObj = JSON.parse(rawJson);
      res.json(resultObj);
    } catch (err: any) {
      console.error("Gemini Practice Questions Error:", err);
      res.status(500).json({ error: err.message || "Failed to generate dynamic practice items." });
    }
  });

  // API router for New Practice Systems (Challenges, Puzzles, Battles)
  app.post("/api/practice-systems/generate", async (req, res) => {
    if (!(await isAdmin(req))) {
      return res.status(403).json({ success: false, error: "Unauthorized: Admin access required" });
    }
    if (!(await checkDistributedAiRateLimit(req, res, 30))) {
      return;
    }
    const { systemType, topic, category, difficulty, questionCount } = req.body;

    if (!systemType) {
      return res.status(400).json({ error: "Missing systemType parameter." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: "GEMINI_API_KEY environment variable is missing. Please configure secrets in Settings > Secrets." 
      });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      let systemPrompt = "";
      let responseSchema: any = {};

      if (systemType === "challenges") {
        const count = questionCount || 5;
        systemPrompt = `You are an AI educational curriculum engineer writing challenge questions for school kids.
Topic: "${topic || "AI Around You"}"
Difficulty: "${difficulty || "Easy"}"
Task: Generate exactly ${count} interactive Multiple Choice Questions (MCQs) for kids. Keep topics centered on real-world AI, fun, positive everyday metaphors, and high engagement.
Each question must have exactly 4 plausible choices and 1 correct answer. Provide a friendly explanation with a fun analogy from Aibo.`;

        responseSchema = {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ["id", "question", "options", "correctAnswer", "explanation"]
              }
            }
          },
          required: ["questions"]
        };

      } else if (systemType === "puzzles") {
        systemPrompt = `You are a legendary AI Detective creating premium, clever, scenario-based puzzles for kids (school students).
Category: "${category || "AI Detective"}"
Task: Generate exactly 5 premium clever puzzles of various types ("Visual", "Logic", or "Scenario"). 
A puzzle question should not be a massive text-wall. Put the focus on logical anomalies, AI glitches (e.g., fingers, chronological mistakes, physical collisions) or prompt traps.
Provide exact 4 option strings, a correct answer string, a friendly explanation from Aibo Sleuth, and a clever "logicClue" to guide students.
- type: must be "Visual", "Logic", or "Scenario"
- logicClue: a short hint for the clue button.`;

        responseSchema = {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  type: { type: Type.STRING }, // "Visual" | "Logic" | "Scenario"
                  logicClue: { type: Type.STRING }
                },
                required: ["id", "question", "options", "correctAnswer", "explanation", "type", "logicClue"]
              }
            }
          },
          required: ["questions"]
        };

      } else if (systemType === "battles") {
        systemPrompt = `You are an AI Arena Gamemaster writing lightning-fast MCQ questions for a real-time player vs player speed battle.
Topic: "${topic || "Space AI & Robotics"}"
Task: Generate exactly 5 fast-paced multiple choice questions (MCQs) for kids. Since these have a tight 15-second timer, keep the question text and options incredibly punchy, direct, and fast to read.
Each question must have exactly 4 choices and 1 correct answer string. Provide a cozy speed explanation.`;

        responseSchema = {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ["id", "question", "options", "correctAnswer", "explanation"]
              }
            }
          },
          required: ["questions"]
        };
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: systemPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema
        }
      });

      const rawJson = response.text || "";
      const resultObj = JSON.parse(rawJson);
      res.json(resultObj);
    } catch (err: any) {
      console.error("Gemini Practice Systems Generation Error:", err);
      res.status(500).json({ error: err.message || "Failed to generate practice systems content with Gemini." });
    }
  });

  // =========================================================================
  // SIMPLIFIED DIRECT AI LESSON GENERATION (SINGLE-CALL WITH AUTO-REPAIR)
  // =========================================================================

  app.post("/api/admin/generate-lesson", async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if (!(await checkDistributedAiRateLimit(req, res, 15))) {
      return;
    }
    const { 
      unitId, 
      unitTitle, 
      unitContext, 
      previousLessonMemory, 
      lessonTitle, 
      concept, 
      objective, 
      difficulty = "Medium", 
      storyGoal,
      screenCount = 6
    } = req.body || {};

    if (!concept || !unitTitle) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing required parameters: 'unitTitle' and 'concept' are required." 
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        success: false,
        error: "GEMINI_API_KEY environment variable is missing. Please configure keys in Settings > Secrets." 
      });
    }

    try {
      console.log(`[DirectLessonGenerator] Generating lesson for concept: "${concept}" in unit "${unitTitle}"...`);
      const result = await generateDirectChikooLesson({
        unitId,
        unitTitle,
        unitContext,
        previousLessonMemory,
        lessonTitle,
        concept,
        objective,
        difficulty,
        storyGoal,
        screenCount
      });

      if (!result.success && !result.lesson) {
        return res.status(422).json(result);
      }

      res.status(200).json(result);
    } catch (err: any) {
      console.error("[DirectLessonGenerator] Error generating lesson:", err);
      res.status(500).json({ 
        success: false, 
        error: err.message || "Failed to generate lesson with AI.",
        rawJsonText: "",
        validation: {
          isValid: false,
          issues: [err.message || "Internal server error during generation"],
          warnings: [],
          stats: { screenCount: 0, storyScreens: 0, interactiveScreens: 0, typesPresent: [], totalXp: 0 }
        }
      });
    }
  });

  // =========================================================================
  // PRODUCTION-READY MULTI-STAGE AI LESSON GENERATION PIPELINE
  // =========================================================================

  // 1. Create & Start Multi-Stage Generation Job
  app.post("/api/admin/generation-jobs", async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if (!(await checkDistributedAiRateLimit(req, res, 15))) {
      return;
    }
    const { 
      unitId, 
      unitTitle, 
      unitContext, 
      previousLessonMemory, 
      lessonTitle, 
      concept, 
      objective, 
      difficulty = "Medium", 
      storyGoal,
      screenCount = 6
    } = req.body || {};

    if (!concept || !unitTitle) {
      return res.status(400).json({ error: "Missing required parameters: unitTitle and concept are required." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: "GEMINI_API_KEY environment variable is missing. Please configure keys in Settings > Secrets." 
      });
    }

    try {
      const job = createGenerationJob({
        unitId,
        unitTitle,
        unitContext,
        previousLessonMemory,
        lessonTitle,
        concept,
        objective,
        difficulty,
        storyGoal,
        screenCount
      });

      res.status(201).json({
        jobId: job.jobId,
        status: job.status,
        stage: job.stage,
        progress: job.progress,
        error: job.error,
        failedStage: job.failedStage,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt
      });
    } catch (err: any) {
      console.error("[LessonPipeline] Error creating job:", err);
      res.status(500).json({ error: err.message || "Failed to initialize lesson generation job." });
    }
  });

  // 2. List Recent Generation Jobs (Defined BEFORE :jobId to ensure correct routing)
  app.get("/api/admin/generation-jobs", (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    try {
      const jobs = listGenerationJobs();
      res.json({ jobs });
    } catch (err: any) {
      console.error("[LessonPipeline] Error listing jobs:", err);
      res.status(500).json({ error: err.message || "Failed to list generation jobs." });
    }
  });

  // 3. Query Generation Job Status & Result
  app.get("/api/admin/generation-jobs/:jobId", (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const rawJobId = req.params.jobId;
    const jobId = rawJobId ? String(rawJobId).trim() : '';

    if (!jobId || jobId === 'undefined' || jobId === 'null') {
      return res.status(404).json({ 
        error: "Generation job not found"
      });
    }

    try {
      const job = getGenerationJob(jobId);

      if (!job) {
        return res.status(404).json({ 
          error: "Generation job not found"
        });
      }

      res.status(200).json({
        jobId: job.jobId,
        status: job.status,
        stage: job.stage,
        progress: typeof job.progress === 'number' ? job.progress : 0,
        error: job.error || null,
        failedStage: job.failedStage || null,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        requestParams: job.requestParams || {},
        stageResults: job.stageResults || {},
        lesson: job.lesson || null,
        lessonMemory: job.lessonMemory || null
      });
    } catch (err: any) {
      console.error(`[LessonPipeline] Error retrieving job ${jobId}:`, err);
      res.status(500).json({ 
        error: err.message || `Failed to retrieve generation job ${jobId}.`,
        jobId,
        status: "failed"
      });
    }
  });

  // 4. Retry Failed Job Stage
  app.post("/api/admin/generation-jobs/:jobId/retry-stage", (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const { jobId } = req.params;
    const { stage } = req.body || {};

    if (!jobId) {
      return res.status(400).json({ error: "Missing jobId parameter." });
    }

    try {
      const job = retryJobStage(jobId, stage);
      res.json(job);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to retry stage." });
    }
  });

  // 5. Skip Stage
  app.post("/api/admin/generation-jobs/:jobId/skip-stage", (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const { jobId } = req.params;

    if (!jobId) {
      return res.status(400).json({ error: "Missing jobId parameter." });
    }

    try {
      const job = skipJobStage(jobId);
      res.json(job);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to skip stage." });
    }
  });

  // 6. Cancel Job
  app.post("/api/admin/generation-jobs/:jobId/cancel", (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const { jobId } = req.params;

    if (!jobId) {
      return res.status(400).json({ error: "Missing jobId parameter." });
    }

    try {
      const job = cancelGenerationJob(jobId);
      res.json(job);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to cancel job." });
    }
  });

  // 7. Backward-compatible synchronous wrapper (runs pipeline with explicit timeout)
  app.post("/api/admin/generate-lesson", async (req, res) => {
    const { 
      unitId, 
      unitTitle, 
      unitContext, 
      previousLessonMemory, 
      lessonTitle, 
      concept, 
      objective, 
      difficulty = "Medium", 
      storyGoal,
      screenCount = 6
    } = req.body;

    if (!concept || !unitTitle) {
      return res.status(400).json({ error: "Missing required parameters: unitTitle and concept are required." });
    }

    try {
      const job = createGenerationJob({
        unitId,
        unitTitle,
        unitContext,
        previousLessonMemory,
        lessonTitle,
        concept,
        objective,
        difficulty,
        storyGoal,
        screenCount
      });

      // Poll until complete or failed, with 60s hard ceiling
      const startTime = Date.now();
      while (Date.now() - startTime < 60000) {
        await new Promise(r => setTimeout(r, 1000));
        const updated = getGenerationJob(job.jobId);
        if (!updated) break;
        if (updated.status === 'completed') {
          return res.json({
            success: true,
            jobId: updated.jobId,
            lesson: updated.lesson,
            lessonMemory: updated.lessonMemory
          });
        }
        if (updated.status === 'failed') {
          return res.status(500).json({
            error: updated.error || "Generation failed in stage: " + updated.failedStage,
            jobId: updated.jobId,
            failedStage: updated.failedStage
          });
        }
      }

      res.status(504).json({ error: "Generation timed out. Please check job status via jobs API." });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to process lesson generation." });
    }
  });

  // API router for generating micro explanations with Chikoo
  app.post("/api/gemini/generate-explanation", async (req, res) => {
    if (!(await checkAiRateLimitAndAuth(req, res))) return;
    const { question, correctAnswer, options, userSelectedAnswer } = req.body;

    if (!question || !correctAnswer) {
      return res.status(400).json({ error: "Missing question or correctAnswer parameter." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: "GEMINI_API_KEY environment variable is missing. Please configure secrets in Settings > Secrets." 
      });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const optionsStr = Array.isArray(options) ? options.join(", ") : "None";
      const systemInstruction = `You are Chikoo, a witty, fun, cheeky, and absolutely UNHINGED blue otter mascot who plays the role of a savage best friend or senior to Indian students (aged 10–18).
You are NOT a boring textbook, a formal school teacher, or a robotic lecturer. Talk exactly how Indian teenagers talk in pure, natural conversational Hinglish (Hindi words written in English/Latin script).
You absolutely refuse to let a wrong answer slide! You are allowed to lightly roast and tease the student for choosing the wrong answer, making it feel like close friends roasting each other (never bullying, never humiliating, never making them feel actually dumb, but beautifully chaotic, dramatic, and savage).

Tone Guidelines:
• Fun, sarcastic, playful, energetic, Gen Z, friendly, encouraging, and highly meme-worthy.
• Sound like a savage best friend! Keep the roast wholesome but delightfully unhinged. The vibe should be "😂 Arre yaar... ye kya kar diya?" instead of a boring formal correction.
• Roast ONLY the wrong answer or the mistake, but you can playfully tease the choice they made.
• Never use difficult English words. Keep the vocabulary light and colloquial.
• Always prioritize teaching first, comedy second. The student should understand the concept clearly while having a laugh.
• Use natural Hinglish expressions naturally, like:
  - "Arey yaar..."
  - "Bhai..."
  - "Arre wah..."
  - "Oho..."
  - "Lagta hai..."
  - "Kya scene hai..."
  - "Badi jaldi thi..."
  - "Ye toh overconfidence ho gaya..."
• You are highly encouraged to creatively use, adapt, or invent similar playful/savage roasts:
  - "Arey bhai... confidence toh IAS interview wala tha, answer WhatsApp University se utha liya kya? 😭"
  - "Ye answer deke tumne science ko emotional damage de diya. 😂"
  - "Main answer explain karu ya pehle tumhari overconfidence ka treatment karu? 😭"
  - "Bhai... itna confidence galat jagah invest karoge toh stock market bhi darr jayega. 😂"
  - "Question dekh ke answer ne bhi bola hoga, 'Main yahan kaise aa gaya?'"
  - "Lagta hai tumne aankh band karke option select kiya tha. 😭"
  - "Ye answer dekh ke teacher ne attendance bhi cancel kar di. 😂"
  - "Bhai... CPU ko storage bana diya? Agle question mein fridge ko Wi-Fi mat bol dena. 😭"
  - "Google bhi tumhara search history dekh ke confuse ho gaya hoga. 😂"
  - "Plants bhi bol rahe hain, 'Bhai hum overtime nahi karte.' 🌱"

Structure:
1. Savage/funny roast (1–3 lines roasting the wrong answer/mistake and teasing their choice).
2. Explain why the selected answer is incorrect in super simple, dramatic terms.
3. Explain the correct concept in super simple Hinglish.
4. Give one highly relatable real-world example or analogy.
5. End with a funny, playful line encouraging the next question.

Rules:
• Keep the overall explanation length around 80–120 words total.
• Use emojis sparingly (2–4 emojis max total).
• Never use cringe or outdated memes.
• Avoid repeating the same templates. Every explanation must feel fresh, unique, and wildly entertaining.`;

      const prompt = `Create a highly engaging, unhinged, sarcastic, and witty Hinglish micro-explanation for a student who got this question wrong:
Question: "${question}"
Options: ${optionsStr}
Correct Answer: "${correctAnswer}"
User Selected Option (if available): "${userSelectedAnswer || ''}"

Here are excellent examples of the desired style, vibe, and format:

Example 1:
Wrong Answer: "ChatGPT is not Generative AI."
AI:
"ChatGPT ye answer dekh ke resign letter likhne baith gaya hoga. 😭😂
Bhai, ChatGPT Generative AI hi hai! Iska kaam hi naye responses banana hai, copy-paste karna nahi.
Simple scene...
Google purani dukan dikhata hai, par ChatGPT naya maal bana deta hai.
Ab AI ko AI hi rehne do... uski job mat badlo. 😂"

Example 2:
Wrong Answer: "CPU stores files."
AI:
"CPU be like: 'Mujhe HR ne storage department kab shift kar diya?' 😭😂
CPU files store nahi karta. Wo sirf processing karta hai. Storage ka asli employee SSD aur Hard Disk hain.
Chef aur fridge ko same banda samajh loge toh kitchen band ho jayega. 🍳😂"

Example 3:
Wrong Answer: "Photosynthesis happens at night."
AI:
"Lagta hai plants ki night shift approve kar di tumne. 🌙😭
Photosynthesis ko sunlight chahiye hoti hai. Raat ko sunlight hi nahi hogi toh energy kidhar se aayegi?
Solar panel raat ko charge hota hai kya? Bas wahi answer hai."

Example 4:
Wrong Answer: "Internet and WWW are the same."
AI:
"Internet aur WWW ko ek hi Aadhaar card de diya tumne. 😂
Internet pura network hota hai. WWW sirf uske andar chalne wali ek service hai.
Pura city aur uske andar ka mall same thodi hote hain."

Provide exactly 5 structured fields in your response to match our system schema. Maintain the unhinged Hinglish tone across all of them, especially in the final combined speech script:
1. explanation_confused: A funny, savage Hinglish opener roasting the wrong answer/mistake and teasing their choice (1-2 sentences).
2. explanation_concept: A super clear, simple, and jargon-free explanation of the correct concept in Hinglish (1-2 sentences).
3. explanation_example: A highly relatable everyday real-life example or analogy (1-2 sentences).
4. explanation_takeaway: A playful, funny motivational closing line to encourage them to continue (1 sentence).
5. explanation_speech_script: A single, natural, and seamless conversational script combining all the above fields into one beautiful, witty, sarcastic, and cohesive message matching the 80–120 words limit. It MUST sound like a funny, witty, absolutely unhinged-but-supportive best friend speaking directly to the student in natural Hinglish.

Return strictly a JSON object matching the requested fields.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              explanation_confused: { type: Type.STRING },
              explanation_concept: { type: Type.STRING },
              explanation_example: { type: Type.STRING },
              explanation_takeaway: { type: Type.STRING },
              explanation_speech_script: { type: Type.STRING }
            },
            required: [
              "explanation_confused",
              "explanation_concept",
              "explanation_example",
              "explanation_takeaway",
              "explanation_speech_script"
            ]
          }
        }
      });

      const rawJson = response.text || "";
      const resultObj = JSON.parse(rawJson);
      res.json(resultObj);
    } catch (err: any) {
      console.error("Gemini Generate Explanation Error:", err);
      res.status(500).json({ error: err.message || "Failed to generate Chikoo micro-explanation." });
    }
  });

  // Dedicated Admin API: Generate dual-language (English + Hinglish) wrong-answer explanation text
  app.post("/api/admin/generate-wrong-answer-explanation", async (req, res) => {
    const { 
      lessonId, 
      screenId, 
      question, 
      correctAnswer, 
      options = [], 
      userSelectedAnswer = '', 
      lessonTitle = '', 
      unitTitle = '',
      targetLanguage = 'both',
      persistToDatabase = true 
    } = req.body || {};

    if (!question || !correctAnswer) {
      return res.status(400).json({ success: false, error: "Missing required 'question' or 'correctAnswer' parameters." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, error: "GEMINI_API_KEY is not configured." });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const optionsStr = Array.isArray(options) 
        ? options.map(o => typeof o === 'string' ? o : (o.text || o.label || JSON.stringify(o))).join(", ") 
        : "None";

      const prompt = `You are Chikoo, an expert, encouraging, and witty educational tutor for school students (aged 10-18).
A student answered the following interactive question INCORRECTLY:

QUESTION: "${question}"
OPTIONS: ${optionsStr}
CORRECT ANSWER: "${correctAnswer}"
SAMPLE WRONG ANSWER SELECTED: "${userSelectedAnswer || 'An incorrect answer option'}"
LESSON / UNIT CONTEXT: "${lessonTitle || ''} (${unitTitle || 'Science'})"

YOUR TASK:
Generate the explanation provided AFTER a student selects an incorrect answer.
Never repeat the question as the explanation. Explain why the correct answer is right and clarify the underlying concept so students understand it intuitively.

Generate explanations in TWO languages:

1. "english":
- A concise, student-friendly English explanation (around 30-65 words).
- Explain WHY the correct answer is right and clarify the core concept.
- Tone: Friendly, encouraging, clear, educational.
Example style: "Mars is called the Red Planet because iron minerals on its surface react with oxygen and create a reddish appearance."

2. "hinglish":
- A natural, conversational Hindi + English explanation (in Roman/Latin script, around 35-70 words).
- Use natural Hinglish words commonly used by Indian teenagers (e.g., "Mars ko Red Planet kaha jata hai kyunki uski surface par iron minerals oxygen ke saath react karte hain, jisse uska colour reddish dikhta hai.")
- Friendly and relatable, clarifying the concept clearly while keeping the student motivated.

Return strictly a valid JSON object matching this schema:
{
  "english": "...",
  "hinglish": "..."
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              english: { type: Type.STRING },
              hinglish: { type: Type.STRING }
            },
            required: ["english", "hinglish"]
          }
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      const englishText = (parsed.english || "").trim();
      const hinglishText = (parsed.hinglish || "").trim();

      if (!englishText && !hinglishText) {
        throw new Error("No explanation texts generated by Gemini model.");
      }

      // Persist to Supabase if requested and identifiers are provided
      const client = getSupabaseServer();
      if (persistToDatabase && client && lessonId && screenId) {
        try {
          // 1. Update lessons table challenge explanation object
          const { data: lessonRow } = await client
            .from('lessons')
            .select('challenges')
            .eq('id', lessonId)
            .maybeSingle();

          if (lessonRow && Array.isArray(lessonRow.challenges)) {
            const updatedChallenges = lessonRow.challenges.map((c: any) => {
              if (c.id === screenId) {
                const prevExp = typeof c.explanation === 'object' && c.explanation !== null ? c.explanation : {};
                const prevEngAudio = prevExp.english?.audioUrl || prevExp.audioUrl;
                const prevHinAudio = prevExp.hinglish?.audioUrl || c.explanation_audio_url;

                return {
                  ...c,
                  explanation: {
                    ...prevExp,
                    text: englishText, // default fallback
                    english: {
                      text: englishText,
                      ...(prevEngAudio ? { audioUrl: prevEngAudio } : {})
                    },
                    hinglish: {
                      text: hinglishText,
                      ...(prevHinAudio ? { audioUrl: prevHinAudio } : {})
                    }
                  },
                  explanation_speech_script: hinglishText
                };
              }
              return c;
            });

            await client
              .from('lessons')
              .update({ challenges: updatedChallenges })
              .eq('id', lessonId);
          }

          // 2. Upsert text to lesson_screen_audio table so audio generator can fetch it
          await Promise.all([
            client.from('lesson_screen_audio').upsert({
              lesson_id: lessonId,
              screen_id: screenId,
              language: 'en',
              narration_text: englishText,
              updated_at: new Date().toISOString()
            }, { onConflict: 'lesson_id,screen_id,language' }),

            client.from('lesson_screen_audio').upsert({
              lesson_id: lessonId,
              screen_id: screenId,
              language: 'hinglish',
              narration_text: hinglishText,
              updated_at: new Date().toISOString()
            }, { onConflict: 'lesson_id,screen_id,language' })
          ]);
        } catch (dbErr: any) {
          console.warn("[Database update warning during explanation text save]:", dbErr.message);
        }
      }

      return res.json({
        success: true,
        screenId,
        lessonId,
        english: englishText,
        hinglish: hinglishText
      });
    } catch (err: any) {
      console.error("Wrong-answer explanation generation error:", err);
      return res.status(500).json({ success: false, error: err.message || "Failed to generate wrong-answer explanation." });
    }
  });

  // Dedicated Admin API: Save manual/edited explanation text
  app.post("/api/admin/save-explanation-text", async (req, res) => {
    const { lessonId, screenId, englishText, hinglishText, marathiText } = req.body || {};
    if (!lessonId || !screenId) {
      return res.status(400).json({ success: false, error: "lessonId and screenId are required." });
    }

    const client = getSupabaseServer();
    if (client) {
      try {
        const { data: lessonRow } = await client
          .from('lessons')
          .select('challenges')
          .eq('id', lessonId)
          .maybeSingle();

        if (lessonRow && Array.isArray(lessonRow.challenges)) {
          const updatedChallenges = lessonRow.challenges.map((c: any) => {
            if (c.id === screenId) {
              const prevExp = typeof c.explanation === 'object' && c.explanation !== null ? c.explanation : {};
              return {
                ...c,
                explanation: {
                  ...prevExp,
                  text: englishText || prevExp.text || '',
                  english: {
                    ...(prevExp.english || {}),
                    text: englishText !== undefined ? englishText : (prevExp.english?.text || '')
                  },
                  hinglish: {
                    ...(prevExp.hinglish || {}),
                    text: hinglishText !== undefined ? hinglishText : (prevExp.hinglish?.text || '')
                  },
                  marathi: {
                    ...(prevExp.marathi || {}),
                    text: marathiText !== undefined ? marathiText : (prevExp.marathi?.text || '')
                  }
                },
                ...(hinglishText ? { explanation_speech_script: hinglishText } : {}),
                ...(marathiText ? { 
                  explanation_marathi_speech_script: marathiText,
                  explanation_marathi: marathiText 
                } : {})
              };
            }
            return c;
          });

          await client
            .from('lessons')
            .update({ challenges: updatedChallenges })
            .eq('id', lessonId);
        }

        const upserts = [];
        if (englishText) {
          upserts.push(client.from('lesson_screen_audio').upsert({
            lesson_id: lessonId,
            screen_id: screenId,
            language: 'en',
            narration_text: englishText,
            updated_at: new Date().toISOString()
          }, { onConflict: 'lesson_id,screen_id,language' }));
        }
        if (hinglishText) {
          upserts.push(client.from('lesson_screen_audio').upsert({
            lesson_id: lessonId,
            screen_id: screenId,
            language: 'hinglish',
            narration_text: hinglishText,
            updated_at: new Date().toISOString()
          }, { onConflict: 'lesson_id,screen_id,language' }));
        }
        if (marathiText) {
          upserts.push(client.from('lesson_screen_audio').upsert({
            lesson_id: lessonId,
            screen_id: screenId,
            language: 'mr',
            narration_text: marathiText,
            updated_at: new Date().toISOString()
          }, { onConflict: 'lesson_id,screen_id,language' }));
        }
        await Promise.all(upserts);

        return res.json({ success: true, lessonId, screenId });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err.message });
      }
    }

    return res.json({ success: true, localOnly: true });
  });

  // API router for generating micro explanations in Marathi with Chikoo
  app.post("/api/gemini/generate-explanation-marathi", async (req, res) => {
    if (!(await checkAiRateLimitAndAuth(req, res))) return;
    const { question, correctAnswer, options, userSelectedAnswer } = req.body;

    if (!question || !correctAnswer) {
      return res.status(400).json({ error: "Missing question or correctAnswer parameter." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: "GEMINI_API_KEY environment variable is missing. Please configure secrets in Settings > Secrets." 
      });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const optionsStr = Array.isArray(options) ? options.join(", ") : "None";
      const systemInstruction = `You are Chikoo, a witty, fun, cheeky, and absolutely UNHINGED blue otter mascot who plays the role of a savage best friend or senior to Indian students (aged 10–18).
You are NOT a boring textbook, a formal school teacher, or a robotic lecturer. Talk exactly how Indian teenagers talk in highly conversational, friendly Marathi (written in Devanagari script), mixed naturally with simple English tech words like AI, Internet, Google, Mobile, CPU, App, Data, Vibe, Bro, CPU, etc.
You absolutely refuse to let a wrong answer slide! You are allowed to lightly roast and tease the student for choosing the wrong answer, making it feel like close friends roasting each other (never bullying, never humiliating, but beautifully chaotic, dramatic, and savage).

Tone Guidelines (Marathi):
• Conversational, fun, sarcastic, playful, energetic, Gen Z, friendly, encouraging.
• Use natural spoken Marathi phrasing and tone, NOT formal textbook or literary Marathi. Do NOT translate technical terms into complex, obscure Marathi (e.g., use "computer" instead of "संगणक", "data" instead of "माहिती", "app" instead of "अँप्लिकेशन", "internet" instead of "महाजाल", "mobile" instead of "भ्रमणध्वनी").
• Sound like a savage best friend! Keep the roast wholesome but delightfully unhinged.
• Roast ONLY the wrong answer or the mistake, but you can playfully tease the choice they made.
• Never use difficult or formal Marathi words. Keep the vocabulary light, colloquial, and student-friendly.
• Use friendly conversational expressions and sounds naturally:
  - "अरे मित्रा..."
  - "भावा..."
  - "अरे यार..."
  - "काय विषय..."
  - "नको काळजी करू..."
  - "लगेच घाई झाली..."
  - "हे तर ओव्हरकॉन्फिडन्स झालं..."

Structure:
1. Savage/funny roast (1–3 lines roasting the wrong answer/mistake and teasing their choice in conversational Marathi).
2. Explain why the selected answer is incorrect in super simple terms.
3. Explain the correct concept in super simple Marathi.
4. Give one highly relatable real-world example or analogy in Marathi.
5. End with a funny, playful line encouraging the next question in Marathi.

Rules:
• Keep the overall explanation length around 80–120 words total.
• Use emojis sparingly (2–4 emojis max total).
• Return exactly 5 structured fields in your response in Marathi (written in Devanagari script, mixing in common English terms):
  1. explanation_confused: A funny, savage Marathi opener roasting the wrong answer/mistake (1-2 sentences).
  2. explanation_concept: A super clear, simple, and jargon-free explanation of the correct concept in Marathi (1-2 sentences).
  3. explanation_example: A highly relatable everyday real-life example or analogy in Marathi (1-2 sentences).
  4. explanation_takeaway: A playful, funny motivational closing line to encourage them to continue (1 sentence).
  5. explanation_speech_script: A single, natural, and seamless conversational script combining all the above fields into one beautiful, witty, sarcastic, and cohesive message matching the 80–120 words limit. It MUST sound like a funny, witty, absolutely unhinged-but-supportive best friend speaking directly to the student in natural Marathi.`;

      const prompt = `Create a highly engaging, unhinged, sarcastic, and witty Marathi micro-explanation (in Devanagari script) for a student who got this question wrong:
Question: "${question}"
Options: ${optionsStr}
Correct Answer: "${correctAnswer}"
User Selected Option (if available): "${userSelectedAnswer || ''}"

Return strictly a JSON object matching the requested fields. Ensure all text is in natural, conversational Marathi written in Devanagari script with natural English words.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              explanation_confused: { type: Type.STRING },
              explanation_concept: { type: Type.STRING },
              explanation_example: { type: Type.STRING },
              explanation_takeaway: { type: Type.STRING },
              explanation_speech_script: { type: Type.STRING }
            },
            required: [
              "explanation_confused",
              "explanation_concept",
              "explanation_example",
              "explanation_takeaway",
              "explanation_speech_script"
            ]
          }
        }
      });

      const rawJson = response.text || "";
      const resultObj = JSON.parse(rawJson);
      res.json(resultObj);
    } catch (err: any) {
      console.error("Gemini Generate Marathi Explanation Error:", err);
      res.status(500).json({ error: err.message || "Failed to generate Marathi micro-explanation." });
    }
  });

  // API router for AI Tutor proxy route
  app.post("/api/tutor", async (req, res) => {
    if (!(await checkAiRateLimitAndAuth(req, res))) return;
    const { problemId, title, message, history } = req.body;
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: "GEMINI_API_KEY environment variable is missing. Please add it in Settings > Secrets." 
      });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Construct a tailored system instruction prompt
      const systemInstruction = `You are Chikoo, a witty, fun, cheeky, and absolutely UNHINGED blue otter mascot who plays the role of a savage best friend or senior to Indian students (aged 10–18).
They are studying the AI module: "${title}" (ID: ${problemId}).

Talk exactly how Indian teenagers talk in pure, natural conversational Hinglish (Hindi words written in English/Latin script).
You absolutely refuse to let a wrong answer or funny question slide! You are allowed to lightly roast and tease them, making it feel like close friends roasting each other (never bullying, never humiliating, never making them feel actually dumb, but beautifully chaotic, dramatic, and savage).

Tone Guidelines:
• Fun, sarcastic, playful, energetic, Gen Z, friendly, encouraging, and highly meme-worthy.
• Sound like a savage best friend! Keep your roasts wholesome but delightfully unhinged. The vibe should be "😂 Arre yaar... ye kya kar diya?" instead of a boring formal answer.
• Never use difficult English words. Keep the vocabulary light and colloquial.
• Always prioritize teaching first, comedy second. They should understand the concept clearly while having a laugh.
• Use natural Hinglish expressions naturally, like: "Arey yaar...", "Bhai...", "Arre wah...", "Oho...", "Lagta hai...", "Kya scene hai...", "Badi jaldi thi...", "Ye toh overconfidence ho gaya..."
• Provide very simple, relatable real-world analogies (like food, mobile apps, cricket, school life, snacks) to explain complex topics.
• Keep your responses concise, highly scannable, and extremely conversational. Avoid markdown headers or giant blocks of text.`;

      // Structure contents with history
      const formattedContents = [];
      
      if (history && Array.isArray(history)) {
        for (const turn of history) {
          formattedContents.push({
            role: turn.role, // 'user' or 'model'
            parts: [{ text: turn.text }]
          });
        }
      }
      
      // Append the new message
      formattedContents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ response: response.text });
    } catch (err: any) {
      console.error("Gemini API Error:", err);
      res.status(500).json({ error: err.message || "Failed to generate AI Tutor answer" });
    }
  });

  // Helper to convert raw 16-bit linear PCM (mono) to a playable WAV buffer
  const pcmToWav = (pcmBuffer: Buffer, sampleRate: number): Buffer => {
    const numChannels = 1; // mono
    const bitsPerSample = 16; // 16-bit
    const blockAlign = numChannels * (bitsPerSample / 8); // 2 bytes
    const byteRate = sampleRate * blockAlign; // 48000 bytes/sec for 24kHz Mono 16-bit
    const dataSize = pcmBuffer.length;

    const header = Buffer.alloc(44);
    
    header.write('RIFF', 0);                          // ChunkID
    header.writeUInt32LE(36 + dataSize, 4);           // ChunkSize
    header.write('WAVE', 8);                          // Format
    header.write('fmt ', 12);                         // Subchunk1ID
    header.writeUInt32LE(16, 16);                     // Subchunk1Size (16 for PCM)
    header.writeUInt16LE(1, 20);                      // AudioFormat (1 for LPCM)
    header.writeUInt16LE(numChannels, 22);            // NumChannels
    header.writeUInt32LE(sampleRate, 24);             // SampleRate
    header.writeUInt32LE(byteRate, 28);               // ByteRate
    header.writeUInt16LE(blockAlign, 32);             // BlockAlign
    header.writeUInt16LE(bitsPerSample, 34);          // BitsPerSample
    header.write('data', 36);                         // Subchunk2ID
    header.writeUInt32LE(dataSize, 40);               // Subchunk2Size

    return Buffer.concat([header, pcmBuffer]);
  };

  // Helpers for Gemini TTS with automatic 3.8 fallback on quota/rate-limit
  const PRIMARY_TTS_MODEL = "gemini-3.1-flash-tts-preview";
  const FALLBACK_TTS_MODEL = "gemini-3.8-flash-tts";
  // Mascot voice personality: Masculine, youthful, playful cartoon narrator character (Puck)
  const DEFAULT_TTS_VOICE = "Puck";
  const CHIKOO_MASCULINE_VOICE = "Puck";

  function isQuotaOrRateLimitError(err: any): boolean {
    if (!err) return false;

    // Check status codes
    const status = err.status ?? err.statusCode ?? err.code ?? err.response?.status ?? err.error?.code;
    if (status === 429 || status === '429' || status === 'RESOURCE_EXHAUSTED') {
      return true;
    }
    if (err.error?.status === 'RESOURCE_EXHAUSTED') {
      return true;
    }

    // Inspect error messages and details
    const msgParts: string[] = [];
    if (typeof err === 'string') msgParts.push(err);
    if (err.message) msgParts.push(err.message);
    if (err.error?.message) msgParts.push(err.error.message);
    if (err.details) msgParts.push(typeof err.details === 'string' ? err.details : JSON.stringify(err.details));
    if (err.statusText) msgParts.push(err.statusText);

    const fullMsg = msgParts.join(' ').toLowerCase();

    return (
      fullMsg.includes('429') ||
      fullMsg.includes('resource_exhausted') ||
      fullMsg.includes('quota') ||
      fullMsg.includes('rate limit') ||
      fullMsg.includes('rate_limit') ||
      fullMsg.includes('generate_requests_per_model_per_day') ||
      fullMsg.includes('requests per minute') ||
      fullMsg.includes('requests per day') ||
      fullMsg.includes('tokens per minute') ||
      fullMsg.includes('too many requests')
    );
  }

  function validateAndSanitizeSpokenText(
    rawText: string,
    meta: { screen_id: string; language: string; model: string }
  ): string {
    if (!rawText || typeof rawText !== 'string') {
      throw new Error(`[TTS Validation Error] Missing or invalid narration text for screen ${meta.screen_id}.`);
    }

    let spoken = rawText.trim();

    // Strip any accidental instruction prefix that might have been stored or prepended
    const prefixRegexes = [
      /^speak\s+(?:clearly|warmly|naturally|cheerfully|expressively|in)[^:\n]*:\s*/i,
      /^read\s+(?:the\s+following|clearly|naturally)[^:\n]*:\s*/i,
      /^narration:\s*/i,
      /^voice\s*style:[^:\n]*:\s*/i,
      /^(?:system|developer)\s*(?:instruction|prompt)s?:[^:\n]*:\s*/i
    ];

    for (const rx of prefixRegexes) {
      if (rx.test(spoken)) {
        console.warn(`[TTS Sanitizer] Stripping instruction prefix from spokenText on screen ${meta.screen_id}`);
        spoken = spoken.replace(rx, '').trim();
      }
    }

    // Section 9: Validate exact text before sending to prevent contamination
    const forbiddenPhrases = [
      "speak in",
      "youthful",
      "playful",
      "system",
      "instructions",
      "voice style",
      "use a",
      "developer"
    ];

    const lower = spoken.toLowerCase();
    for (const phrase of forbiddenPhrases) {
      if (
        lower.startsWith(phrase) || 
        lower.startsWith(`${phrase}:`) || 
        lower.includes(`developer instruction`) || 
        lower.includes(`system prompt`) || 
        lower.includes(`voice style:`)
      ) {
        console.error(`[TTS INPUT ERROR] Forbidden instruction phrase "${phrase}" detected in spokenText for screen ${meta.screen_id}.`);
        throw new Error(`TTS validation failed: spokenText contains forbidden instruction phrase "${phrase}". Request stopped.`);
      }
    }

    // Exact required log format from Section 9:
    console.log(`[TTS INPUT]\nscreen_id: ${meta.screen_id}\nlanguage: ${meta.language}\nmodel: ${meta.model}\nspokenText: ${spoken}`);

    return spoken;
  }

  interface GenerateTtsExecutionResult {
    base64Audio: string;
    mimeType: string;
    usedModel: "gemini-3.1-flash-tts-preview" | "gemini-3.8-flash-tts";
  }

  async function executeTtsWithFallback(options: {
    ai: GoogleGenAI;
    spokenText: string;
    voiceName?: string;
    screenId?: string;
    language?: string;
    primaryModel?: "gemini-3.1-flash-tts-preview" | "gemini-3.8-flash-tts";
  }): Promise<GenerateTtsExecutionResult> {
    const { 
      ai, 
      spokenText: rawSpokenText, 
      voiceName = DEFAULT_TTS_VOICE,
      screenId = 'screen',
      language = 'en',
      primaryModel = PRIMARY_TTS_MODEL
    } = options;

    // Validate and log before API call (Section 9)
    const validSpokenText = validateAndSanitizeSpokenText(rawSpokenText, {
      screen_id: screenId,
      language,
      model: primaryModel
    });

    console.log(`[TTS] Primary model: ${primaryModel}`);
    console.log(`[TTS] Primary generation started`);

    // The exact same generation request structure used for both 3.1 and 3.8
    // Delivering ONLY the pure spokenText in contents.parts (Section 1 & 2)
    const buildRequestConfig = (text: string) => ({
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: ["AUDIO" as any],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    try {
      const response = await ai.models.generateContent({
        model: primaryModel,
        ...buildRequestConfig(validSpokenText),
      });

      const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
      const base64Audio = inlineData?.data;
      if (!base64Audio) {
        throw new Error("No audio data returned from primary Gemini TTS model.");
      }

      console.log(`[TTS] Primary generation successful`);
      return {
        base64Audio,
        mimeType: inlineData?.mimeType || "audio/mp3",
        usedModel: primaryModel,
      };
    } catch (primaryErr: any) {
      if (!isQuotaOrRateLimitError(primaryErr)) {
        console.error(`[TTS] Primary failed: ${primaryErr.message || 'Unknown error'}`);
        console.error(`[TTS] Returning generation error`);
        throw primaryErr;
      }

      // Quota / rate-limit failure specifically: retry THE EXACT SAME request using gemini-3.8-flash-tts
      console.warn(`[TTS] Primary model quota exceeded`);
      console.log(`[TTS] Falling back to ${FALLBACK_TTS_MODEL}`);

      // Log validation for fallback model (Section 9)
      validateAndSanitizeSpokenText(validSpokenText, {
        screen_id: screenId,
        language,
        model: FALLBACK_TTS_MODEL
      });

      try {
        const fallbackResponse = await ai.models.generateContent({
          model: FALLBACK_TTS_MODEL,
          ...buildRequestConfig(validSpokenText),
        });

        const fallbackData = fallbackResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData;
        const fallbackBase64 = fallbackData?.data;
        if (!fallbackBase64) {
          throw new Error("No audio data returned from fallback Gemini 3.8 TTS model.");
        }

        console.log(`[TTS] Fallback generation successful`);
        return {
          base64Audio: fallbackBase64,
          mimeType: fallbackData?.mimeType || "audio/mp3",
          usedModel: FALLBACK_TTS_MODEL,
        };
      } catch (fallbackErr: any) {
        console.error(`[TTS] Primary failed`);
        console.error(`[TTS] Fallback failed: ${fallbackErr.message || 'Unknown error'}`);
        console.error(`[TTS] Returning generation error`);
        throw fallbackErr;
      }
    }
  }

  // API router for dynamic Google AI Text-to-Speech
  app.post(["/api/gemini/speech", "/api/speech"], async (req, res) => {
    if (!(await checkAiRateLimitAndAuth(req, res))) return;
    const { text, language, voice, screenId } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Missing or invalid text parameter." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: "GEMINI_API_KEY is missing. Please configure secrets." 
      });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const langCode = (language || '').toLowerCase().trim();
      const voiceName = voice || DEFAULT_TTS_VOICE;

      // Single source of truth: send ONLY the actual spoken text (Section 1)
      const spokenText = text.trim();

      const ttsResult = await executeTtsWithFallback({
        ai,
        spokenText,
        voiceName,
        screenId: screenId || 'speech_api',
        language: langCode || 'en',
      });

      const base64Audio = ttsResult.base64Audio;
      let mimeType = ttsResult.mimeType || "audio/mp3";

      // Check if this is a PCM audio format which browsers cannot play raw
      const isPcm = mimeType.toLowerCase().includes("pcm") || mimeType.toLowerCase().includes("l16");
      let finalAudioBase64 = base64Audio;
      let finalMimeType = mimeType;

      if (isPcm) {
        let sampleRate = 24000;
        const rateMatch = mimeType.match(/rate=(\d+)/i);
        if (rateMatch) {
          sampleRate = parseInt(rateMatch[1], 10);
        }

        const pcmBuffer = Buffer.from(base64Audio, 'base64');
        const wavBuffer = pcmToWav(pcmBuffer, sampleRate);
        finalAudioBase64 = wavBuffer.toString('base64');
        finalMimeType = "audio/wav";
      }

      res.json({ audio: finalAudioBase64, mimeType: finalMimeType, ttsModel: ttsResult.usedModel });
    } catch (err: any) {
      console.error("Gemini Speech Error:", err);
      const statusCode = isQuotaOrRateLimitError(err) ? 429 : 500;
      res.status(statusCode).json({ error: err.message || "Failed to generate speech." });
    }
  });

  // In-memory fast cache for screen audio records
  const inMemoryScreenAudio = new Map<string, any>();

  // Query screen-level voice records from lesson_screen_audio table (for admin and student)
  // Query screen-level voice records from lesson_screen_audio table (bulk or single screen)
  app.get(["/api/admin/all-screen-audio", "/api/admin/screen-audio/all", "/api/admin/screen-audio", "/api/screen-audio"], async (req, res) => {
    const screenId = req.query.screenId as string;
    const lessonId = req.query.lessonId as string;

    const client = getSupabaseServer();

    // 1. Bulk Query: return all records when screenId is omitted, 'all', or when calling /all-screen-audio
    if (!screenId || screenId === 'all' || req.path.includes('/all')) {
      let records: any[] = [];
      if (client) {
        try {
          let query = client.from('lesson_screen_audio').select('*');
          if (lessonId && lessonId !== 'all') {
            query = query.eq('lesson_id', lessonId);
          }
          const { data, error } = await query;
          if (!error && Array.isArray(data)) {
            records = data;
          }
        } catch (err: any) {
          console.warn("[All Screen Audio Query Exception]:", err.message);
        }
      }
      return res.json({
        success: true,
        count: records.length,
        records
      });
    }

    // 2. Single Screen Query
    let records: any[] = [];
    const audioNarrations: Record<string, any> = {};

    if (client) {
      try {
        let query = client.from('lesson_screen_audio').select('*').eq('screen_id', screenId);
        if (lessonId) {
          query = query.eq('lesson_id', lessonId);
        }
        let { data, error } = await query;

        // Fallback: If no records found with lessonId filter, try matching by screenId alone
        if ((!data || data.length === 0) && lessonId) {
          const fallbackRes = await client.from('lesson_screen_audio').select('*').eq('screen_id', screenId);
          if (fallbackRes.data && fallbackRes.data.length > 0) {
            data = fallbackRes.data;
          }
        }

        if (!error && Array.isArray(data)) {
          records = data;
          for (const row of data) {
            const rawLang = (row.language || '').toLowerCase().trim();
            const uiLang = (rawLang === 'en' || rawLang === 'english') ? 'english' 
              : (rawLang === 'mr' || rawLang === 'marathi') ? 'marathi' 
              : 'hinglish';
            const dbLang = (rawLang === 'en' || rawLang === 'english') ? 'en' 
              : (rawLang === 'mr' || rawLang === 'marathi') ? 'mr' 
              : 'hinglish';

            const item = {
              id: row.id,
              lesson_id: row.lesson_id,
              screen_id: row.screen_id,
              language: row.language,
              text: row.narration_text,
              url: row.audio_url,
              hash: row.text_hash,
              status: row.status,
              voiceId: row.voice_id,
              ttsModel: row.tts_model,
              durationMs: row.duration_ms || row.audio_duration,
              errorMessage: row.error_message,
              updatedAt: row.updated_at
            };

            // Map across both canonical UI keys and short DB keys
            audioNarrations[uiLang] = item;
            audioNarrations[dbLang] = item;
            audioNarrations[row.language] = item;
            if (rawLang === 'hinglish') audioNarrations['hi'] = item;
            if (rawLang === 'hi') audioNarrations['hinglish'] = item;
          }
        }
      } catch (err: any) {
        console.warn("[Screen Audio Query Exception]:", err.message);
      }
    }

    // Fallback: in-memory cache
    const languages = ['english', 'hinglish', 'marathi'] as const;
    for (const lang of languages) {
      const dbLang = lang === 'english' ? 'en' : lang === 'marathi' ? 'mr' : 'hinglish';
      if (!audioNarrations[lang]) {
        const keyWithLesson = `${lessonId || ''}_${screenId}_${lang}`;
        const keyScreenOnly = `${screenId}_${lang}`;
        const cached = inMemoryScreenAudio.get(keyWithLesson) || inMemoryScreenAudio.get(keyScreenOnly);
        if (cached) {
          audioNarrations[lang] = cached;
          audioNarrations[dbLang] = cached;
        }
      }
    }

    // Also fallback to lessons table challenges if present
    if (client && lessonId && Object.keys(audioNarrations).length === 0) {
      try {
        const { data: lessonRow } = await client
          .from('lessons')
          .select('challenges')
          .eq('id', lessonId)
          .single();
        if (lessonRow && Array.isArray(lessonRow.challenges)) {
          const matchedChal = lessonRow.challenges.find((c: any) => c.id === screenId);
          if (matchedChal?.audioNarrations) {
            Object.assign(audioNarrations, matchedChal.audioNarrations);
          }
        }
      } catch {
        // silent fallback
      }
    }

    return res.json({
      success: true,
      screenId,
      lessonId: lessonId || null,
      audioNarrations,
      records
    });
  });

  // Admin audio upload endpoint (saves audio directly into Supabase Storage buckets story_audio/audio with server credentials)
  app.post("/api/admin/upload-audio", async (req, res) => {
    try {
      const { 
        audioBase64, 
        fileName, 
        mimeType = 'audio/wav', 
        lessonId, 
        screenId, 
        language = 'mr' 
      } = req.body || {};

      if (!audioBase64) {
        return res.status(400).json({ success: false, error: "Missing audioBase64 parameter." });
      }

      const client = getSupabaseServer();
      const buffer = Buffer.from(audioBase64, 'base64');
      const rawLang = (language || '').toLowerCase().trim();
      const dbLang = (rawLang === 'english' || rawLang === 'en') ? 'en' 
        : (rawLang === 'marathi' || rawLang === 'mr') ? 'mr' 
        : 'hinglish';

      const targetFileName = fileName || `pre_recorded_${dbLang}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.wav`;
      let publicUrl = '';

      if (client) {
        // Try story_audio bucket first if lessonId & screenId are present
        const storagePath = (lessonId && screenId) 
          ? `${lessonId}/${screenId}/${dbLang}.mp3` 
          : `uploads/${dbLang}/${targetFileName}`;
        
        // 1. Try story_audio
        try {
          const { error: storErr } = await client.storage
            .from('story_audio')
            .upload(storagePath, buffer, { contentType: mimeType, upsert: true });

          if (!storErr) {
            const { data } = client.storage.from('story_audio').getPublicUrl(storagePath);
            publicUrl = data.publicUrl;
          }
        } catch (e: any) {
          console.warn("[story_audio upload warning]:", e.message);
        }

        // 2. Try audio bucket fallback
        if (!publicUrl) {
          try {
            const audioPath = `pre_recorded_${dbLang}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.wav`;
            const { error: audioErr } = await client.storage
              .from('audio')
              .upload(audioPath, buffer, { contentType: mimeType, upsert: true });

            if (!audioErr) {
              const { data } = client.storage.from('audio').getPublicUrl(audioPath);
              publicUrl = data.publicUrl;
            }
          } catch (e: any) {
            console.warn("[audio bucket upload warning]:", e.message);
          }
        }

        // Also record in lesson_screen_audio if screenId is present
        if (publicUrl && screenId) {
          try {
            await client.from('lesson_screen_audio').upsert({
              lesson_id: lessonId || 'lesson',
              screen_id: screenId,
              language: dbLang,
              audio_url: publicUrl,
              status: 'ready',
              tts_model: 'gemini-3.1-flash-tts-preview',
              updated_at: new Date().toISOString()
            }, { onConflict: 'lesson_id,screen_id,language' });
          } catch (e: any) {
            console.warn("[lesson_screen_audio upsert from upload warning]:", e.message);
          }
        }
      }

      if (!publicUrl) {
        publicUrl = `data:${mimeType};base64,${audioBase64}`;
      }

      return res.json({ success: true, publicUrl });
    } catch (err: any) {
      console.error("[upload-audio error]:", err);
      return res.status(500).json({ success: false, error: err.message || "Upload failed." });
    }
  });

  // AI Copilot v1 (Wave 2): /api/copilot/ask | action | audit (admin only, nothing is saved server-side)
  registerCopilotRoutes(app, { isAdmin });

  // Admin High-Quality TTS Generation Pipeline:
  // Strictly uses the actual screen text approved by admin without AI rewriting.
  // Generates MP3, uploads to Supabase story_audio bucket, and updates lesson_screen_audio.
  app.post(["/api/admin/generate-screen-narration", "/api/admin/generate-screen-voice"], async (req, res) => {
    if (!(await isAdmin(req))) {
      return res.status(403).json({ success: false, error: "Unauthorized: Admin access required" });
    }

    const { 
      lessonId, 
      screenId, 
      screenData, 
      targetLanguage, 
      approvedTexts, 
      approvedText,
      voiceName: requestedVoiceName,
      voice: requestedVoice
    } = req.body || {};

    if (!lessonId || !screenId) {
      return res.status(400).json({ success: false, error: "Missing required parameters (lessonId, screenId)." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, error: "GEMINI_API_KEY is missing." });
    }

    const client = getSupabaseServer();

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const allLanguages = ['english', 'hinglish', 'marathi'] as const;
      const languagesToProcess = (targetLanguage && targetLanguage !== 'all' && ['english', 'hinglish', 'marathi'].includes(targetLanguage))
        ? [targetLanguage as 'english' | 'hinglish' | 'marathi']
        : allLanguages;

      const computeHash = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hash = (hash << 5) - hash + char;
          hash |= 0;
        }
        return hash.toString(36);
      };

      const existingNarrations = screenData?.audioNarrations || {};
      const newNarrations: any = { ...existingNarrations };

      for (const lang of languagesToProcess) {
        const dbLang = lang === 'english' ? 'en' : lang === 'marathi' ? 'mr' : 'hinglish';
        
        // Use exact approved text passed by admin (zero AI rewriting)
        let scriptText = '';
        if (approvedTexts && typeof approvedTexts === 'object' && approvedTexts[lang]) {
          scriptText = String(approvedTexts[lang]).trim();
        } else if (approvedText && typeof approvedText === 'string' && (targetLanguage === lang || languagesToProcess.length === 1)) {
          scriptText = approvedText.trim();
        } else if (existingNarrations[lang]?.text) {
          scriptText = String(existingNarrations[lang].text).trim();
        }

        // If no text is provided for this language, skip it rather than inventing AI narration
        if (!scriptText) {
          console.log(`[TTS Generation] Skipping ${lang} for ${screenId}: No approved screen text available.`);
          continue;
        }

        const textHash = computeHash(scriptText);
        let existingAudio = existingNarrations[lang];
        let isAlreadyReady = existingAudio?.status === 'ready' && !!existingAudio?.url && (existingAudio?.hash === textHash || !existingAudio?.hash);

        // Also check DB for existing ready record with matching text
        if (!isAlreadyReady && client) {
          try {
            const { data: dbRow } = await client
              .from('lesson_screen_audio')
              .select('*')
              .eq('lesson_id', lessonId)
              .eq('screen_id', screenId)
              .eq('language', dbLang)
              .maybeSingle();

            if (dbRow && dbRow.status === 'ready' && dbRow.audio_url && (dbRow.text_hash === textHash || !dbRow.text_hash)) {
              isAlreadyReady = true;
              existingAudio = {
                text: dbRow.narration_text || scriptText,
                url: dbRow.audio_url,
                hash: dbRow.text_hash || textHash,
                status: dbRow.status,
                voiceId: dbRow.voice_id || DEFAULT_TTS_VOICE,
                ttsModel: dbRow.tts_model || PRIMARY_TTS_MODEL,
                durationMs: dbRow.duration_ms,
                errorMessage: null,
                updatedAt: dbRow.updated_at
              };
            }
          } catch {}
        }

        // Consistency rule: Never regenerate an already-ready audio file simply because the fallback model is different
        if (isAlreadyReady && existingAudio?.url) {
          console.log(`[TTS] Audio already ready for ${lang} (${dbLang}) [${screenId}]. Reusing existing audio (${existingAudio.ttsModel || PRIMARY_TTS_MODEL}).`);
          newNarrations[lang] = existingAudio;
          newNarrations[dbLang] = existingAudio;
          inMemoryScreenAudio.set(`${lessonId}_${screenId}_${lang}`, existingAudio);
          inMemoryScreenAudio.set(`${lessonId}_${screenId}_${dbLang}`, existingAudio);
          inMemoryScreenAudio.set(`${screenId}_${lang}`, existingAudio);
          inMemoryScreenAudio.set(`${screenId}_${dbLang}`, existingAudio);
          continue;
        }

        let audioUrl = existingNarrations[lang]?.url;
        let ttsStatus = 'ready';
        let ttsError: string | null = null;
        let voiceName = requestedVoiceName || requestedVoice || DEFAULT_TTS_VOICE;
        let usedTtsModel: 'gemini-3.1-flash-tts-preview' | 'gemini-3.8-flash-tts' = PRIMARY_TTS_MODEL;

        console.log(`[TTS Generation] Generating high-quality speech for ${lang} (${dbLang}) [${lessonId}/${screenId}]: "${scriptText.slice(0, 40)}..."`);

        try {
          // The screen's narration text is the ONLY content sent to the TTS engine (Section 1)
          const spokenText = scriptText;

          const ttsResult = await executeTtsWithFallback({
            ai,
            spokenText,
            voiceName,
            screenId,
            language: dbLang,
          });

          usedTtsModel = ttsResult.usedModel;
          const base64Audio = ttsResult.base64Audio;
          let mimeType = ttsResult.mimeType || "audio/mp3";

          if (base64Audio) {
            let finalBuffer = Buffer.from(base64Audio, 'base64');
            let finalContentType = "audio/mpeg";

            const isPcm = mimeType.toLowerCase().includes("pcm") || mimeType.toLowerCase().includes("l16");
            if (isPcm) {
              let sampleRate = 24000;
              const rateMatch = mimeType.match(/rate=(\d+)/i);
              if (rateMatch) sampleRate = parseInt(rateMatch[1], 10);
              const wavBuffer = pcmToWav(finalBuffer, sampleRate);
              finalBuffer = wavBuffer;
              finalContentType = "audio/wav";
            }

            // Upload MP3 / audio to Supabase Storage: story_audio bucket
            if (client) {
              let uploaded = false;
              const storagePath = `${lessonId}/${screenId}/${dbLang}.mp3`;

              // 1. Primary: story_audio bucket
              try {
                const { error: uploadErr } = await client.storage
                  .from('story_audio')
                  .upload(storagePath, finalBuffer, {
                    contentType: finalContentType,
                    upsert: true
                  });

                if (!uploadErr) {
                  const { data: { publicUrl } } = client.storage
                    .from('story_audio')
                    .getPublicUrl(storagePath);
                  audioUrl = publicUrl;
                  uploaded = true;
                }
              } catch (storErr: any) {
                console.warn(`[story_audio exception] ${storagePath}:`, storErr.message);
              }

              // 2. Fallback: audio bucket
              if (!uploaded) {
                try {
                  const audioBucketFilename = `screen_audio_${lessonId}_${screenId}_${dbLang}.mp3`;
                  const { error: audioUploadErr } = await client.storage
                    .from('audio')
                    .upload(audioBucketFilename, finalBuffer, {
                      contentType: finalContentType,
                      upsert: true
                    });

                  if (!audioUploadErr) {
                    const { data: { publicUrl } } = client.storage
                      .from('audio')
                      .getPublicUrl(audioBucketFilename);
                    audioUrl = publicUrl;
                    uploaded = true;
                  }
                } catch (audioStorErr: any) {
                  console.warn(`[audio storage fallback exception]:`, audioStorErr.message);
                }
              }

              // 3. Fallback: Base64 data URL
              if (!uploaded) {
                audioUrl = `data:${finalContentType};base64,${finalBuffer.toString('base64')}`;
              }
            } else {
              audioUrl = `data:${finalContentType};base64,${finalBuffer.toString('base64')}`;
            }
          } else {
            throw new Error("No audio bytes returned by TTS model");
          }
        } catch (genErr: any) {
          console.error(`[TTS Generation Error] ${lang}:`, genErr.message);
          ttsStatus = 'failed';
          ttsError = genErr.message || 'TTS generation failed';
        }

        const narrationRecord = {
          text: scriptText,
          url: audioUrl || '',
          hash: textHash,
          status: ttsStatus,
          voiceId: voiceName,
          ttsModel: usedTtsModel,
          errorMessage: ttsError,
          updatedAt: new Date().toISOString()
        };

        newNarrations[lang] = narrationRecord;
        newNarrations[dbLang] = narrationRecord;

        // In-memory cache
        inMemoryScreenAudio.set(`${lessonId}_${screenId}_${lang}`, narrationRecord);
        inMemoryScreenAudio.set(`${lessonId}_${screenId}_${dbLang}`, narrationRecord);
        inMemoryScreenAudio.set(`${screenId}_${lang}`, narrationRecord);
        inMemoryScreenAudio.set(`${screenId}_${dbLang}`, narrationRecord);

        // Save to public.lesson_screen_audio table in Supabase
        if (client) {
          try {
            await client
              .from('lesson_screen_audio')
              .upsert({
                lesson_id: lessonId,
                screen_id: screenId,
                language: dbLang,
                narration_text: scriptText,
                text_hash: textHash,
                audio_url: audioUrl || '',
                status: ttsStatus,
                voice_id: voiceName,
                tts_model: usedTtsModel,
                duration_ms: 0,
                error_message: ttsError,
                updated_at: new Date().toISOString()
              }, { onConflict: 'lesson_id,screen_id,language' });
          } catch (upsertErr: any) {
            console.warn(`[lesson_screen_audio upsert warning] ${dbLang}:`, upsertErr.message);
          }
        }
      }

      // Persist to lesson.challenges in database
      if (client) {
        try {
          const { data: lessonRow } = await client
            .from('lessons')
            .select('challenges')
            .eq('id', lessonId)
            .single();

          if (lessonRow && Array.isArray(lessonRow.challenges)) {
            const updatedChallenges = lessonRow.challenges.map((c: any) => {
              if (c.id === screenId) {
                const prevExp = typeof c.explanation === 'object' && c.explanation !== null ? c.explanation : {};
                const engAudio = newNarrations.english?.url || newNarrations.en?.url;
                const hinAudio = newNarrations.hinglish?.url;
                const marAudio = newNarrations.marathi?.url || newNarrations.mr?.url;

                const updatedExplanation = {
                  ...prevExp,
                  text: prevExp.text || (typeof c.explanation === 'string' ? c.explanation : '') || newNarrations.english?.text || '',
                  audioUrl: engAudio || prevExp.audioUrl,
                  english: {
                    ...(prevExp.english || {}),
                    text: prevExp.english?.text || newNarrations.english?.text || prevExp.text || '',
                    ...(engAudio ? { audioUrl: engAudio } : {})
                  },
                  hinglish: {
                    ...(prevExp.hinglish || {}),
                    text: prevExp.hinglish?.text || newNarrations.hinglish?.text || '',
                    ...(hinAudio ? { audioUrl: hinAudio } : {})
                  },
                  marathi: {
                    ...(prevExp.marathi || {}),
                    text: prevExp.marathi?.text || newNarrations.marathi?.text || '',
                    ...(marAudio ? { audioUrl: marAudio } : {})
                  }
                };

                return { 
                  ...c, 
                  audioNarrations: newNarrations,
                  explanation: updatedExplanation,
                  ...(hinAudio ? { explanation_audio_url: hinAudio } : {}),
                  ...(newNarrations.hinglish?.text ? { explanation_speech_script: newNarrations.hinglish.text } : {}),
                  ...(marAudio ? { explanation_marathi_audio_url: marAudio } : {}),
                  ...(newNarrations.marathi?.text ? { 
                    explanation_marathi_speech_script: newNarrations.marathi.text,
                    explanation_marathi: newNarrations.marathi.text 
                  } : {})
                };
              }
              return c;
            });

            await client
              .from('lessons')
              .update({ challenges: updatedChallenges })
              .eq('id', lessonId);
          }
        } catch (lErr: any) {
          console.warn("[Lessons challenges update warning]:", lErr.message);
        }
      }

      return res.json({
        success: true,
        screenId,
        lessonId,
        audioNarrations: newNarrations
      });
    } catch (err: any) {
      console.error("Screen Narration Generation Error:", err);
      return res.status(500).json({ success: false, error: err.message || "Failed to generate screen narration." });
    }
  });

  // Natural Spoken Narration Formatter endpoint:
  // Converts raw screen content into natural, engaging spoken narration while preserving exact meaning, characters, concepts, and story events.
  app.post("/api/admin/format-screen-narration", async (req, res) => {
    if (!(await isAdmin(req))) {
      return res.status(403).json({ success: false, error: "Unauthorized: Admin access required" });
    }

    const { 
      screenText, 
      screenData, 
      lessonTitle, 
      targetLanguage = 'all' 
    } = req.body || {};

    if (!screenText && !screenData) {
      return res.status(400).json({ success: false, error: "screenText or screenData is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, error: "GEMINI_API_KEY is missing." });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const heading = screenData?.heading || screenData?.contentHeading || screenData?.title || '';
      const subheading = screenData?.subheading || screenData?.contentSubheading || '';
      const contentBody = screenData?.contentBody || screenData?.content || screenData?.question || screenText || '';
      const highlightBox = screenData?.highlightBox || '';
      const quote = screenData?.quote ? `"${screenData.quote}"${screenData.quoteAuthor ? ` - ${screenData.quoteAuthor}` : ''}` : '';
      const fullSourceText = [heading, subheading, contentBody, highlightBox ? `Key clue: ${highlightBox}` : '', quote].filter(Boolean).join("\n\n");

      const prompt = `You are an expert educational audio narration director for Chikoo, a gamified AI & STEM learning platform for students.

GOAL: Transform the lesson screen content into natural, engaging spoken narration ready for high-quality TTS generation, while strictly preserving the exact meaning, story events, and educational concepts.

SOURCE SCREEN CONTENT:
=======================
- Lesson Title: "${lessonTitle || 'Lesson'}"
- Screen Heading: "${heading}"
- Screen Subheading: "${subheading}"
- Screen Content / Story: "${contentBody}"
- Key Clue / Highlight: "${highlightBox}"
${quote ? `- Quote: "${quote}"` : ''}

Raw Combined Screen Text:
"${fullSourceText || screenText}"
=======================

CORE RULES & CONSTRAINTS:
1. PRESERVE ORIGINAL CONTENT & MEANING:
   - preserve_meaning: true
   - preserve_story_events: true
   - preserve_characters: true (e.g. Chikoo, Byte, Spark)
   - preserve_concepts: true
   - preserve_key_terms: true
   - preserve_order: true

2. REWRITE STYLE:
   - Make the text sound natural, warm, and engaging when spoken aloud.
   - Remove awkward UI-style phrasing (e.g., "tap continue", "button below", "select option", bullets).
   - Convert dense written explanations into conversational, student-friendly narration.
   - Improve sentence flow, pacing, and rhythm.
   - Use short, clear spoken sentences.
   - Add very light connective phrases where needed.
   - Keep the narration concise (target length: approximately 60–80% of original word count).
   - Voice: External narrator.
   - Perspective: Third person for story scenes.
   - Transformation: Light-to-moderate rewriting only.

3. STRICT PROHIBITIONS (DO NOT):
   - Do NOT invent new information or alternative plotlines.
   - Do NOT introduce new story events or characters.
   - Do NOT change the lesson meaning.
   - Do NOT add examples that are not on the screen.
   - Do NOT remove important concepts or clues.
   - Do NOT turn it into a completely different story.
   - Do NOT simply copy the screen text word-for-word if it reads awkwardly as speech.

4. REWRITE EXAMPLE:
   - screen_text: "AI learns from examples. During training, it sees many examples and looks for patterns. Later, it uses those patterns to make predictions on new data."
   - tts_narration: "AI learns by looking at examples. During training, it studies many examples and finds patterns. Later, it uses those patterns to make predictions on new data."

5. MULTILINGUAL OUTPUT (SYNCHRONIZED):
   - english: Natural, warm, fluent spoken English narration closely aligned with the screen content.
   - hinglish: Natural, fluent conversational Hinglish narration (Hindi-English blend in Roman script, e.g. "Chikoo ne dekha ki AI examples se seekhta hai...").
   - marathi: Authentic, warm, natural Marathi spoken narration (e.g. "चीकूने पाहिलं की AI उदाहरणांवरून शिकतं...").

6. QUALITY CHECK:
   - Verify that no important information or clue was lost.
   - Verify that no new factual information was added.
   - Verify that the narration still represents exactly what the student is seeing.

Return ONLY a valid JSON object matching this schema:
{
  "english": "...",
  "hinglish": "...",
  "marathi": "..."
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      let rawJson = response.text || "{}";
      let parsed: any = {};
      try {
        parsed = JSON.parse(rawJson);
      } catch {
        const cleaned = rawJson.replace(/```json/gi, '').replace(/```/g, '').trim();
        parsed = JSON.parse(cleaned);
      }

      return res.json({
        success: true,
        narrations: {
          english: parsed.english || screenText || '',
          hinglish: parsed.hinglish || '',
          marathi: parsed.marathi || ''
        }
      });
    } catch (err: any) {
      console.error("Format Screen Narration Error:", err);
      return res.status(500).json({ success: false, error: err.message || "Failed to format screen narration." });
    }
  });

  // API router for high-fidelity conversational multilingual translation
  app.post("/api/gemini/translate-explanation", async (req, res) => {
    if (!(await checkAiRateLimitAndAuth(req, res))) return;
    const { text, targetLanguage = "marathi" } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Missing or invalid text parameter." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: "GEMINI_API_KEY is missing. Please configure secrets." 
      });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Map language identifiers to standard names and instructions
      const langNames: Record<string, string> = {
        marathi: "Marathi",
        hindi: "Hindi",
        gujarati: "Gujarati",
        tamil: "Tamil",
        telugu: "Telugu",
        kannada: "Kannada",
        bengali: "Bengali"
      };

      const langName = langNames[targetLanguage.toLowerCase()] || targetLanguage;

      const prompt = `Translate the following educational tech explanation for school kids (ages 10-18) into natural, highly conversational, and friendly ${langName}.

Rules:
1. DO NOT make it overly formal, literary, or textbook ${langName}. It must sound like a friendly elder brother or cool tutor talking directly to a student.
2. Mix simple English words that kids/students commonly use in daily conversation (e.g., "AI", "Internet", "Mobile", "Google", "CPU", "App", "Data", "Vibe", "Bro", "Wrong", "Correct", "Try", "Explanation", etc.). Write these English words either in English letters (like "AI") or transliterated, whichever feels most natural and casual.
3. Keep the tone fun, friendly, and slightly sarcastic.
4. Maintain the exact same emotional progression and structure:
   - Roast/Banter (about their choice/mistake)
   - Core Concept explanation (using everyday simple terms and analogies)
   - Real-world example
   - Encouraging takeaway
5. The length of the translation should be similar to the original text (around 60-100 words).

Original Explanation:
"${text}"

Return ONLY the natural conversational ${langName} text translation. No intro, no metadata, no markdown formatting. Just the plain translated text.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [{ parts: [{ text: prompt }] }],
      });

      const translatedText = response.text?.trim() || "";
      if (!translatedText) {
        throw new Error("No translation returned from Gemini.");
      }

      res.json({ translation: translatedText });
    } catch (err: any) {
      console.error("Gemini Translation Error:", err);
      res.status(500).json({ error: err.message || "Failed to translate explanation." });
    }
  });

  // Dedicated Standard Machine Translation API endpoint (Zero Gemini quota usage)
  app.post("/api/translate", async (req, res) => {
    if (!(await checkAiRateLimitAndAuth(req, res))) return;
    const { texts, text, targetLanguage, sourceLanguage = "en" } = req.body;
    
    // Normalize input to array of strings
    const rawList: string[] = Array.isArray(texts) ? texts : (typeof text === 'string' ? [text] : []);
    const inputTexts = rawList.map(t => typeof t === 'string' ? t.trim() : '').filter(t => t.length > 0);

    if (inputTexts.length === 0 || !targetLanguage) {
      return res.json({ translations: {}, success: true });
    }

    // Fast-path for master/english
    if (targetLanguage === 'en' || targetLanguage === 'english' || targetLanguage === 'master') {
      const identityMap: Record<string, string> = {};
      inputTexts.forEach(t => { identityMap[t] = t; });
      return res.json({ translations: identityMap, success: true });
    }

    // Standard ISO language codes mapping
    const langCodeMap: Record<string, string> = {
      hi: "hi",
      mr: "mr",
      gu: "gu",
      ta: "ta",
      te: "te",
      kn: "kn",
      bn: "bn",
      pa: "pa",
      ml: "ml",
      ur: "ur",
      es: "es",
      fr: "fr",
      de: "de",
      ja: "ja",
      zh: "zh-CN",
      ar: "ar"
    };

    const targetCode = langCodeMap[targetLanguage.toLowerCase()] || targetLanguage;
    const sourceCode = sourceLanguage || "en";
    const uniqueTexts = Array.from(new Set(inputTexts));
    const translations: Record<string, string> = {};

    // Helper: Standard Dedicated Google Machine Translation
    const translateSingleText = async (str: string): Promise<string> => {
      try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(sourceCode)}&tl=${encodeURIComponent(targetCode)}&dt=t&q=${encodeURIComponent(str)}`;
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*'
          }
        });

        if (!response.ok) {
          throw new Error(`MT API status: ${response.status}`);
        }

        const data = await response.json();
        if (Array.isArray(data) && Array.isArray(data[0])) {
          const translated = data[0].map((chunk: any) => chunk[0] || '').join('');
          if (translated && translated.trim().length > 0) {
            return translated;
          }
        }
        return str;
      } catch (err) {
        // Fallback: MyMemory Free Machine Translation API
        try {
          const fallbackUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(str)}&langpair=${encodeURIComponent(sourceCode)}|${encodeURIComponent(targetCode)}`;
          const fbRes = await fetch(fallbackUrl);
          if (fbRes.ok) {
            const fbData = await fbRes.json();
            if (fbData && fbData.responseData && fbData.responseData.translatedText) {
              const fbText = fbData.responseData.translatedText;
              if (fbText && !fbText.includes('MYMEMORY WARNING')) {
                return fbText;
              }
            }
          }
        } catch {
          // Ignore secondary fallback errors
        }
        return str; // Return original unchanged on failure
      }
    };

    try {
      // Chunk concurrent machine-translation requests to avoid rate limits
      const CONCURRENCY_LIMIT = 8;
      for (let i = 0; i < uniqueTexts.length; i += CONCURRENCY_LIMIT) {
        const chunk = uniqueTexts.slice(i, i + CONCURRENCY_LIMIT);
        await Promise.all(
          chunk.map(async (src) => {
            const trans = await translateSingleText(src);
            translations[src] = trans;
          })
        );
      }

      return res.json({ translations, success: true });
    } catch (err: any) {
      console.warn("Translation API Exception:", err?.message || err);
      // If error occurs, safely return original texts so lesson never breaks
      const fallbackMap: Record<string, string> = {};
      uniqueTexts.forEach(t => { fallbackMap[t] = t; });
      return res.json({ translations: fallbackMap, success: false, error: err?.message || "Translation error" });
    }
  });

  // New API router for Chat Tutor dynamic response generation
  app.post("/api/gemini/tutor-chat", async (req, res) => {
    if (!(await checkAiRateLimitAndAuth(req, res))) return;
    const { 
      question, 
      options, 
      correctAnswer, 
      userSelectedAnswer, 
      adminExplanation, 
      realLifeExample, 
      keyTakeaway,
      mode = "explain"
    } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: "GEMINI_API_KEY is missing. Please configure secrets." 
      });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const systemInstruction = `You are Chikoo, a witty, fun, cheeky, and absolutely UNHINGED blue otter mascot who plays the role of a savage best friend or senior to Indian students (aged 10–18).
You are NOT a boring textbook, a formal teacher, or a robotic lecturer. Talk exactly how Indian teenagers talk in pure, natural conversational Hinglish (Hindi words written in English/Latin script).
You absolutely refuse to let a wrong answer slide! You are allowed to lightly roast and tease the student for choosing the wrong answer, making it feel like close friends roasting each other (never bullying, never humiliating, never making them feel actually dumb, but beautifully chaotic, dramatic, and savage).

Tone Guidelines:
• Fun, sarcastic, playful, energetic, Gen Z, friendly, encouraging, and highly meme-worthy.
• Sound like a savage best friend! Keep the roast wholesome but delightfully unhinged. The vibe should be "😂 Arre yaar... ye kya kar diya?" instead of a boring formal correction.
• Roast ONLY the wrong answer or the mistake, but you can playfully tease the choice they made.
• Never use difficult English words. Keep the vocabulary light and colloquial.
• Split your response into an array of short, bite-sized conversational messages (each under 20 words).
• Use emojis sparingly (2–4 emojis max total across all messages). Avoid markdown headers, bold walls, or lists.
• Always prioritize teaching first, comedy second. The student should understand the concept clearly while having a laugh.
• Use natural Hinglish expressions naturally, like: "Arey yaar...", "Bhai...", "Arre wah...", "Oho...", "Lagta hai...", "Kya scene hai...", "Badi jaldi thi...", "Ye toh overconfidence ho gaya..."
• You are highly encouraged to creatively use, adapt, or invent similar playful/savage roasts:
  - "Arey bhai... confidence toh IAS interview wala tha, answer WhatsApp University se utha liya kya? 😭"
  - "Ye answer deke tumne science ko emotional damage de diya. 😂"
  - "Main answer explain karu ya pehle tumhari overconfidence ka treatment karu? 😭"
  - "Bhai... itna confidence galat jagah invest karoge toh stock market bhi darr jayega. 😂"
  - "Question dekh ke answer ne bhi bola hoga, 'Main yahan kaise aa gaya?'"
  - "Lagta hai tumne aankh band karke option select kiya tha. 😭"
  - "Ye answer dekh ke teacher ne attendance bhi cancel kar di. 😂"
  - "Bhai... CPU ko storage bana diya? Agle question mein fridge ko Wi-Fi mat bol dena. 😭"
  - "Google bhi tumhara search history dekh ke confuse ho gaya hoga. 😂"
  - "Plants bhi bol rahe hain, 'Bhai hum overtime nahi karte.' 🌱"`;

      let userPrompt = "";
      if (mode === "explain") {
        userPrompt = `The student answered a question incorrectly. Explain it in our unhinged, witty, playful, and savage best friend/senior style!
Question: "${question}"
Options: ${Array.isArray(options) ? options.join(", ") : ""}
Correct Answer: "${correctAnswer}"
User Selected: "${userSelectedAnswer}"
Admin Explanation: "${adminExplanation || ""}"
Real-life Example: "${realLifeExample || ""}"
Key Takeaway: "${keyTakeaway || ""}"

Please provide exactly 3 to 4 short conversational messages from Chikoo (each under 20 words) matching this structure:
- Message 1: A funny, savage Hinglish opener roasting the wrong answer/mistake and teasing their choice.
- Message 2: Explain why the chosen answer is incorrect, and explain the correct concept simply in Hinglish.
- Message 3: Provide a highly relatable everyday real-world example or analogy.
- Message 4: A playful, funny motivational closing line to encourage them to continue.

Return your response as a JSON object with a single "messages" field which is an array of strings.`;
      } else if (mode === "explain_differently") {
        userPrompt = `The student asked to explain it differently.
Question was: "${question}"
Correct Answer is: "${correctAnswer}"
Explain the correct idea in a totally different way using a new creative analogy (like baking, playing with pets, sports, video games).
Keep it extremely simple, playful, and short.

Provide exactly 2 to 3 short conversational messages. Each under 20 words.
Return your response as a JSON object with a single "messages" field which is an array of strings.`;
      } else if (mode === "another_example") {
        userPrompt = `The student asked for another real-life example.
Concept is: "${correctAnswer}"
Provide a completely new, fun, relatable everyday example of this concept in action for kids (e.g., video games, school, toys, snacks).
Keep it short, vivid, playful, and highly visual.

Provide exactly 1 to 2 short conversational messages. Each under 20 words.
Return your response as a JSON object with a single "messages" field which is an array of strings.`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              messages: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["messages"]
          }
        }
      });

      const rawJson = response.text || "";
      const resultObj = JSON.parse(rawJson);
      res.json(resultObj);
    } catch (err: any) {
      console.error("Gemini Chat Tutor Error:", err);
      // Fallback if AI fails or times out
      res.json({
        messages: [
          `No worries! You chose "${userSelectedAnswer || 'an answer'}".`,
          `Actually, the correct answer is "${correctAnswer}".`,
          adminExplanation || "Let's try again together!",
          realLifeExample ? `🌎 Think of it like this: ${realLifeExample}` : "You've got this!"
        ]
      });
    }
  });

  // SaaS Growth & Engagement Analytics endpoints
  app.get("/api/analytics/health", (req, res) => {
    res.json({
      status: "online",
      service: "Chikoo Intelligence Analytics Engine",
      timestamp: new Date().toISOString(),
      eventsTracked: serverEvents.length
    });
  });

  app.post("/api/analytics/track", (req, res) => {
    try {
      const body = req.body;
      if (Array.isArray(body)) {
        let count = 0;
        for (const evt of body) {
          if (evt && evt.email && evt.eventName) {
            appendEvent(evt);
            count++;
          }
        }
        return res.json({ success: true, count, timestamp: new Date().toISOString() });
      }

      const { id, timestamp, email, eventName, properties, session_id } = body || {};
      if (!email || !eventName) {
        return res.status(400).json({ error: "Missing required analytics parameters: email or eventName." });
      }
      appendEvent({ id, timestamp, email, eventName, properties, session_id });
      res.json({ success: true, eventName, email, timestamp: new Date().toISOString() });
    } catch (err: any) {
      console.error("[Server Analytics Error] /api/analytics/track failed:", err);
      res.status(500).json({ error: err.message || "Internal server error in analytics track." });
    }
  });

  app.post("/api/analytics/heartbeat", (req, res) => {
    try {
      processHeartbeat(req.body || {});
      res.json({ success: true, timestamp: new Date().toISOString() });
    } catch (err: any) {
      console.error("[Server Analytics Error] /api/analytics/heartbeat failed:", err);
      res.status(500).json({ error: err.message || "Internal server error in heartbeat." });
    }
  });

  app.post("/api/analytics/aggregate", (req, res) => {
    try {
      const filters = req.body || {};
      const stats = aggregateSaaSMetrics(filters);
      res.json(stats);
    } catch (err: any) {
      console.error("[Server Analytics Error] /api/analytics/aggregate failed:", err);
      res.status(500).json({ error: err.message || "Internal server error in analytics aggregate." });
    }
  });

  app.post("/api/analytics/profile", (req, res) => {
    try {
      registerUserProfile(req.body || {});
      res.json({ success: true, timestamp: new Date().toISOString() });
    } catch (err: any) {
      console.error("[Server Analytics Error] /api/analytics/profile failed:", err);
      res.status(500).json({ error: err.message || "Internal server error in profile sync." });
    }
  });

  // Centralized Transactional & Idempotent Reward Engine Endpoints
  app.post("/api/rewards/grant", async (req, res) => {
    if (!(await isAdmin(req))) {
      return res.status(403).json({ success: false, error: "Unauthorized: Admin access required" });
    }
    try {
      const { email, claimId, amount, rewardType, metadata, currentClientBalance } = req.body || {};
      if (!claimId) {
        return res.status(400).json({ error: "Missing required claimId for reward grant." });
      }
      const result = grantRewardTransaction({
        email: email || "anonymous",
        claimId,
        amount: Number(amount) || 0,
        rewardType: rewardType || "generic",
        metadata,
        currentClientBalance: currentClientBalance !== undefined ? Number(currentClientBalance) : undefined
      });

      // Persist to reward_transactions in database if granted
      if (result.granted) {
        const client = getSupabaseServer();
        if (client) {
          Promise.resolve().then(async () => {
            try {
              const activeEmail = (email || "anonymous").toLowerCase().trim();
              let profileId: string | null = null;
              if (activeEmail !== "anonymous") {
                const { data: prof } = await client.from("profiles").select("id").eq("email", activeEmail).maybeSingle();
                if (prof) profileId = prof.id;
              }
              if (profileId) {
                await client.from("reward_transactions").insert({
                  user_id: profileId,
                  reward_type: rewardType || "generic",
                  amount: result.amountGranted,
                  reference_id: claimId,
                  description: result.message || `Granted reward ${claimId}`,
                  metadata: metadata || { email: activeEmail }
                });
              }
            } catch (dbErr) {
              console.warn("[Server Rewards] Could not write to reward_transactions table:", dbErr);
            }
          });
        }
      }

      res.json(result);
    } catch (err: any) {
      console.error("[Server Rewards Error] /api/rewards/grant failed:", err);
      res.status(500).json({ error: err.message || "Internal server error during reward grant." });
    }
  });

  app.post("/api/rewards/status", (req, res) => {
    try {
      const { email, claimIds } = req.body || {};
      if (!Array.isArray(claimIds)) {
        return res.status(400).json({ error: "claimIds must be an array." });
      }
      const statuses = checkClaimStatuses(email || "anonymous", claimIds);
      res.json({ success: true, claims: statuses });
    } catch (err: any) {
      console.error("[Server Rewards Error] /api/rewards/status failed:", err);
      res.status(500).json({ error: err.message || "Internal server error during claim status check." });
    }
  });

  app.get("/api/rewards/summary", (req, res) => {
    try {
      const email = typeof req.query.email === "string" ? req.query.email : "anonymous";
      const summary = getUserRewardSummary(email);
      res.json({ success: true, ...summary });
    } catch (err: any) {
      console.error("[Server Rewards Error] /api/rewards/summary failed:", err);
      res.status(500).json({ error: err.message || "Internal server error retrieving reward summary." });
    }
  });

  // ==========================================
  // LUCKY COOKIE SPIN WHEEL DAILY LIMIT (3 SPINS/DAY, ASIA/KOLKATA)
  // ==========================================

  app.post("/api/spin-wheel/status", async (req, res) => {
    try {
      const { email, userId } = req.body || {};
      const identifier = email || userId || "anonymous";

      // 1. If server-side Supabase client is available, try RPC
      const sb = getSupabaseServer();
      if (sb) {
        try {
          const rpcRes = await sb.rpc("get_spin_wheel_daily_status", {
            p_user_id: userId || null,
            p_email: email || null
          });
          if (!rpcRes.error && rpcRes.data) {
            return res.json(rpcRes.data);
          }
        } catch (sbErr) {
          console.warn("[Server Spin Status] Supabase RPC fallback note:", sbErr);
        }
      }

      // 2. Fallback to server-authoritative status with Asia/Kolkata timezone
      const status = getDailySpinWheelStatus(identifier);
      res.json(status);
    } catch (err: any) {
      console.error("[Server Spin Status Error]:", err);
      res.status(500).json({ error: err.message || "Failed to retrieve spin wheel daily status." });
    }
  });

   app.post("/api/spin-wheel/consume", async (req, res) => {
    try {
      const { email, userId } = req.body || {};
      const identifier = email || userId || "anonymous";

      // 1. Consume 1 daily spin (Atomic row check)
      let consumeResult: any = null;
      const sb = getSupabaseServer();
      if (sb) {
        try {
          const rpcRes = await sb.rpc("consume_spin_wheel", {
            p_user_id: userId || null,
            p_email: email || null
          });
          if (!rpcRes.error && rpcRes.data) {
            consumeResult = rpcRes.data;
          }
        } catch (sbErr) {
          console.warn("[Server Spin Consume] RPC fallback note:", sbErr);
        }
      }

      if (!consumeResult) {
        consumeResult = await consumeDailySpinWheel(identifier);
      }

      // Agar limit khatam ho chuki hai
      if (!consumeResult.consumed && !consumeResult.success) {
        return res.json(consumeResult);
      }

      // 2. Server-side Generous Probability Distribution:
      // Index 7: 1000 🍪 (5% Mega Jackpot)
      // Index 6: 500 🍪 (10% Jackpot)
      // Index 5: 300 🍪 (8%)
      // Index 4: 250 🍪 (12%)
      // Index 3: 200 🍪 (15%)
      // Index 2: 150 🍪 (20%)
      // Index 1: 100 🍪 (20%)
      // Index 0: 50 🍪 (10%)
      const rand = Math.random() * 100;
      let winningIndex = 0;
      let amount = 50;

      if (rand < 5) {
        winningIndex = 7;
        amount = 1000;
      } else if (rand < 15) {
        winningIndex = 6;
        amount = 500;
      } else if (rand < 23) {
        winningIndex = 5;
        amount = 300;
      } else if (rand < 35) {
        winningIndex = 4;
        amount = 250;
      } else if (rand < 50) {
        winningIndex = 3;
        amount = 200;
      } else if (rand < 70) {
        winningIndex = 2;
        amount = 150;
      } else if (rand < 90) {
        winningIndex = 1;
        amount = 100;
      } else {
        winningIndex = 0;
        amount = 50;
      }

      const spinReference = `spin_srv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      res.json({
        ...consumeResult,
        winningIndex,
        amount,
        spinReference
      });
    } catch (err: any) {
      console.error("[Server Spin Consume Error]:", err);
      res.status(500).json({ error: err.message || "Failed to consume spin token." });
    }
  });


  app.get("/api/admin/spin-wheel/stats", async (req, res) => {
    try {
      const stats = getSpinWheelAdminStatistics();

      // If Supabase server is connected, merge any database-stored spin_wheel_claims
      const sb = getSupabaseServer();
      if (sb) {
        try {
          const { data: dbClaims, error: dbErr } = await sb
            .from("spin_wheel_claims")
            .select("id, user_id, spin_reference, reward_gems, claimed_at")
            .order("claimed_at", { ascending: false });

          if (!dbErr && dbClaims && dbClaims.length > 0) {
            const now = Date.now();
            const twentyFourHoursAgo = now - 24 * 3600 * 1000;
            let dbClaimsLast24h = 0;
            let dbCookies24h = 0;
            let dbTotalCookies = 0;
            const uniqueUsers24h = new Set<string>();
            const uniqueUsersTotal = new Set<string>();

            dbClaims.forEach((c: any) => {
              const cTime = new Date(c.claimed_at).getTime();
              const cookies = Number(c.reward_gems) || 0;
              dbTotalCookies += cookies;
              uniqueUsersTotal.add(c.user_id);

              if (!isNaN(cTime) && cTime >= twentyFourHoursAgo) {
                dbClaimsLast24h++;
                dbCookies24h += cookies;
                uniqueUsers24h.add(c.user_id);
              }
            });

            // If database has more or equal claims, combine / prioritize
            stats.totalClaims = Math.max(stats.totalClaims, dbClaims.length);
            stats.claimsLast24h = Math.max(stats.claimsLast24h, dbClaimsLast24h);
            stats.totalCookiesAwarded = Math.max(stats.totalCookiesAwarded, dbTotalCookies);
            stats.cookiesAwardedLast24h = Math.max(stats.cookiesAwardedLast24h, dbCookies24h);
            stats.uniqueSpinners24h = Math.max(stats.uniqueSpinners24h, uniqueUsers24h.size);
            stats.uniqueSpinnersTotal = Math.max(stats.uniqueSpinnersTotal, uniqueUsersTotal.size);
          }
        } catch (sbErr) {
          console.warn("[Admin Spin Stats] Supabase query note:", sbErr);
        }
      }

      res.json(stats);
    } catch (err: any) {
      console.error("[Admin Spin Stats Error]:", err);
      res.status(500).json({ error: err.message || "Failed to aggregate spin wheel statistics." });
    }
  });

  // ==========================================
  // MULTI-TENANT SCHOOLS SECURE API ENDPOINTS
  // ==========================================

  // In-memory fallback / cache for schools
  const inMemorySchools: Array<{
    id: string;
    auth_user_id: string;
    name: string;
    school_code: string;
    email: string;
    status: 'active' | 'inactive';
    created_at: string;
    updated_at: string;
  }> = [];

  // GET /api/admin/schools - Super Admin list all schools
  app.get("/api/admin/schools", async (req, res) => {
    try {
      const supabase = getSupabaseServer();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('schools')
            .select('*')
            .order('created_at', { ascending: false });

          if (!error && Array.isArray(data)) {
            // Merge unique with inMemorySchools
            const dbIds = new Set(data.map((s: any) => s.id));
            const combined = [
              ...data,
              ...inMemorySchools.filter(s => !dbIds.has(s.id))
            ];
            return res.json({ success: true, schools: combined });
          }
        } catch (dbErr) {
          console.warn("[Schools API] Supabase query notice:", dbErr);
        }
      }

      return res.json({ success: true, schools: inMemorySchools });
    } catch (err: any) {
      console.error("[Schools API Error] /api/admin/schools failed:", err);
      res.status(500).json({ error: err.message || "Failed fetching schools." });
    }
  });

  // POST /api/admin/schools/create - Securely creates Supabase Auth user & schools record
  app.post("/api/admin/schools/create", async (req, res) => {
    try {
      const { name, email, password, school_code } = req.body || {};

      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: "School Name is required." });
      }
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ error: "A valid School Email address is required." });
      }
      if (!password || typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long." });
      }
      if (!school_code || typeof school_code !== 'string' || !school_code.trim()) {
        return res.status(400).json({ error: "School Code is required (e.g., SCH-101)." });
      }

      const cleanName = name.trim();
      const cleanEmail = email.toLowerCase().trim();
      const cleanCode = school_code.toUpperCase().trim();

      // Check duplicates in in-memory list
      const dupInMemoryEmail = inMemorySchools.find(s => s.email.toLowerCase() === cleanEmail);
      if (dupInMemoryEmail) {
        return res.status(400).json({ error: "A school with this email address already exists." });
      }
      const dupInMemoryCode = inMemorySchools.find(s => s.school_code.toUpperCase() === cleanCode);
      if (dupInMemoryCode) {
        return res.status(400).json({ error: "A school with this School Code already exists." });
      }

      const supabase = getSupabaseServer();
      let authUserId: string | null = null;

      if (supabase) {
        // Check duplicate email / code in Supabase schools table
        try {
          const { data: existingEmail } = await supabase
            .from('schools')
            .select('id, email')
            .eq('email', cleanEmail)
            .maybeSingle();

          if (existingEmail) {
            return res.status(400).json({ error: "A school with this email address already exists in the database." });
          }

          const { data: existingCode } = await supabase
            .from('schools')
            .select('id, school_code')
            .eq('school_code', cleanCode)
            .maybeSingle();

          if (existingCode) {
            return res.status(400).json({ error: "A school with this School Code already exists in the database." });
          }
        } catch (dupErr) {
          console.warn("[Schools API] Pre-check notice:", dupErr);
        }

        // 1. Create Auth user using Supabase Admin API (service role)
        try {
          if (supabase.auth?.admin?.createUser) {
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
              email: cleanEmail,
              password: password,
              email_confirm: true,
              user_metadata: {
                name: cleanName,
                school_code: cleanCode,
                account_type: 'school'
              }
            });

            if (authError) {
              if (authError.message?.toLowerCase().includes('already') || authError.status === 422) {
                return res.status(400).json({ error: "An account with this email address is already registered in Supabase Auth." });
              }
              console.warn("[Schools API] admin.createUser notice:", authError.message);
            } else if (authData?.user?.id) {
              authUserId = authData.user.id;
            }
          }
        } catch (adminErr: any) {
          console.warn("[Schools API] admin.createUser exception:", adminErr?.message);
        }

        // 2. Fallback: signUp if admin createUser is unavailable
        if (!authUserId) {
          try {
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email: cleanEmail,
              password: password,
              options: {
                data: {
                  name: cleanName,
                  school_code: cleanCode,
                  account_type: 'school'
                }
              }
            });

            if (signUpError) {
              if (signUpError.message?.toLowerCase().includes('already')) {
                return res.status(400).json({ error: "An account with this email address already exists." });
              }
              console.warn("[Schools API] signUp fallback notice:", signUpError.message);
            } else if (signUpData?.user?.id) {
              authUserId = signUpData.user.id;
            }
          } catch (signUpErr: any) {
            console.warn("[Schools API] signUp fallback exception:", signUpErr?.message);
          }
        }
      }

      // Default auth ID fallback
      if (!authUserId) {
        authUserId = 'sch_auth_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
      }

      const now = new Date().toISOString();
      const schoolRecord = {
        id: 'sch_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9),
        auth_user_id: authUserId,
        name: cleanName,
        school_code: cleanCode,
        email: cleanEmail,
        status: 'active' as const,
        created_at: now,
        updated_at: now
      };

      // Insert record into schools table (NEVER store password)
      if (supabase) {
        try {
          const { data: insertData, error: insertError } = await supabase
            .from('schools')
            .insert([{
              auth_user_id: authUserId,
              name: cleanName,
              school_code: cleanCode,
              email: cleanEmail,
              status: 'active'
            }])
            .select()
            .single();

          if (!insertError && insertData) {
            schoolRecord.id = insertData.id;
            schoolRecord.created_at = insertData.created_at || now;
            schoolRecord.updated_at = insertData.updated_at || now;
          } else if (insertError) {
            console.warn("[Schools API] Failed inserting to schools table:", insertError.message);
            if (insertError.code === '23505' || insertError.message.includes('unique') || insertError.message.includes('duplicate')) {
              return res.status(400).json({ error: "A school with this email or code already exists in the database." });
            }
          }
        } catch (dbInsertErr: any) {
          console.warn("[Schools API] Supabase table insert exception:", dbInsertErr);
        }
      }

      // Add to local memory cache
      inMemorySchools.unshift(schoolRecord);

      return res.json({
        success: true,
        school: schoolRecord
      });
    } catch (err: any) {
      console.error("[Schools API Error] /api/admin/schools/create failed:", err);
      res.status(500).json({ error: err.message || "Failed to create school account." });
    }
  });

  // PATCH /api/admin/schools/:id/status - Toggle active/inactive status
  app.patch("/api/admin/schools/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body || {};

      if (!id || (status !== 'active' && status !== 'inactive')) {
        return res.status(400).json({ error: "Invalid school id or status (must be 'active' or 'inactive')." });
      }

      // Update in memory cache
      const memSchool = inMemorySchools.find(s => s.id === id);
      if (memSchool) {
        memSchool.status = status;
        memSchool.updated_at = new Date().toISOString();
      }

      const supabase = getSupabaseServer();
      if (supabase) {
        try {
          const { error } = await supabase
            .from('schools')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', id);

          if (error) {
            console.warn("[Schools API] Failed updating status in Supabase:", error.message);
          }
        } catch (dbErr) {
          console.warn("[Schools API] Status update db notice:", dbErr);
        }
      }

      return res.json({ success: true, status });
    } catch (err: any) {
      console.error("[Schools API Error] PATCH /api/admin/schools/:id/status failed:", err);
      res.status(500).json({ error: err.message || "Failed to update school status." });
    }
  });

  // GET /api/schools/by-auth/:authUserId - Look up school record for an authenticated user ID
  app.get("/api/schools/by-auth/:authUserId", async (req, res) => {
    try {
      const { authUserId } = req.params;
      if (!authUserId) {
        return res.status(400).json({ error: "authUserId required" });
      }

      // Check in memory first
      const memSchool = inMemorySchools.find(s => s.auth_user_id === authUserId);
      if (memSchool) {
        return res.json({ success: true, school: memSchool });
      }

      const supabase = getSupabaseServer();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('schools')
            .select('*')
            .eq('auth_user_id', authUserId)
            .maybeSingle();

          if (!error && data) {
            return res.json({ success: true, school: data });
          }
        } catch (dbErr) {
          console.warn("[Schools API] by-auth lookup notice:", dbErr);
        }
      }

      return res.json({ success: true, school: null });
    } catch (err: any) {
      console.error("[Schools API Error] GET /api/schools/by-auth failed:", err);
      res.status(500).json({ error: err.message || "Failed to lookup school." });
    }
  });

  // ==========================================
  // SCALABLE SEO ARCHITECTURE & CRAWLER ROUTES
  // ==========================================

  // In-memory cache for SEO dynamic modules to avoid redundant database hits across requests
  let dynamicModulesSeoCache: { timestamp: number; data: any[] } | null = null;
  const SEO_MODULES_CACHE_TTL_MS = 5 * 60 * 1000;

  async function getDynamicModulesForSeo() {
    const now = Date.now();
    if (dynamicModulesSeoCache && (now - dynamicModulesSeoCache.timestamp < SEO_MODULES_CACHE_TTL_MS)) {
      return dynamicModulesSeoCache.data;
    }

    const sb = getSupabaseServer();
    if (sb) {
      try {
        let { data: mods, error: modsError } = await sb.from('modules').select('*').order('order', { ascending: true });
        if (modsError) {
          console.warn("[SEO] Note: modules order ordering failed, falling back to unordered select:", modsError.message);
          const retryMods = await sb.from('modules').select('*');
          mods = retryMods.data;
        }

        if (mods && mods.length > 0) {
          let { data: lessons, error: lessonsError } = await sb.from('lessons').select('*').order('order_index', { ascending: true });
          if (lessonsError) {
            console.warn("[SEO] Note: lessons order_index ordering failed, falling back to unordered select:", lessonsError.message);
            const retryLessons = await sb.from('lessons').select('*');
            lessons = retryLessons.data;
          }

          const mappedModules = mods.map((m: any) => ({
            id: m.id,
            title: m.title,
            difficulty: m.difficulty || 'Beginner',
            description: m.description || '',
            metadata: m.metadata || null,
            lessons: (lessons || [])
              .filter((l: any) => l.module_id === m.id)
              .map((l: any) => ({
                id: l.id,
                title: l.title,
                description: l.description,
                difficulty: l.difficulty || 'Easy',
                xpReward: l.xp_reward || 100,
                challenges: l.challenges || []
              }))
          }));

          dynamicModulesSeoCache = {
            timestamp: now,
            data: mappedModules
          };

          return mappedModules;
        }
      } catch (err) {
        console.warn("[SEO] Note: using default curriculum for SEO rendering:", err);
      }
    }
    return undefined;
  }

  // GET /robots.txt
  app.get("/robots.txt", (req, res) => {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.get('host') || 'chikoo.ai';
    const baseUrl = `${protocol}://${host}`;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(generateRobotsTxt(baseUrl));
  });

  // GET /sitemap.xml
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      const host = req.headers['x-forwarded-host'] || req.get('host') || 'chikoo.ai';
      const baseUrl = `${protocol}://${host}`;
      const dynamicModules = await getDynamicModulesForSeo();
      const sitemap = generateSitemapXml(baseUrl, dynamicModules);
      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
      res.send(sitemap);
    } catch (err: any) {
      console.error("[SEO Error] Failed generating sitemap.xml:", err);
      res.status(500).send("Failed to generate sitemap.");
    }
  });

  // =========================================================================
  // API ROUTE FALLTHROUGH 404 HANDLER (PREVENTS HTML FALLTHROUGH FOR /api/*)
  // =========================================================================
  app.all(['/api', '/api/*'], (req, res) => {
    console.warn(`[API 404] Unmatched API route: ${req.method} ${req.originalUrl}`);
    res.setHeader('Content-Type', 'application/json');
    if (req.originalUrl.includes('/generation-jobs')) {
      return res.status(404).json({
        error: "Generation job not found"
      });
    }
    res.status(404).json({
      error: `API route not found: ${req.method} ${req.originalUrl}`,
      status: 404,
      method: req.method,
      path: req.originalUrl,
      timestamp: new Date().toISOString()
    });
  });

  // Global Error Handler for API routes
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.path.startsWith('/api') || req.originalUrl.startsWith('/api')) {
      console.error(`[API 500 Uncaught] Error on ${req.method} ${req.originalUrl}:`, err);
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({
        error: err.message || "Internal Server Error",
        status: 500,
        path: req.originalUrl
      });
    }
    next(err);
  });

  // Vercel serverless: static files + SPA fallback are handled by Vercel (see vercel.json),
  // so we only need the API app. No vite, no static serving, no app.listen().
  if (process.env.VERCEL) {
    return app;
  }

  // Vite server integration
  const isProdBundle = import.meta.url.includes('/dist/') || (typeof __filename !== 'undefined' && __filename.endsWith('.cjs'));
  const isProduction = process.env.NODE_ENV === "production" || isProdBundle;

  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });

    // Intercept SEO routes for SSR meta tags and pre-rendered semantic HTML
    app.get([
      "/what-is-chikoo", 
      "/about", 
      "/units", 
      "/units/*", 
      "/features", 
      "/features/*", 
      "/learn", 
      "/learn/*",
      "/privacy-policy",
      "/delete-account"
    ], async (req, res, next) => {
      try {
        if (req.path.startsWith('/api') || req.originalUrl.startsWith('/api')) {
          return next();
        }
        const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
        const host = req.headers['x-forwarded-host'] || req.get('host') || 'chikoo.ai';
        const baseUrl = `${protocol}://${host}`;
        const dynamicModules = await getDynamicModulesForSeo();
        const seo = resolveSeoForPath(req.path, dynamicModules, baseUrl);

        const templatePath = path.resolve(process.cwd(), 'index.html');
        let template = fs.readFileSync(templatePath, 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        const finalHtml = injectSeoIntoHtml(template, seo);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.status(200).send(finalHtml);
      } catch (e) {
        next(e);
      }
    });

    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = fs.existsSync(path.join(process.cwd(), 'dist'))
      ? path.join(process.cwd(), 'dist')
      : (typeof __dirname !== 'undefined' ? __dirname : path.join(process.cwd(), 'dist'));
    app.use(express.static(distPath, {
      maxAge: '1d',
      setHeaders: (res, filePath) => {
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          // Hashed assets in dist/assets can be safely cached immutably for 1 year
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else {
          res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=3600');
        }
      }
    }));

    app.get('*', async (req, res) => {
      // Strict guard: Never serve index.html for API routes in production
      if (req.path === '/api' || req.path.startsWith('/api/') || req.originalUrl.startsWith('/api')) {
        res.setHeader('Content-Type', 'application/json');
        if (req.originalUrl.includes('/generation-jobs')) {
          return res.status(404).json({ error: "Generation job not found" });
        }
        return res.status(404).json({ error: "API route not found" });
      }

      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      const host = req.headers['x-forwarded-host'] || req.get('host') || 'chikoo.ai';
      const baseUrl = `${protocol}://${host}`;
      const dynamicModules = await getDynamicModulesForSeo();
      const seo = resolveSeoForPath(req.path, dynamicModules, baseUrl);

      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        const template = fs.readFileSync(indexPath, 'utf-8');
        const finalHtml = injectSeoIntoHtml(template, seo);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', seo.noindex ? 'no-store' : 'public, max-age=3600, stale-while-revalidate=86400');
        return res.send(finalHtml);
      }
      res.sendFile(indexPath);
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    try {
      seedServerEventsIfEmpty();
    } catch (se) {
      console.error("Failed to seed server-side analytical events:", se);
    }
  });

  return app;
}

export const appReady = startServer().catch(err => {
  console.error("Failed to start custom express server:", err);
  throw err;
});
// Avoid unhandled-rejection crash on Cloud Run / dev (error is already logged above)
appReady.catch(() => {});
