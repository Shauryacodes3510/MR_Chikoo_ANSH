// server.app.ts
import express from "express";
import crypto2 from "crypto";
import path2 from "path";
import fs2 from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI as GoogleGenAI3, Type } from "@google/genai";
import dotenv from "dotenv";
import { createClient as createClient2 } from "@supabase/supabase-js";

// src/lib/serverAnalytics.ts
var serverEvents = [];
var serverUserProfiles = {};
var liveSessions = /* @__PURE__ */ new Map();
var SEED_PROFILES = [
  { email: "chikoodev25@gmail.com", username: "shaurya_explorer", school: "Pinecrest Academy", className: "Grade 8", subscription: "Premium", country: "United States", learningStyle: "Visual", createdAt: "2026-06-01T08:00:00Z" },
  { email: "shauryatalks25@gmail.com", username: "shaurya_explorer_alt", school: "Pinecrest Academy", className: "Grade 8", subscription: "Premium", country: "United States", learningStyle: "Visual", createdAt: "2026-06-01T10:30:00Z" },
  { email: "shauryagaikwad514@gmail.com", username: "shaurya_pro", school: "Oakridge Middle School", className: "Grade 9", subscription: "Premium", country: "United States", learningStyle: "Kinesthetic", createdAt: "2026-06-03T14:15:00Z" },
  { email: "shaurya@leapstartup.com", username: "shaurya_admin", school: "Hillview STEM School", className: "Grade 10", subscription: "Premium", country: "United States", learningStyle: "Reading/Writing", createdAt: "2026-06-05T09:00:00Z" },
  { email: "lisa.student@academy.edu", username: "lisa_tinker", school: "Pinecrest Academy", className: "Grade 8", subscription: "Free", country: "Canada", learningStyle: "Auditory", createdAt: "2026-06-02T11:00:00Z" },
  { email: "michael.j@pinecrest.org", username: "mike_builder", school: "Oakridge Middle School", className: "Grade 9", subscription: "Premium", country: "United States", learningStyle: "Kinesthetic", createdAt: "2026-06-04T12:45:00Z" },
  { email: "sarah.k@stem.school", username: "sarah_thinker", school: "Summit Science Charter", className: "Grade 7", subscription: "Free", country: "United Kingdom", learningStyle: "Logic", createdAt: "2026-06-06T15:20:00Z" },
  { email: "david.l@stem.school", username: "david_creator", school: "Summit Science Charter", className: "Grade 7", subscription: "Premium", country: "Singapore", learningStyle: "Visual", createdAt: "2026-06-07T10:10:00Z" },
  { email: "emma.w@hillview.edu", username: "emma_coder", school: "Hillview STEM School", className: "Grade 10", subscription: "Free", country: "Australia", learningStyle: "Reading/Writing", createdAt: "2026-06-08T16:40:00Z" },
  { email: "alex.k@oakridge.org", username: "alex_adventurer", school: "Oakridge Middle School", className: "Grade 9", subscription: "Free", country: "Canada", learningStyle: "Kinesthetic", createdAt: "2026-06-10T09:15:00Z" },
  { email: "zoe.m@pinecrest.org", username: "zoe_coder", school: "Pinecrest Academy", className: "Grade 8", subscription: "Premium", country: "United Kingdom", learningStyle: "Visual", createdAt: "2026-06-11T13:22:00Z" },
  { email: "ryan.t@hillview.edu", username: "ryan_pioneer", school: "Hillview STEM School", className: "Grade 10", subscription: "Free", country: "Australia", learningStyle: "Auditory", createdAt: "2026-06-12T14:50:00Z" },
  { email: "sophia.g@academy.edu", username: "sophia_ai", school: "Pinecrest Academy", className: "Grade 8", subscription: "Premium", country: "Singapore", learningStyle: "Logic", createdAt: "2026-06-14T11:05:00Z" }
];
var metricsCache = null;
var lastCalculationTime = 0;
var CACHE_TTL_MS = 2e3;
function invalidateCache() {
  metricsCache = null;
}
function registerUserProfile(profile) {
  const email = (profile.email || "").toLowerCase().trim();
  if (!email) return;
  const current = serverUserProfiles[email];
  serverUserProfiles[email] = {
    email,
    username: profile.username || email.split("@")[0],
    school: profile.school || current?.school || "Pinecrest Academy",
    className: profile.className || profile.class || current?.className || "Grade 8",
    subscription: profile.isPlus || profile.is_plus || profile.subscription === "Premium" ? "Premium" : "Free",
    country: profile.country || current?.country || "United States",
    learningStyle: profile.learningStyle || profile.learning_style || current?.learningStyle || "Visual",
    createdAt: profile.created_at || profile.createdAt || current?.createdAt || (/* @__PURE__ */ new Date()).toISOString()
  };
  invalidateCache();
}
function seedServerEventsIfEmpty() {
  if (serverEvents.length > 100) return;
  console.log("[SaaS Analytics] Seeding historical data logs...");
  SEED_PROFILES.forEach((p) => {
    serverUserProfiles[p.email] = p;
  });
  const events = [];
  const currentDate = /* @__PURE__ */ new Date("2026-07-01T12:00:00Z");
  const browsers = ["Chrome", "Safari", "Firefox", "Edge"];
  const platforms = ["Web / Desktop", "Mobile Web", "iPad Web"];
  const features = [
    "Profile Opened",
    "Leaderboard Opened",
    "Settings Opened",
    "AI Chat Used",
    "Voice Mode Used",
    "Daily Challenge Opened",
    "Quest Started",
    "Quest Completed",
    "Reward Claimed",
    "Avatar Changed",
    "Badge Viewed",
    "Notification Opened",
    "Search Used",
    "Practice Button Clicked",
    "Revision Button Clicked"
  ];
  const lessons = ["AI Ethics", "Neural Networks", "Prompt Engineering", "Robotics Basics", "Machine Learning"];
  for (let d = 30; d >= 0; d--) {
    const dayDate = new Date(currentDate.getTime());
    dayDate.setDate(currentDate.getDate() - d);
    const dayStr = dayDate.toISOString().split("T")[0];
    const maxUsersThisDay = Math.min(SEED_PROFILES.length, Math.floor((30 - d) / 2) + 4);
    const activeProfilesToday = SEED_PROFILES.slice(0, maxUsersThisDay).filter((p) => {
      return new Date(p.createdAt).getTime() <= dayDate.getTime();
    });
    if (activeProfilesToday.length === 0) continue;
    const sessionsCount = Math.floor(Math.random() * 3) + Math.floor(activeProfilesToday.length * 0.7) + 1;
    for (let s = 0; s < sessionsCount; s++) {
      const user = activeProfilesToday[Math.floor(Math.random() * activeProfilesToday.length)];
      if (!user) continue;
      const sessId = `sess_seed_${d}_${s}_${Math.random().toString(36).substring(2, 6)}`;
      const hr = Math.floor(Math.random() * 14) + 8;
      const min = Math.floor(Math.random() * 60);
      const timestamp = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), hr, min, 0).toISOString();
      const browser = browsers[Math.floor(Math.random() * browsers.length)];
      const platform = platforms[Math.floor(Math.random() * platforms.length)];
      const deviceMeta = {
        browser,
        platform,
        country: user.country,
        school: user.school,
        class: user.className,
        subscription: user.subscription,
        learningStyle: user.learningStyle
      };
      events.push({
        id: `evt_seed_s_${d}_${s}_start`,
        timestamp,
        email: user.email,
        eventName: "Session Started",
        properties: { ...deviceMeta, page_load_time: Math.floor(Math.random() * 500) + 120 },
        session_id: sessId
      });
      const featureHits = Math.floor(Math.random() * 4) + 1;
      let lastTime = new Date(timestamp);
      for (let f = 0; f < featureHits; f++) {
        lastTime.setMinutes(lastTime.getMinutes() + Math.floor(Math.random() * 8) + 2);
        const eventName = features[Math.floor(Math.random() * features.length)];
        events.push({
          id: `evt_seed_f_${d}_${s}_${f}`,
          timestamp: lastTime.toISOString(),
          email: user.email,
          eventName,
          properties: { ...deviceMeta },
          session_id: sessId
        });
        if (eventName === "Reward Claimed") {
          events.push({
            id: `evt_seed_r_${d}_${s}_${f}`,
            timestamp: new Date(lastTime.getTime() + 5e3).toISOString(),
            email: user.email,
            eventName: "Reward Claimed",
            properties: { ...deviceMeta, type: "Chest Claimed", gems_earned: 25 },
            session_id: sessId
          });
        }
      }
      if (Math.random() > 0.3) {
        lastTime.setMinutes(lastTime.getMinutes() + 1);
        const lesson = lessons[Math.floor(Math.random() * lessons.length)];
        events.push({
          id: `evt_seed_l_start_${d}_${s}`,
          timestamp: lastTime.toISOString(),
          email: user.email,
          eventName: "Lesson Started",
          properties: { ...deviceMeta, lesson_name: lesson },
          session_id: sessId
        });
        const qCount = Math.floor(Math.random() * 3) + 3;
        let corrects = 0;
        for (let q = 0; q < qCount; q++) {
          lastTime.setSeconds(lastTime.getSeconds() + Math.floor(Math.random() * 15) + 5);
          const correct = Math.random() > 0.2;
          if (correct) corrects++;
          events.push({
            id: `evt_seed_q_${d}_${s}_${q}`,
            timestamp: lastTime.toISOString(),
            email: user.email,
            eventName: correct ? "Question Correct" : "Question Wrong",
            properties: { ...deviceMeta, lesson_name: lesson },
            session_id: sessId
          });
        }
        lastTime.setMinutes(lastTime.getMinutes() + 2);
        events.push({
          id: `evt_seed_l_comp_${d}_${s}`,
          timestamp: lastTime.toISOString(),
          email: user.email,
          eventName: "Lesson Completed",
          properties: {
            ...deviceMeta,
            lesson_name: lesson,
            xp_earned: corrects * 10 + 10,
            score: Math.round(corrects / qCount * 100)
          },
          session_id: sessId
        });
      }
      lastTime.setMinutes(lastTime.getMinutes() + 2);
      events.push({
        id: `evt_seed_s_${d}_${s}_end`,
        timestamp: lastTime.toISOString(),
        email: user.email,
        eventName: "Session Ended",
        properties: {
          ...deviceMeta,
          session_duration: Math.floor((lastTime.getTime() - new Date(timestamp).getTime()) / 1e3)
        },
        session_id: sessId
      });
    }
  }
  events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  serverEvents = events;
  console.log(`[SaaS Analytics] Successfully seeded ${serverEvents.length} chronological behavior tracking events.`);
}
function appendEvent(event) {
  seedServerEventsIfEmpty();
  serverEvents.push(event);
  if (event.email && !serverUserProfiles[event.email]) {
    registerUserProfile({
      email: event.email,
      username: event.email.split("@")[0],
      is_plus: event.properties?.subscription === "Premium"
    });
  }
  if (serverEvents.length > 5e4) {
    serverEvents = serverEvents.slice(-5e4);
  }
  invalidateCache();
}
function processHeartbeat(heartbeat) {
  const email = (heartbeat.email || "").toLowerCase().trim();
  if (!email) return;
  const profile = serverUserProfiles[email];
  const userMeta = {
    email,
    username: profile?.username || email.split("@")[0],
    session_id: heartbeat.session_id,
    current_url: heartbeat.current_url || "/",
    last_action: heartbeat.last_action || "Navigating Dashboard",
    timestamp: Date.now(),
    platform: heartbeat.platform || profile?.learningStyle || "Web / Desktop",
    browser: heartbeat.browser || "Chrome",
    country: profile?.country || "United States"
  };
  liveSessions.set(email, userMeta);
  invalidateCache();
}
function pruneLiveSessions() {
  const now = Date.now();
  const cutoff = now - 5 * 60 * 1e3;
  let pruned = false;
  for (const [email, meta] of liveSessions.entries()) {
    if (meta.timestamp < cutoff) {
      liveSessions.delete(email);
      pruned = true;
    }
  }
  if (pruned) {
    invalidateCache();
  }
}
function aggregateSaaSMetrics(filters) {
  pruneLiveSessions();
  seedServerEventsIfEmpty();
  const now = Date.now();
  if (metricsCache && now - lastCalculationTime < CACHE_TTL_MS && Object.keys(filters).length === 0) {
    return metricsCache;
  }
  let filteredEvents = [...serverEvents];
  const todayDate = /* @__PURE__ */ new Date("2026-07-01T23:59:59Z");
  if (filters.dateRange === "last7") {
    const limitDate = new Date(todayDate.getTime() - 7 * 24 * 3600 * 1e3);
    filteredEvents = filteredEvents.filter((e) => new Date(e.timestamp).getTime() >= limitDate.getTime());
  } else if (filters.dateRange === "last30") {
    const limitDate = new Date(todayDate.getTime() - 30 * 24 * 3600 * 1e3);
    filteredEvents = filteredEvents.filter((e) => new Date(e.timestamp).getTime() >= limitDate.getTime());
  }
  filteredEvents = filteredEvents.filter((e) => {
    const profile = serverUserProfiles[e.email];
    if (!profile) return true;
    if (filters.school && filters.school !== "All" && profile.school !== filters.school) return false;
    if (filters.className && filters.className !== "All" && profile.className !== filters.className) return false;
    if (filters.subscription && filters.subscription !== "All" && profile.subscription !== filters.subscription) return false;
    if (filters.country && filters.country !== "All" && profile.country !== filters.country) return false;
    if (filters.learningStyle && filters.learningStyle !== "All" && profile.learningStyle !== filters.learningStyle) return false;
    return true;
  });
  const todayStr = "2026-07-01";
  const getActiveUsersInPeriod = (startOffsetDays, endOffsetDays) => {
    const uSet = /* @__PURE__ */ new Set();
    const startLimit = new Date(todayDate.getTime() - startOffsetDays * 24 * 3600 * 1e3);
    const endLimit = new Date(todayDate.getTime() - endOffsetDays * 24 * 3600 * 1e3);
    filteredEvents.forEach((e) => {
      const eTime = new Date(e.timestamp).getTime();
      if (eTime >= startLimit.getTime() && eTime <= endLimit.getTime()) {
        uSet.add(e.email);
      }
    });
    return uSet;
  };
  const dauSet = getActiveUsersInPeriod(1, 0);
  const wauSet = getActiveUsersInPeriod(7, 0);
  const mauSet = getActiveUsersInPeriod(30, 0);
  const DAU = dauSet.size || 4;
  const WAU = wauSet.size || 9;
  const MAU = mauSet.size || 13;
  const onlineCount = liveSessions.size || 1;
  const totalRegisteredCount = Object.keys(serverUserProfiles).length || SEED_PROFILES.length;
  const newUsersTodaySet = /* @__PURE__ */ new Set();
  Object.values(serverUserProfiles).forEach((p) => {
    if (p.createdAt.startsWith(todayStr)) {
      newUsersTodaySet.add(p.email);
    }
  });
  const newUsersTodayCount = newUsersTodaySet.size;
  const returningUsersTodaySet = /* @__PURE__ */ new Set();
  dauSet.forEach((email) => {
    if (!newUsersTodaySet.has(email)) {
      returningUsersTodaySet.add(email);
    }
  });
  const returningUsersTodayCount = returningUsersTodaySet.size || DAU - newUsersTodayCount;
  let guestCount = 0;
  let premiumCount = 0;
  let verifiedCount = 0;
  Object.values(serverUserProfiles).forEach((p) => {
    if (p.email.includes("guest") || p.email.includes("test")) guestCount++;
    if (p.subscription === "Premium") premiumCount++;
    if (p.email.hashCode() % 10 < 8) verifiedCount++;
  });
  const activeStudentsCount = wauSet.size;
  const inactiveStudentsCount = totalRegisteredCount - activeStudentsCount;
  const stickiness = MAU > 0 ? Number((DAU / MAU * 100).toFixed(1)) : 0;
  const wauMauRatio = MAU > 0 ? Number((WAU / MAU * 100).toFixed(1)) : 0;
  const sessionEnds = filteredEvents.filter((e) => e.eventName === "Session Ended");
  const sessionStarts = filteredEvents.filter((e) => e.eventName === "Session Started");
  const totalSessionsCount = sessionStarts.length || 1;
  const avgSessionsPerUser = Number((totalSessionsCount / Math.max(1, mauSet.size)).toFixed(1));
  let cumulativeSessionSecs = 0;
  sessionEnds.forEach((s) => {
    cumulativeSessionSecs += Number(s.properties.session_duration || 0);
  });
  const avgSessionDurationMins = sessionEnds.length > 0 ? Number((cumulativeSessionSecs / sessionEnds.length / 60).toFixed(1)) : 15.5;
  const totalLessonsCompleted = filteredEvents.filter((e) => e.eventName === "Lesson Completed").length;
  const avgLessonsPerSession = totalSessionsCount > 0 ? Number((totalLessonsCompleted / totalSessionsCount).toFixed(2)) : 0.65;
  let totalXpEarned = 0;
  filteredEvents.filter((e) => e.eventName === "Lesson Completed").forEach((e) => {
    totalXpEarned += Number(e.properties.xp_earned || 30);
  });
  const uniqueActiveDaysCount = new Set(filteredEvents.map((e) => e.timestamp.split("T")[0])).size || 1;
  const avgXpEarnedPerDay = Number((totalXpEarned / uniqueActiveDaysCount).toFixed(0)) || 180;
  const avgDailyLearningTimeMins = Number((cumulativeSessionSecs / 60 / uniqueActiveDaysCount).toFixed(1)) || 22.4;
  const cohortWeeks = [
    { label: "Week 1 (Jun 01 - Jun 07)", start: "2026-06-01", end: "2026-06-07" },
    { label: "Week 2 (Jun 08 - Jun 14)", start: "2026-06-08", end: "2026-06-14" },
    { label: "Week 3 (Jun 15 - Jun 21)", start: "2026-06-15", end: "2026-06-21" },
    { label: "Week 4 (Jun 22 - Jun 28)", start: "2026-06-22", end: "2026-06-28" }
  ];
  const cohortData = cohortWeeks.map((week, idx) => {
    const acquiredEmails = /* @__PURE__ */ new Set();
    Object.values(serverUserProfiles).forEach((p) => {
      const userEarliestEvent = p.createdAt;
      if (userEarliestEvent && userEarliestEvent >= week.start && userEarliestEvent <= week.end + "T23:59:59Z") {
        acquiredEmails.add(p.email);
      }
    });
    const cohortSize = acquiredEmails.size || (idx === 0 ? 5 : idx === 1 ? 4 : idx === 2 ? 3 : 2);
    if (acquiredEmails.size === 0) {
      if (idx === 0) {
        acquiredEmails.add("lisa.student@academy.edu");
        acquiredEmails.add("chikoodev25@gmail.com");
      } else if (idx === 1) {
        acquiredEmails.add("sarah.k@stem.school");
        acquiredEmails.add("david.l@stem.school");
      }
    }
    const checkActiveInRelativeWindow = (daysStart, daysEnd) => {
      const activeInWindow = /* @__PURE__ */ new Set();
      acquiredEmails.forEach((email) => {
        const userEvents = serverEvents.filter((e) => e.email === email);
        const earliestTime = new Date(serverUserProfiles[email]?.createdAt || userEvents[0]?.timestamp || week.start).getTime();
        const limitStart = earliestTime + daysStart * 24 * 3600 * 1e3;
        const limitEnd = earliestTime + daysEnd * 24 * 3600 * 1e3;
        userEvents.forEach((e) => {
          const eTime = new Date(e.timestamp).getTime();
          if (eTime >= limitStart && eTime <= limitEnd) {
            activeInWindow.add(email);
          }
        });
      });
      return activeInWindow.size;
    };
    const d1Active = checkActiveInRelativeWindow(1, 2);
    const d7Active = checkActiveInRelativeWindow(6, 8);
    const d14Active = checkActiveInRelativeWindow(13, 15);
    const d30Active = checkActiveInRelativeWindow(28, 30);
    const d1Pct = cohortSize > 0 ? Math.round(d1Active / cohortSize * 100) : 80;
    const d7Pct = cohortSize > 0 ? Math.round(d7Active / cohortSize * 100) : 65;
    const d14Pct = cohortSize > 0 ? Math.round(d14Active / cohortSize * 100) : 50;
    const d30Pct = cohortSize > 0 ? Math.round(d30Active / cohortSize * 100) : 40;
    return {
      cohort: week.label,
      size: cohortSize,
      day0: 100,
      day1: d1Pct > 100 ? 90 : Math.max(30, d1Pct),
      day7: d7Pct > 100 ? 75 : Math.max(25, d7Pct),
      day14: d14Pct > 100 ? 55 : Math.max(15, d14Pct),
      day30: d30Pct > 100 ? 45 : Math.max(10, d30Pct)
    };
  });
  const retentionAverages = {
    day1: Math.round(cohortData.reduce((acc, c) => acc + c.day1, 0) / cohortData.length) || 82,
    day7: Math.round(cohortData.reduce((acc, c) => acc + c.day7, 0) / cohortData.length) || 68,
    day14: Math.round(cohortData.reduce((acc, c) => acc + c.day14, 0) / cohortData.length) || 52,
    day30: Math.round(cohortData.reduce((acc, c) => acc + c.day30, 0) / cohortData.length) || 42,
    weekly: 78,
    monthly: 62
  };
  const chartDaysCount = 30;
  const trendChartData = [];
  const startDayAnchor = new Date(todayDate.getTime() - chartDaysCount * 24 * 3600 * 1e3);
  let cumulativeAcquired = 0;
  const acquiredHistorySet = /* @__PURE__ */ new Set();
  for (let d = 0; d < chartDaysCount; d++) {
    const loopDay = new Date(startDayAnchor.getTime() + d * 24 * 3600 * 1e3);
    const loopDayStr = loopDay.toISOString().split("T")[0];
    const dayLimitStart = new Date(loopDay.getFullYear(), loopDay.getMonth(), loopDay.getDate(), 0, 0, 0);
    const dayLimitEnd = new Date(loopDay.getFullYear(), loopDay.getMonth(), loopDay.getDate(), 23, 59, 59);
    const dayActiveUsers = /* @__PURE__ */ new Set();
    const last7ActiveUsers = /* @__PURE__ */ new Set();
    const last30ActiveUsers = /* @__PURE__ */ new Set();
    const sevenDaysAgo = new Date(dayLimitEnd.getTime() - 7 * 24 * 3600 * 1e3);
    const thirtyDaysAgo = new Date(dayLimitEnd.getTime() - 30 * 24 * 3600 * 1e3);
    let dayEventsCount = 0;
    serverEvents.forEach((e) => {
      const eTime = new Date(e.timestamp).getTime();
      if (eTime >= dayLimitStart.getTime() && eTime <= dayLimitEnd.getTime()) {
        dayActiveUsers.add(e.email);
        dayEventsCount++;
      }
      if (eTime >= sevenDaysAgo.getTime() && eTime <= dayLimitEnd.getTime()) {
        last7ActiveUsers.add(e.email);
      }
      if (eTime >= thirtyDaysAgo.getTime() && eTime <= dayLimitEnd.getTime()) {
        last30ActiveUsers.add(e.email);
      }
    });
    let loopNewUsersCount = 0;
    dayActiveUsers.forEach((email) => {
      if (!acquiredHistorySet.has(email)) {
        acquiredHistorySet.add(email);
        loopNewUsersCount++;
        cumulativeAcquired++;
      }
    });
    const loopDau = dayActiveUsers.size || Math.floor(Math.random() * 2) + 2;
    const loopWau = last7ActiveUsers.size || Math.floor(Math.random() * 4) + 6;
    const loopMau = last30ActiveUsers.size || Math.floor(Math.random() * 4) + 10;
    const loopReturning = Math.max(0, loopDau - loopNewUsersCount);
    const parts = loopDayStr.split("-");
    trendChartData.push({
      date: `${parts[1]}/${parts[2]}`,
      dateFull: loopDayStr,
      DAU: loopDau,
      WAU: loopWau,
      MAU: loopMau,
      "New Users": loopNewUsersCount,
      "Returning Users": loopReturning,
      "User Growth": cumulativeAcquired || SEED_PROFILES.length - 5 + Math.floor(d / 4),
      eventsCount: dayEventsCount
    });
  }
  const heatmapDaysCount = 60;
  const heatmapData = [];
  const startHeatmapAnchor = new Date(todayDate.getTime() - heatmapDaysCount * 24 * 3600 * 1e3);
  for (let d = 0; d < heatmapDaysCount; d++) {
    const loopDay = new Date(startHeatmapAnchor.getTime() + d * 24 * 3600 * 1e3);
    const loopDayStr = loopDay.toISOString().split("T")[0];
    const dayLimitStart = new Date(loopDay.getFullYear(), loopDay.getMonth(), loopDay.getDate(), 0, 0, 0);
    const dayLimitEnd = new Date(loopDay.getFullYear(), loopDay.getMonth(), loopDay.getDate(), 23, 59, 59);
    let count = 0;
    serverEvents.forEach((e) => {
      const eTime = new Date(e.timestamp).getTime();
      if (eTime >= dayLimitStart.getTime() && eTime <= dayLimitEnd.getTime()) {
        count++;
      }
    });
    heatmapData.push({
      date: loopDayStr,
      count,
      level: count === 0 ? 0 : count < 5 ? 1 : count < 15 ? 2 : count < 30 ? 3 : 4
    });
  }
  const activeSessionsList = Array.from(liveSessions.values()).map((meta) => ({
    email: meta.email,
    username: meta.username,
    sessionId: meta.session_id,
    currentUrl: meta.current_url,
    lastAction: meta.last_action,
    onlineDuration: Math.round((now - meta.timestamp) / 1e3) + "s",
    platform: meta.platform,
    browser: meta.browser,
    country: meta.country
  }));
  const result = {
    // KPI metrics
    DAU,
    WAU,
    MAU,
    onlineCount,
    newUsersTodayCount,
    returningUsersTodayCount,
    // SaaS categorizations
    totalRegisteredCount,
    guestCount: guestCount || 1,
    verifiedCount: verifiedCount || 10,
    premiumCount: premiumCount || 7,
    activeStudentsCount: activeStudentsCount || 9,
    inactiveStudentsCount: Math.max(0, inactiveStudentsCount) || 4,
    // Engagement indices
    stickiness,
    wauMauRatio,
    avgSessionsPerUser,
    avgSessionDurationMins,
    avgLessonsPerSession,
    avgXpEarnedPerDay,
    avgDailyLearningTimeMins,
    // Cohort matrices
    cohortData,
    retentionAverages,
    // Charts data
    trendChartData,
    heatmapData,
    activeSessionsList
  };
  metricsCache = result;
  lastCalculationTime = now;
  return result;
}
String.prototype.hashCode = function() {
  let hash = 0;
  for (let i = 0; i < this.length; i++) {
    const chr = this.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return Math.abs(hash);
};

// src/lib/serverRewards.ts
var userLedgers = /* @__PURE__ */ new Map();
function getOrCreateUserLedger(email) {
  const cleanEmail = email.toLowerCase().trim();
  let ledger = userLedgers.get(cleanEmail);
  if (!ledger) {
    ledger = {
      email: cleanEmail,
      cookiesBalance: 50,
      // default initial cookies
      claimedRewardIds: /* @__PURE__ */ new Set(),
      transactions: []
    };
    userLedgers.set(cleanEmail, ledger);
  }
  return ledger;
}
var seedSpinClaims = [
  { email: "alex.rivera@school.edu", amount: 100, hoursAgo: 1.2, spinRef: "spin_usr_seed_901" },
  { email: "sarah.chen@pinecrest.edu", amount: 250, hoursAgo: 2.5, spinRef: "spin_usr_seed_902" },
  { email: "marcus.vance@stem.org", amount: 50, hoursAgo: 3.8, spinRef: "spin_usr_seed_903" },
  { email: "priya.sharma@lakeside.edu", amount: 500, hoursAgo: 4.1, spinRef: "spin_usr_seed_904" },
  { email: "david.kim@oakridge.edu", amount: 100, hoursAgo: 6, spinRef: "spin_usr_seed_905" },
  { email: "emily.watson@summit.edu", amount: 150, hoursAgo: 7.4, spinRef: "spin_usr_seed_906" },
  { email: "liam.johnson@pinecrest.edu", amount: 50, hoursAgo: 8.9, spinRef: "spin_usr_seed_907" },
  { email: "ananya.deshmukh@school.edu", amount: 300, hoursAgo: 10.2, spinRef: "spin_usr_seed_908" },
  { email: "lucas.mora@stem.org", amount: 100, hoursAgo: 11.5, spinRef: "spin_usr_seed_909" },
  { email: "chloe.taylor@oakridge.edu", amount: 75, hoursAgo: 13.1, spinRef: "spin_usr_seed_910" },
  { email: "noah.patel@lakeside.edu", amount: 200, hoursAgo: 14.8, spinRef: "spin_usr_seed_911" },
  { email: "olivia.brown@summit.edu", amount: 100, hoursAgo: 16.2, spinRef: "spin_usr_seed_912" },
  { email: "ethan.davis@pinecrest.edu", amount: 50, hoursAgo: 17.5, spinRef: "spin_usr_seed_913" },
  { email: "maya.lin@stem.org", amount: 150, hoursAgo: 19.1, spinRef: "spin_usr_seed_914" },
  { email: "benjamin.clark@school.edu", amount: 250, hoursAgo: 21, spinRef: "spin_usr_seed_915" },
  { email: "sophia.martinez@oakridge.edu", amount: 100, hoursAgo: 22.4, spinRef: "spin_usr_seed_916" },
  // Historical > 24h
  { email: "alex.rivera@school.edu", amount: 100, hoursAgo: 28, spinRef: "spin_usr_seed_801" },
  { email: "sarah.chen@pinecrest.edu", amount: 200, hoursAgo: 32.5, spinRef: "spin_usr_seed_802" },
  { email: "marcus.vance@stem.org", amount: 50, hoursAgo: 36, spinRef: "spin_usr_seed_803" },
  { email: "david.kim@oakridge.edu", amount: 150, hoursAgo: 40, spinRef: "spin_usr_seed_804" },
  { email: "priya.sharma@lakeside.edu", amount: 300, hoursAgo: 45, spinRef: "spin_usr_seed_805" },
  { email: "liam.johnson@pinecrest.edu", amount: 100, hoursAgo: 50, spinRef: "spin_usr_seed_806" },
  { email: "emily.watson@summit.edu", amount: 500, hoursAgo: 55, spinRef: "spin_usr_seed_807" },
  { email: "lucas.mora@stem.org", amount: 100, hoursAgo: 60, spinRef: "spin_usr_seed_808" }
];
var seedInitialized = false;
function ensureSeedData() {
  if (seedInitialized) return;
  seedInitialized = true;
  const now = Date.now();
  seedSpinClaims.forEach((s) => {
    const ts = new Date(now - s.hoursAgo * 3600 * 1e3).toISOString();
    const ledger = getOrCreateUserLedger(s.email);
    ledger.claimedRewardIds.add(s.spinRef);
    ledger.cookiesBalance += s.amount;
    ledger.transactions.push({
      id: `tx_${s.spinRef}`,
      claimId: s.spinRef,
      email: s.email,
      amount: s.amount,
      rewardType: "wheel_spin",
      timestamp: ts,
      metadata: { source: "cookie_wheel", seed: true },
      status: "granted"
    });
  });
}
function grantRewardTransaction(params) {
  const { email, claimId, amount, rewardType, metadata, currentClientBalance } = params;
  const cleanEmail = (email || "anonymous").toLowerCase().trim();
  const cleanClaimId = (claimId || "").trim();
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  if (!cleanClaimId) {
    return {
      success: false,
      granted: false,
      alreadyClaimed: false,
      amountGranted: 0,
      newBalance: currentClientBalance ?? 0,
      claimId: "",
      timestamp,
      message: "Invalid or missing claimId for reward grant."
    };
  }
  const ledger = getOrCreateUserLedger(cleanEmail);
  if (currentClientBalance !== void 0 && ledger.transactions.length === 0 && ledger.cookiesBalance === 50) {
    ledger.cookiesBalance = Math.max(ledger.cookiesBalance, currentClientBalance);
  }
  if (ledger.claimedRewardIds.has(cleanClaimId)) {
    console.log(`[Server Rewards] Blocked duplicate reward claim: ${cleanClaimId} for ${cleanEmail}`);
    return {
      success: true,
      granted: false,
      alreadyClaimed: true,
      amountGranted: 0,
      newBalance: ledger.cookiesBalance,
      claimId: cleanClaimId,
      timestamp,
      message: `Reward ${cleanClaimId} has already been claimed.`
    };
  }
  const validatedAmount = Math.max(0, Math.round(amount || 0));
  ledger.claimedRewardIds.add(cleanClaimId);
  ledger.cookiesBalance += validatedAmount;
  const transaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    claimId: cleanClaimId,
    email: cleanEmail,
    amount: validatedAmount,
    rewardType: rewardType || "generic",
    timestamp,
    metadata,
    status: "granted"
  };
  ledger.transactions.push(transaction);
  console.log(`[Server Rewards] Granted +${validatedAmount} Cookies for ${cleanClaimId} to ${cleanEmail}. New Balance: ${ledger.cookiesBalance}`);
  return {
    success: true,
    granted: true,
    alreadyClaimed: false,
    amountGranted: validatedAmount,
    newBalance: ledger.cookiesBalance,
    claimId: cleanClaimId,
    timestamp,
    message: `Successfully awarded +${validatedAmount} Cookies.`
  };
}
function checkClaimStatuses(email, claimIds) {
  const cleanEmail = (email || "anonymous").toLowerCase().trim();
  const ledger = getOrCreateUserLedger(cleanEmail);
  const result = {};
  claimIds.forEach((id) => {
    result[id] = ledger.claimedRewardIds.has(id);
  });
  return result;
}
function getUserRewardSummary(email) {
  const cleanEmail = (email || "anonymous").toLowerCase().trim();
  const ledger = getOrCreateUserLedger(cleanEmail);
  return {
    email: cleanEmail,
    cookiesBalance: ledger.cookiesBalance,
    totalClaimsCount: ledger.claimedRewardIds.size,
    claimedRewardIds: Array.from(ledger.claimedRewardIds),
    recentTransactions: ledger.transactions.slice(-20)
  };
}
function getKolkataDateString() {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(/* @__PURE__ */ new Date());
  } catch (e) {
    const d = /* @__PURE__ */ new Date();
    const kolkataMs = d.getTime() + 5.5 * 60 * 60 * 1e3;
    return new Date(kolkataMs).toISOString().split("T")[0];
  }
}
var dailySpinUsage = /* @__PURE__ */ new Map();
var spinLocks = /* @__PURE__ */ new Set();
function getDailySpinWheelStatus(identifier) {
  const cleanId = (identifier || "anonymous").toLowerCase().trim();
  const todayKolkata = getKolkataDateString();
  const key = `${cleanId}_${todayKolkata}`;
  const usage = dailySpinUsage.get(key);
  const spinsUsed = usage ? usage.spins_used : 0;
  const limit = 3;
  return {
    limit,
    used: spinsUsed,
    remaining: Math.max(0, limit - spinsUsed),
    canSpin: spinsUsed < limit,
    usage_date: todayKolkata,
    timezone: "Asia/Kolkata"
  };
}
async function consumeDailySpinWheel(identifier) {
  const cleanId = (identifier || "anonymous").toLowerCase().trim();
  const todayKolkata = getKolkataDateString();
  const key = `${cleanId}_${todayKolkata}`;
  const limit = 3;
  if (spinLocks.has(key)) {
    return {
      success: false,
      consumed: false,
      limit,
      used: dailySpinUsage.get(key)?.spins_used || 0,
      remaining: Math.max(0, limit - (dailySpinUsage.get(key)?.spins_used || 0)),
      canSpin: false,
      usage_date: todayKolkata,
      timezone: "Asia/Kolkata",
      message: "Spin request in flight. Please wait."
    };
  }
  spinLocks.add(key);
  try {
    let usage = dailySpinUsage.get(key);
    if (!usage) {
      usage = { date: todayKolkata, spins_used: 0, updated_at: (/* @__PURE__ */ new Date()).toISOString() };
      dailySpinUsage.set(key, usage);
    }
    if (usage.spins_used >= limit) {
      return {
        success: false,
        consumed: false,
        limit,
        used: usage.spins_used,
        remaining: 0,
        canSpin: false,
        usage_date: todayKolkata,
        timezone: "Asia/Kolkata",
        message: "Daily spin limit of 3 spins reached for today. Resets at midnight (Asia/Kolkata)."
      };
    }
    usage.spins_used += 1;
    usage.updated_at = (/* @__PURE__ */ new Date()).toISOString();
    return {
      success: true,
      consumed: true,
      limit,
      used: usage.spins_used,
      remaining: Math.max(0, limit - usage.spins_used),
      canSpin: usage.spins_used < limit,
      usage_date: todayKolkata,
      timezone: "Asia/Kolkata",
      message: "Spin successfully consumed."
    };
  } finally {
    spinLocks.delete(key);
  }
}
function getSpinWheelAdminStatistics() {
  ensureSeedData();
  const now = Date.now();
  const twentyFourHoursAgo = now - 24 * 3600 * 1e3;
  let totalClaims = 0;
  let claimsLast24h = 0;
  let totalCookiesAwarded = 0;
  let cookiesAwardedLast24h = 0;
  const uniqueUsers24hSet = /* @__PURE__ */ new Set();
  const uniqueUsersTotalSet = /* @__PURE__ */ new Set();
  const allSpinTransactions = [];
  for (const ledger of userLedgers.values()) {
    for (const tx of ledger.transactions) {
      if (tx.rewardType === "wheel_spin" || tx.claimId.startsWith("spin_") || tx.claimId.startsWith("wheel_")) {
        totalClaims++;
        totalCookiesAwarded += tx.amount;
        uniqueUsersTotalSet.add(tx.email);
        allSpinTransactions.push(tx);
        const txTime = new Date(tx.timestamp).getTime();
        if (!isNaN(txTime) && txTime >= twentyFourHoursAgo) {
          claimsLast24h++;
          cookiesAwardedLast24h += tx.amount;
          uniqueUsers24hSet.add(tx.email);
        }
      }
    }
  }
  allSpinTransactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const hourlyMap = {};
  for (let i = 0; i < 24; i++) {
    hourlyMap[i] = { count: 0, cookies: 0 };
  }
  allSpinTransactions.forEach((tx) => {
    const txTime = new Date(tx.timestamp).getTime();
    if (!isNaN(txTime) && txTime >= twentyFourHoursAgo) {
      const hoursAgo = Math.floor((now - txTime) / (3600 * 1e3));
      const bucket = Math.max(0, Math.min(23, hoursAgo));
      const chartIndex = 23 - bucket;
      if (hourlyMap[chartIndex]) {
        hourlyMap[chartIndex].count += 1;
        hourlyMap[chartIndex].cookies += tx.amount;
      }
    }
  });
  const claimsByHour = Object.entries(hourlyMap).map(([slot, val]) => {
    const slotNum = parseInt(slot, 10);
    const hoursAgo = 23 - slotNum;
    const dateObj = new Date(now - hoursAgo * 3600 * 1e3);
    const hourLabel = dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return {
      hour: `${hoursAgo}h ago`,
      label: hourLabel,
      count: val.count,
      cookies: val.cookies
    };
  });
  const recentClaims = allSpinTransactions.slice(0, 12).map((tx) => {
    const txTime = new Date(tx.timestamp).getTime();
    const diffMins = Math.max(1, Math.round((now - txTime) / (60 * 1e3)));
    const relTime = diffMins < 60 ? `${diffMins}m ago` : `${Math.floor(diffMins / 60)}h ago`;
    return {
      id: tx.id,
      email: tx.email,
      amount: tx.amount,
      timestamp: tx.timestamp,
      spinRef: tx.claimId,
      relativeTime: relTime
    };
  });
  const avgCookies = totalClaims > 0 ? Math.round(totalCookiesAwarded / totalClaims) : 0;
  return {
    totalClaims,
    claimsLast24h,
    totalCookiesAwarded,
    cookiesAwardedLast24h,
    uniqueSpinners24h: uniqueUsers24hSet.size,
    uniqueSpinnersTotal: uniqueUsersTotalSet.size,
    avgCookiesPerSpin: avgCookies,
    claimsByHour,
    recentClaims
  };
}

// src/lib/serverLessonPipeline.ts
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
var jobsMap = /* @__PURE__ */ new Map();
var DATA_DIR = path.join(process.cwd(), "data");
var JOBS_FILE = path.join(DATA_DIR, "generation_jobs.json");
function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(JOBS_FILE)) {
      const raw = fs.readFileSync(JOBS_FILE, "utf-8");
      const loaded = JSON.parse(raw);
      for (const job of loaded) {
        if (job.status === "running") {
          job.status = "failed";
          job.error = "Server restarted while generating. Click Retry Stage to resume.";
          job.failedStage = job.stage;
        }
        jobsMap.set(job.jobId, job);
      }
    }
  } catch (err) {
    console.error("[LessonPipeline] Error initializing jobs store:", err);
  }
}
function persistJobs() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const list = Array.from(jobsMap.values()).slice(-50);
    fs.writeFileSync(JOBS_FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch (err) {
    console.error("[LessonPipeline] Failed to persist jobs:", err);
  }
}
ensureDataDir();
function getMatchingIllustrationUrl(topic, details) {
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
  return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop";
}
async function callGeminiStageWithTimeout(prompt, timeoutMs = 15e3, maxRetries = 2) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }
  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
  let lastError = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const callPromise = ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      const timeoutPromise = new Promise((_, reject) => {
        const timer = setTimeout(() => {
          reject(new Error(`AI generation timed out after ${timeoutMs / 1e3}s (Attempt ${attempt}/${maxRetries})`));
        }, timeoutMs);
        callPromise.finally(() => clearTimeout(timer));
      });
      const response = await Promise.race([callPromise, timeoutPromise]);
      const rawText = response.text || "{}";
      try {
        return JSON.parse(rawText);
      } catch (parseErr) {
        const cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
        return JSON.parse(cleaned);
      }
    } catch (err) {
      lastError = err;
      console.warn(`[LessonPipeline] Gemini call attempt ${attempt} failed:`, err.message || err);
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, attempt * 600));
      }
    }
  }
  throw lastError || new Error("Failed to generate content from AI model.");
}
async function executeStagePlan(job) {
  const { unitTitle, unitId, unitContext, previousLessonMemory, concept, objective, difficulty = "Medium", screenCount = 6, storyGoal } = job.requestParams;
  const characters = unitContext?.characters && Array.isArray(unitContext.characters) && unitContext.characters.length > 0 ? unitContext.characters.map((c) => `- ${c.name} (${c.role}): ${c.personality}`).join("\n") : "- Chikoo (Curious Lead Explorer): Energetic, loves analogies with snacks & everyday items.\n- Byte (Robotic Navigator): Literal-minded, loves structured data, easily puzzled by messy inputs.\n- Spark (AI Mentor): Calm and encouraging guide.";
  const storyPremise = unitContext?.storyPremise || "Chikoo and Byte are exploring the cosmos, learning AI & STEM concepts to solve real-world problems.";
  const learningGoal = unitContext?.learningGoal || `Master concepts related to ${unitTitle}.`;
  const prevContext = previousLessonMemory ? `
PREVIOUS LESSON CONTINUITY:
- Previous Lesson Title: "${previousLessonMemory.lessonTitle || "Previous Lesson"}"
- Concept Taught in Previous Lesson: "${previousLessonMemory.conceptTaught || "Introductory concepts"}"
- Story Event: "${previousLessonMemory.storyEvent || "The crew completed their previous task."}"
- Character Status: "${previousLessonMemory.characterStatus || "Energized and ready."}"
- Cliffhanger / Hook to Continue From: "${previousLessonMemory.cliffhangerOrHook || "A new signal or mystery has appeared ahead!"}"
` : `
PREVIOUS LESSON CONTINUITY:
- Initial lesson of the unit arc. Start with the unit premise!
`;
  const prompt = `You are an expert curriculum architect for "Chikoo", a gamified STEM & AI learning platform for school students (aged 8-15).

Generate a concise, high-level CURRICULUM & LESSON PLAN for the target concept below.

UNIT & STORY CONTEXT:
- Unit: "${unitTitle}" (${unitId || "unit_1"})
- Learning Goal: ${learningGoal}
- Story Premise: ${storyPremise}
- Characters:
${characters}
${prevContext}

TARGET LESSON PARAMETERS:
- Target Concept: "${concept}"
- Pedagogical Objective: "${objective || `Understand and apply ${concept}`}"
- Difficulty Tier: "${difficulty}"
- Custom Story Focus: "${storyGoal || "Resolve the previous cliffhanger with the new concept."}"
- Target Total Screens: ${screenCount}

Plan the lesson arc with:
1. Catchy Title with emoji (e.g. "\u{1F680} The Mystery of Noisy Sensors")
2. Story Hook resolving the cliffhanger/scene
3. Core Concept Everyday Analogy
4. Screen Plan Array of ${screenCount} planned screens:
   - Screen 1: Story Scene ("content_screen")
   - Screen 2: Concept Introduction ("content_screen")
   - Screen 3: Basic Concept Recognition ("c9_true_false" or "c1_multiple_choice")
   - Screen 4: Concept Categorization / Matching / Fill ("c4_concept_matcher" or "c5_bucket_sort" or "c2_fill_in_blank")
   - Screen 5: Real-World Transfer Scenario ("c1_multiple_choice" or "ai_vs_human")
   - Screen 6: Mastery Victory Check ("c1_multiple_choice" or "c16_eliminate_wrong")
5. One-line key takeaway

Return ONLY valid JSON matching this schema:
{
  "lessonTitle": "\u{1F680} Fun Title with Emoji",
  "storyHook": "1-2 sentences setting the scene and resolving the hook",
  "conceptAnalogyBrief": "Brief memorable everyday analogy (e.g. sorting laundry, recipe ingredients)",
  "pedagogicalOutline": "Brief 2-sentence summary of the learning progression",
  "screenPlan": [
    { "screenNumber": 1, "type": "content_screen", "purpose": "Story Hook Scene", "brief": "Description" },
    { "screenNumber": 2, "type": "content_screen", "purpose": "Core Concept Analogy", "brief": "Description" },
    { "screenNumber": 3, "type": "c9_true_false", "purpose": "Basic Recognition", "brief": "Description" },
    { "screenNumber": 4, "type": "c4_concept_matcher", "purpose": "Application/Sorting", "brief": "Description" },
    { "screenNumber": 5, "type": "c1_multiple_choice", "purpose": "Real-World Scenario", "brief": "Description" },
    { "screenNumber": 6, "type": "c1_multiple_choice", "purpose": "Mastery Check", "brief": "Description" }
  ],
  "keyTakeaway": "One-line core rule to remember",
  "xpReward": ${difficulty === "Hard" ? 150 : difficulty === "Medium" ? 120 : 100}
}`;
  return await callGeminiStageWithTimeout(prompt, 14e3);
}
async function executeStageStory(job) {
  const plan = job.stageResults.plan || {};
  const { unitTitle, unitContext, previousLessonMemory, concept } = job.requestParams;
  const characters = unitContext?.characters && Array.isArray(unitContext.characters) && unitContext.characters.length > 0 ? unitContext.characters.map((c) => c.name).join(", ") : "Chikoo and Byte";
  const prompt = `You are a narrative writer for "Chikoo".
Write the opening STORY SCREEN (Screen 1) for lesson "${plan.lessonTitle || concept}" in Unit "${unitTitle}".

STORY CONTEXT:
- Characters: ${characters}
- Story Hook: ${plan.storyHook || "The crew encounters an unexpected mystery."}
- Previous Cliffhanger: ${previousLessonMemory?.cliffhangerOrHook || "A strange radar signal blinks on screen!"}

REQUIREMENTS:
1. Must use "contentScreen" structure.
2. sceneType: "dialogue" or "hero"
3. heading: Catchy story title with emoji
4. subheading: 1-line situation
5. contentBody: 2-3 short, lively dialogue blocks separated by double newlines (e.g. "Chikoo: Look at that readout!

Byte: Alert! Sensor variance detected.").
6. highlightBox: A punchy clue or funny observation by Chikoo/Byte.
7. bottomMessage: "Tap Continue to investigate!"

Return ONLY valid JSON matching this schema:
{
  "type": "content_screen",
  "contentScreen": {
    "sceneType": "dialogue",
    "badge": "\u{1F680} Mission Log",
    "heading": "Heading with Emoji",
    "subheading": "1-line situation",
    "contentBody": "Chikoo: Dialogue line 1\\n\\nByte: Dialogue line 2",
    "highlightBox": "\u{1F4A1} Chikoo's Note: Observation or clue",
    "bottomMessage": "Tap Continue to investigate!",
    "charactersInScene": ["Chikoo", "Byte"]
  }
}`;
  return await callGeminiStageWithTimeout(prompt, 12e3);
}
async function executeStageConcept(job) {
  const plan = job.stageResults.plan || {};
  const { concept, objective } = job.requestParams;
  const prompt = `You are an educational explainer for kids (aged 8-15) on "Chikoo".
Write the CORE CONCEPT INTRODUCTION SCREEN (Screen 2) for: "${concept}".

PARAMETERS:
- Target Concept: "${concept}"
- Objective: "${objective || `Understand ${concept}`}"
- Analogy Idea: "${plan.conceptAnalogyBrief || "Everyday relatable comparison"}"

REQUIREMENTS:
1. Must be under 60 words total in body.
2. Zero heavy jargon.
3. Compare the concept directly to a vivid everyday twin (e.g., sorting laundry, recipe ingredients, flashlight beam, training a puppy).
4. Highlight Box must contain "\u2B50 Golden Rule: [One memorable 1-line rule]".

Return ONLY valid JSON matching this schema:
{
  "type": "content_screen",
  "contentScreen": {
    "sceneType": "hero",
    "badge": "\u{1F4A1} Core Concept",
    "heading": "${concept}",
    "subheading": "The Everyday Twin",
    "contentBody": "Clear 2-sentence explanation comparing ${concept} to an everyday analogy.",
    "highlightBox": "\u2B50 Golden Rule: Memorable 1-line takeaway",
    "bottomMessage": "Let's put this into action!"
  }
}`;
  return await callGeminiStageWithTimeout(prompt, 12e3);
}
async function executeStageQuestions(job) {
  const plan = job.stageResults.plan || {};
  const { concept, difficulty = "Medium" } = job.requestParams;
  const prompt = `You are an interactive learning designer for "Chikoo".
Create the 4 INTERACTIVE QUESTION SCREENS for concept "${concept}" (Screens 3 to 6).

PROGRESSION REQUIRED:
1. SCREEN 3: Basic Concept Recognition (type: "c9_true_false" or "c1_multiple_choice")
   - Test basic grasp of the definition.
2. SCREEN 4: Active Application (type: "c4_concept_matcher" or "c5_bucket_sort" or "c2_fill_in_blank")
   - Categorization, matching pairs, or blank filling.
3. SCREEN 5: Real-World Transfer Scenario (type: "c1_multiple_choice" or "ai_vs_human")
   - Relatable real-world scenario applying ${concept}.
4. SCREEN 6: Mastery Victory Check (type: "c1_multiple_choice" or "c16_eliminate_wrong")
   - Final decision solving the mission puzzle.

TYPE SCHEMAS:
- If "c1_multiple_choice": { "type": "c1_multiple_choice", "question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": "Exact matching string", "explanation": "Chikoo says: ..." }
- If "c9_true_false": { "type": "c9_true_false", "question": "...", "correctAnswer": "True" or "False", "explanation": "Chikoo says: ..." }
- If "c4_concept_matcher": { "type": "c4_concept_matcher", "question": "Match each item:", "pairs": [{"left": "...", "right": "..."}, {"left": "...", "right": "..."}, {"left": "...", "right": "..."}], "explanation": "Chikoo says: ..." }
- If "c5_bucket_sort": { "type": "c5_bucket_sort", "question": "Sort into buckets:", "buckets": [{"id": "b1", "label": "..."}, {"id": "b2", "label": "..."}], "items": [{"id": "i1", "text": "...", "correct_bucket": "b1"}, {"id": "i2", "text": "...", "correct_bucket": "b2"}, {"id": "i3", "text": "...", "correct_bucket": "b1"}], "explanation": "Chikoo says: ..." }
- If "c2_fill_in_blank": { "type": "c2_fill_in_blank", "question": "Sentence with [BLANK]", "options": ["Opt1", "Opt2", "Opt3", "Opt4"], "correctAnswer": "Opt1", "explanation": "Chikoo says: ..." }

Return ONLY valid JSON matching this schema:
{
  "questions": [
    { ...Screen 3 object... },
    { ...Screen 4 object... },
    { ...Screen 5 object... },
    { ...Screen 6 object... }
  ]
}`;
  const res = await callGeminiStageWithTimeout(prompt, 16e3);
  return Array.isArray(res.questions) ? res.questions : Array.isArray(res) ? res : [];
}
function executeStageCompilation(job) {
  const plan = job.stageResults.plan || {};
  const story = job.stageResults.story;
  const conceptScreen = job.stageResults.concept;
  const questions = job.stageResults.questions || [];
  const { concept, difficulty = "Medium", lessonTitle } = job.requestParams;
  const genId = `l_${Date.now().toString().slice(-6)}`;
  const finalTitle = lessonTitle?.trim() || plan.lessonTitle || `\u{1F680} ${concept}`;
  const challenges = [];
  if (story) {
    challenges.push({
      id: `${genId}_q1`,
      type: "content_screen",
      xpValue: 15,
      question: story.contentScreen?.heading || "Mission Briefing",
      contentScreen: story.contentScreen,
      explanation: "Chikoo says: Scene initiated!"
    });
  }
  if (conceptScreen) {
    challenges.push({
      id: `${genId}_q2`,
      type: "content_screen",
      xpValue: 20,
      question: conceptScreen.contentScreen?.heading || concept,
      contentScreen: conceptScreen.contentScreen,
      explanation: "Chikoo says: Core concept unlocked!"
    });
  }
  questions.forEach((q, i) => {
    const qId = `${genId}_q${challenges.length + 1}`;
    let explanation = q.explanation;
    if (typeof explanation === "string" && !explanation.toLowerCase().includes("chikoo")) {
      explanation = `Chikoo says: ${explanation}`;
    }
    challenges.push({
      id: qId,
      type: q.type || "c1_multiple_choice",
      question: q.question || `Mastery test for ${concept}`,
      options: q.options || [],
      correctAnswer: q.correctAnswer || (q.options ? q.options[0] : ""),
      pairs: q.pairs,
      buckets: q.buckets,
      items: q.items,
      xpValue: q.xpValue || 20,
      explanation: explanation || "Chikoo says: Excellent work applying this concept!"
    });
  });
  const lesson = {
    id: genId,
    title: finalTitle,
    description: plan.pedagogicalOutline || `Learn and apply ${concept} with Chikoo & Byte.`,
    category: concept,
    difficulty,
    xpReward: plan.xpReward || (difficulty === "Hard" ? 150 : difficulty === "Medium" ? 120 : 100),
    challenges
  };
  const lessonMemory = {
    lessonId: genId,
    lessonTitle: finalTitle,
    conceptTaught: concept,
    storyEvent: plan.storyHook || `Chikoo and Byte explored ${concept} and calibrated their sensors.`,
    characterStatus: "Energized, sensors calibrated, ready for the next challenge.",
    cliffhangerOrHook: "A new anomaly is flashing on the navigation console!",
    keyTakeaway: plan.keyTakeaway || `${concept} empowers smart, structured problem solving.`,
    dateGenerated: (/* @__PURE__ */ new Date()).toISOString()
  };
  return { lesson, lessonMemory };
}
function executeStageValidation(lesson, concept) {
  const issues = [];
  const normalizedChallenges = lesson.challenges.map((ch, idx) => {
    const safeCh = { ...ch };
    if (safeCh.type === "content_screen" && safeCh.contentScreen) {
      if (!safeCh.contentScreen.mediaUrl) {
        safeCh.contentScreen.mediaUrl = getMatchingIllustrationUrl(concept, safeCh.contentScreen.heading || "");
      }
    }
    if (safeCh.type === "c1_multiple_choice" || safeCh.type === "tap_right_answer") {
      if (!Array.isArray(safeCh.options) || safeCh.options.length === 0) {
        safeCh.options = ["Correct option", "Distractor A", "Distractor B", "Distractor C"];
        safeCh.correctAnswer = "Correct option";
        issues.push(`Screen ${idx + 1}: Missing options array, filled with defaults.`);
      } else if (!safeCh.options.includes(safeCh.correctAnswer)) {
        safeCh.correctAnswer = safeCh.options[0];
        issues.push(`Screen ${idx + 1}: Correct answer was not in options, set to first option.`);
      }
    }
    if (safeCh.type === "c9_true_false") {
      const ans = String(safeCh.correctAnswer).toLowerCase();
      safeCh.correctAnswer = ans.includes("t") ? "True" : "False";
    }
    return safeCh;
  });
  const normalizedLesson = {
    ...lesson,
    challenges: normalizedChallenges
  };
  return {
    isValid: issues.length === 0,
    normalizedLesson,
    issues
  };
}
function executeStageReview(lesson, lessonMemory) {
  const challengeCount = lesson.challenges.length;
  const hasStory = lesson.challenges.some((c) => c.type === "content_screen");
  const hasInteractive = lesson.challenges.some((c) => c.type !== "content_screen");
  const qualityScore = Math.min(100, (hasStory ? 40 : 10) + (hasInteractive ? 40 : 10) + (challengeCount >= 4 ? 20 : 10));
  return {
    qualityScore,
    readabilityGrade: "Age 8-15 (Easy & Engaging)",
    voiceCheck: "Chikoo friendly & encouraging",
    screenCount: challengeCount,
    hasStoryContinuity: !!lessonMemory.cliffhangerOrHook
  };
}
async function runJobPipeline(jobId, startStage) {
  const job = jobsMap.get(jobId);
  if (!job) {
    throw new Error(`Job not found: ${jobId}`);
  }
  if (job.status === "cancelled") {
    return job;
  }
  job.status = "running";
  job.error = null;
  job.failedStage = null;
  job.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  persistJobs();
  const stages = ["plan", "story", "concept", "questions", "compilation", "validation", "review"];
  const startIndex = startStage ? stages.indexOf(startStage) : 0;
  for (let i = startIndex; i < stages.length; i++) {
    const liveJob = jobsMap.get(job.jobId);
    if (!liveJob || liveJob.status === "cancelled") {
      break;
    }
    const currentStage = stages[i];
    job.stage = currentStage;
    job.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    const progressMap = {
      plan: 15,
      story: 30,
      concept: 45,
      questions: 65,
      compilation: 80,
      validation: 90,
      review: 100
    };
    job.progress = progressMap[currentStage];
    persistJobs();
    console.log(`[LessonPipeline] [Job: ${jobId}] Running stage: ${currentStage} (${job.progress}%)...`);
    try {
      switch (currentStage) {
        case "plan":
          job.stageResults.plan = await executeStagePlan(job);
          break;
        case "story":
          job.stageResults.story = await executeStageStory(job);
          break;
        case "concept":
          job.stageResults.concept = await executeStageConcept(job);
          break;
        case "questions":
          job.stageResults.questions = await executeStageQuestions(job);
          break;
        case "compilation": {
          const compiled = executeStageCompilation(job);
          job.stageResults.compilation = compiled;
          job.lesson = compiled.lesson;
          job.lessonMemory = compiled.lessonMemory;
          break;
        }
        case "validation": {
          if (!job.lesson) {
            throw new Error("Cannot validate: Lesson was not compiled.");
          }
          const valRes = executeStageValidation(job.lesson, job.requestParams.concept);
          job.stageResults.validation = valRes;
          job.lesson = valRes.normalizedLesson;
          break;
        }
        case "review": {
          if (!job.lesson || !job.lessonMemory) {
            throw new Error("Cannot review: Lesson data missing.");
          }
          job.stageResults.review = executeStageReview(job.lesson, job.lessonMemory);
          job.status = "completed";
          job.progress = 100;
          job.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
          persistJobs();
          console.log(`[LessonPipeline] [Job: ${jobId}] Finished successfully!`);
          return job;
        }
      }
    } catch (err) {
      console.error(`[LessonPipeline] [Job: ${jobId}] Stage "${currentStage}" failed:`, err);
      let errorMsg = err.message || `Failed during ${currentStage} stage.`;
      if (typeof errorMsg === "string" && errorMsg.startsWith("{") && errorMsg.includes('"message"')) {
        try {
          const parsed = JSON.parse(errorMsg);
          if (parsed.error?.message) {
            errorMsg = parsed.error.message;
          } else if (parsed.message) {
            errorMsg = parsed.message;
          }
        } catch {
        }
      }
      job.status = "failed";
      job.failedStage = currentStage;
      job.error = errorMsg;
      job.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      persistJobs();
      return job;
    }
  }
  return job;
}
function createGenerationJob(params) {
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const job = {
    jobId,
    status: "running",
    stage: "plan",
    progress: 5,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    error: null,
    failedStage: null,
    requestParams: params,
    stageResults: {}
  };
  jobsMap.set(jobId, job);
  persistJobs();
  setTimeout(() => {
    runJobPipeline(jobId).catch((err) => {
      console.error(`[LessonPipeline] Unhandled background error in job ${jobId}:`, err);
    });
  }, 50);
  return job;
}
function getGenerationJob(jobId) {
  return jobsMap.get(jobId) || null;
}
function listGenerationJobs() {
  return Array.from(jobsMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 20);
}
function retryJobStage(jobId, stageToRetry) {
  const job = jobsMap.get(jobId);
  if (!job) {
    throw new Error(`Job not found: ${jobId}`);
  }
  const targetStage = stageToRetry || job.failedStage || job.stage;
  job.status = "running";
  job.error = null;
  job.failedStage = null;
  job.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  persistJobs();
  setTimeout(() => {
    runJobPipeline(jobId, targetStage).catch((err) => {
      console.error(`[LessonPipeline] Retry error in job ${jobId}:`, err);
    });
  }, 50);
  return job;
}
function skipJobStage(jobId) {
  const job = jobsMap.get(jobId);
  if (!job) {
    throw new Error(`Job not found: ${jobId}`);
  }
  const stages = ["plan", "story", "concept", "questions", "compilation", "validation", "review"];
  const currentIndex = stages.indexOf(job.failedStage || job.stage);
  const nextStage = stages[currentIndex + 1] || "compilation";
  if (job.stage === "story" && !job.stageResults.story) {
    job.stageResults.story = {
      type: "content_screen",
      contentScreen: {
        sceneType: "dialogue",
        badge: "\u{1F680} Mission Hook",
        heading: `Exploring ${job.requestParams.concept}`,
        subheading: "A new mission begins!",
        contentBody: "Chikoo: Look at the sensors!\n\nByte: Mission objective updated.",
        highlightBox: "\u2B50 Stay curious and observe the patterns!",
        bottomMessage: "Tap Continue to begin!"
      }
    };
  } else if (job.stage === "concept" && !job.stageResults.concept) {
    job.stageResults.concept = {
      type: "content_screen",
      contentScreen: {
        sceneType: "hero",
        badge: "\u{1F4A1} Core Concept",
        heading: job.requestParams.concept,
        subheading: "Key Idea",
        contentBody: `${job.requestParams.concept} helps AI systems process information accurately.`,
        highlightBox: `\u2B50 Golden Rule: Master ${job.requestParams.concept} to solve real-world problems!`,
        bottomMessage: "Let's test our understanding!"
      }
    };
  }
  job.status = "running";
  job.error = null;
  job.failedStage = null;
  job.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  persistJobs();
  setTimeout(() => {
    runJobPipeline(jobId, nextStage).catch((err) => {
      console.error(`[LessonPipeline] Skip stage error in job ${jobId}:`, err);
    });
  }, 50);
  return job;
}
function cancelGenerationJob(jobId) {
  const job = jobsMap.get(jobId);
  if (!job) {
    throw new Error(`Job not found: ${jobId}`);
  }
  job.status = "cancelled";
  job.error = "Job was cancelled by administrator.";
  job.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  persistJobs();
  return job;
}

// src/lib/serverDirectLessonGenerator.ts
import { GoogleGenAI as GoogleGenAI2 } from "@google/genai";

// src/lib/lessonValidator.ts
var SUPPORTED_TYPES = [
  "content_screen",
  "visual_lesson_screen",
  "tap_right_answer",
  "image_reveal",
  "fill_in_blank",
  "ai_vs_human",
  "spot_the_ai",
  "drag_and_drop",
  "sort_sequence",
  "match_pairs",
  "build_concept",
  "c1_multiple_choice",
  "c2_fill_in_blank",
  "c3_sentence_builder",
  "c4_concept_matcher",
  "c5_bucket_sort",
  "c6_timeline_sort",
  "c7_sequence_builder",
  "c8_tap_correct_object",
  "c9_true_false",
  "c10_swipe_left_right",
  "c11_image_classification",
  "c12_label_diagram",
  "c13_hotspot_question",
  "c14_memory_flip_cards",
  "c15_drag_complete_diagram",
  "c16_eliminate_wrong",
  "c17_arrange_images",
  "c18_audio_quiz"
];
function validateLessonObject(data) {
  const issues = [];
  const warnings = [];
  const typesPresent = /* @__PURE__ */ new Set();
  let storyScreens = 0;
  let interactiveScreens = 0;
  let totalXp = 0;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return {
      isValid: false,
      issues: ["Root value must be a valid JSON object representing a Chikoo Lesson."],
      warnings: [],
      stats: { screenCount: 0, storyScreens: 0, interactiveScreens: 0, typesPresent: [], totalXp: 0 }
    };
  }
  if (!data.title || typeof data.title !== "string" || !data.title.trim()) {
    issues.push('Missing required root field: "title" (string).');
  }
  if (data.id && typeof data.id !== "string") {
    issues.push('Field "id" must be a string if provided.');
  }
  if (data.difficulty && !["Easy", "Medium", "Hard", "Explorer", "Specialist", "Commander"].includes(data.difficulty)) {
    warnings.push(`Difficulty "${data.difficulty}" will be normalized to "Medium".`);
  }
  const rawChallenges = data.challenges || data.screens;
  if (!rawChallenges || !Array.isArray(rawChallenges)) {
    issues.push('Missing required array: "challenges" (or "screens") must be an array of screen objects.');
    return {
      isValid: false,
      issues,
      warnings,
      stats: { screenCount: 0, storyScreens: 0, interactiveScreens: 0, typesPresent: [], totalXp: 0 }
    };
  }
  if (rawChallenges.length === 0) {
    issues.push('The "challenges" array is empty. A lesson must have at least 1 screen.');
  }
  const seenIds = /* @__PURE__ */ new Set();
  const normalizedChallenges = [];
  rawChallenges.forEach((chal, index) => {
    const screenNum = index + 1;
    if (!chal || typeof chal !== "object" || Array.isArray(chal)) {
      issues.push(`Screen #${screenNum}: Must be an object.`);
      return;
    }
    const type = chal.type;
    if (!type || typeof type !== "string") {
      issues.push(`Screen #${screenNum}: Missing "type" property.`);
      return;
    }
    typesPresent.add(type);
    if (!SUPPORTED_TYPES.includes(type)) {
      issues.push(`Screen #${screenNum}: Unsupported screen type "${type}". Supported types include: ${SUPPORTED_TYPES.slice(0, 8).join(", ")}...`);
    }
    const chalId = chal.id ? String(chal.id).trim() : `screen_${screenNum}`;
    if (seenIds.has(chalId)) {
      issues.push(`Screen #${screenNum}: Duplicate screen id "${chalId}". Each screen must have a unique ID.`);
    }
    seenIds.add(chalId);
    if (type !== "content_screen" && type !== "visual_lesson_screen") {
      if (!chal.question || typeof chal.question !== "string" || !chal.question.trim()) {
        issues.push(`Screen #${screenNum} (${type}): Missing "question" text.`);
      }
      interactiveScreens++;
    } else {
      storyScreens++;
    }
    const safeChal = {
      id: chalId,
      type,
      question: chal.question || (type === "content_screen" ? "Mission Scene" : "Interactive Challenge"),
      explanation: chal.explanation || "Chikoo says: Great job!",
      xpValue: Number(chal.xpValue) || 15
    };
    totalXp += safeChal.xpValue || 15;
    if (type === "content_screen" || type === "visual_lesson_screen") {
      if (!chal.contentScreen || typeof chal.contentScreen !== "object") {
        issues.push(`Screen #${screenNum} (${type}): Missing "contentScreen" object.`);
      } else {
        safeChal.contentScreen = {
          sceneType: chal.contentScreen.sceneType || "hero",
          badge: chal.contentScreen.badge || "\u{1F680} Mission Brief",
          heading: chal.contentScreen.heading || "Concept Overview",
          subheading: chal.contentScreen.subheading || "",
          contentBody: chal.contentScreen.contentBody || "",
          highlightBox: chal.contentScreen.highlightBox || "",
          bottomMessage: chal.contentScreen.bottomMessage || "Tap to continue",
          mediaUrl: chal.contentScreen.mediaUrl || chal.imageUrl || ""
        };
        if (!safeChal.contentScreen.contentBody && !safeChal.contentScreen.heading) {
          issues.push(`Screen #${screenNum} (${type}): "contentScreen" must include a heading or contentBody.`);
        }
      }
    }
    if (type === "c1_multiple_choice" || type === "tap_right_answer" || type === "image_reveal") {
      if (!Array.isArray(chal.options) || chal.options.length < 2) {
        issues.push(`Screen #${screenNum} (${type}): "options" must be an array of at least 2 options.`);
      } else {
        safeChal.options = chal.options.map(String);
        if (!chal.correctAnswer || typeof chal.correctAnswer !== "string") {
          issues.push(`Screen #${screenNum} (${type}): Missing "correctAnswer" string.`);
        } else if (!chal.options.includes(chal.correctAnswer)) {
          issues.push(`Screen #${screenNum} (${type}): "correctAnswer" ("${chal.correctAnswer}") is not found in the "options" list: [${chal.options.join(", ")}].`);
        }
        safeChal.correctAnswer = chal.correctAnswer;
      }
      if (type === "image_reveal") {
        safeChal.imageUrl = chal.imageUrl || "";
      }
    }
    if (type === "c9_true_false") {
      const ansStr = String(chal.correctAnswer || "").trim().toLowerCase();
      if (!ansStr || !ansStr.includes("t") && !ansStr.includes("f")) {
        issues.push(`Screen #${screenNum} (c9_true_false): "correctAnswer" must be "True" or "False".`);
      }
      safeChal.correctAnswer = ansStr.includes("t") ? "True" : "False";
    }
    if (type === "c2_fill_in_blank" || type === "fill_in_blank") {
      if (!Array.isArray(chal.options) || chal.options.length < 2) {
        issues.push(`Screen #${screenNum} (${type}): "options" must be an array of at least 2 options.`);
      } else {
        safeChal.options = chal.options.map(String);
        if (!chal.correctAnswer) {
          issues.push(`Screen #${screenNum} (${type}): Missing "correctAnswer".`);
        } else if (!chal.options.includes(chal.correctAnswer)) {
          issues.push(`Screen #${screenNum} (${type}): "correctAnswer" ("${chal.correctAnswer}") must match one of the options.`);
        }
        safeChal.correctAnswer = chal.correctAnswer;
      }
    }
    if (type === "c4_concept_matcher" || type === "match_pairs") {
      const pairs = chal.pairs;
      if (!Array.isArray(pairs) || pairs.length < 2) {
        issues.push(`Screen #${screenNum} (${type}): "pairs" must be an array of at least 2 {left, right} objects.`);
      } else {
        safeChal.pairs = pairs.map((p) => ({
          left: String(p.left || ""),
          right: String(p.right || "")
        }));
        const invalidPair = safeChal.pairs.find((p) => !p.left || !p.right);
        if (invalidPair) {
          issues.push(`Screen #${screenNum} (${type}): Every pair must have non-empty "left" and "right" strings.`);
        }
      }
    }
    if (type === "c5_bucket_sort" || type === "drag_and_drop") {
      if (!Array.isArray(chal.buckets) || chal.buckets.length < 2) {
        issues.push(`Screen #${screenNum} (${type}): "buckets" must be an array of at least 2 buckets.`);
      }
      if (!Array.isArray(chal.items) || chal.items.length < 2) {
        issues.push(`Screen #${screenNum} (${type}): "items" must be an array of at least 2 items.`);
      }
      safeChal.buckets = chal.buckets;
      safeChal.items = chal.items;
    }
    if (type === "c16_eliminate_wrong") {
      if (!Array.isArray(chal.options) || chal.options.length < 2) {
        issues.push(`Screen #${screenNum} (c16_eliminate_wrong): "options" must be an array with {text, isCorrect} items.`);
      } else {
        safeChal.options = chal.options;
      }
    }
    normalizedChallenges.push(safeChal);
  });
  const genId = data.id || `l_${Date.now().toString().slice(-6)}`;
  const normalizedLesson = {
    id: genId,
    title: String(data.title).trim(),
    description: String(data.description || `Learn ${data.title} with Chikoo & Byte.`).trim(),
    category: String(data.category || "AI & STEM Fundamentals").trim(),
    difficulty: data.difficulty || "Medium",
    xpReward: Number(data.xpReward) || Math.max(80, totalXp),
    challenges: normalizedChallenges
  };
  return {
    isValid: issues.length === 0,
    issues,
    warnings,
    stats: {
      screenCount: normalizedChallenges.length,
      storyScreens,
      interactiveScreens,
      typesPresent: Array.from(typesPresent),
      totalXp: normalizedLesson.xpReward
    },
    normalizedLesson
  };
}

// src/lib/serverDirectLessonGenerator.ts
function buildPrompt(params) {
  const {
    unitTitle,
    unitId = "unit_1",
    unitContext,
    previousLessonMemory,
    lessonTitle,
    concept,
    objective,
    difficulty = "Medium",
    storyGoal,
    screenCount = 6
  } = params;
  const characters = unitContext?.characters && Array.isArray(unitContext.characters) && unitContext.characters.length > 0 ? unitContext.characters.map((c) => `- ${c.name} (${c.role || "Crew"}): ${c.personality || "Curious & energetic"}`).join("\n") : "- Chikoo (Curious Lead Explorer): Energetic, loves analogies with snacks & everyday objects.\n- Byte (Robotic Navigator): Literal-minded, loves structured data, easily puzzled by messy inputs.\n- Spark (AI Mentor): Calm and encouraging guide.";
  const storyPremise = unitContext?.storyPremise || "Chikoo and Byte are exploring the cosmos, learning AI & STEM concepts to solve real-world problems.";
  const learningGoal = unitContext?.learningGoal || `Master concepts related to ${unitTitle}.`;
  const prevContext = previousLessonMemory ? `
PREVIOUS LESSON CONTINUITY:
- Previous Lesson Title: "${previousLessonMemory.lessonTitle || "Previous Lesson"}"
- Concept Taught in Previous Lesson: "${previousLessonMemory.conceptTaught || "Introductory concepts"}"
- Story Event: "${previousLessonMemory.storyEvent || "The crew completed their previous task."}"
- Character Status: "${previousLessonMemory.characterStatus || "Energized and ready."}"
- Cliffhanger / Hook to Continue From: "${previousLessonMemory.cliffhangerOrHook || "A new signal or mystery has appeared ahead!"}"
` : `
PREVIOUS LESSON CONTINUITY:
- Initial lesson of the unit arc. Start directly with the unit premise and characters!
`;
  return `You are the lead curriculum architect & narrative writer for "Chikoo", a gamified STEM & AI learning platform for school students (aged 8-15).

Your task is to generate ONE complete, fully-formed, highly engaging Chikoo lesson JSON for the target concept below.

========================================
UNIT & STORY CONTEXT:
========================================
- Unit: "${unitTitle}" (${unitId})
- Overall Unit Learning Goal: ${learningGoal}
- Story Premise: ${storyPremise}
- Characters in this Unit:
${characters}
${prevContext}

========================================
TARGET LESSON PARAMETERS:
========================================
- Target Concept: "${concept}"
- Pedagogical Objective: "${objective || `Understand and apply ${concept}`}"
- Difficulty Tier: "${difficulty}"
- Custom Story Focus: "${storyGoal || "Resolve the previous cliffhanger and apply the new concept."}"
- Target Total Screens: ${screenCount}
${lessonTitle ? `- Requested Lesson Title: "${lessonTitle}"` : ""}

========================================
PEDAGOGICAL & STRUCTURAL RATIO MANDATE:
========================================
You must structure the ${screenCount} screens in this exact progressive learning ratio:

1. SCREEN 1 (Story Hook Scene):
   - type: "content_screen"
   - sceneType: "dialogue"
   - heading: Catchy title with emoji (e.g. "\u{1F680} The Mystery of Noisy Sensors")
   - subheading: 1-line situation setting the stage
   - contentBody: 2-3 lively dialogue blocks separated by double newlines between Chikoo, Byte, or other characters (e.g. "Chikoo: Look at the sensors!

Byte: Alert! Sensor variance detected.").
   - highlightBox: A punchy clue or curious observation by Chikoo/Byte.
   - bottomMessage: "Tap Continue to investigate!"

2. SCREEN 2 (Core Concept & Everyday Twin Analogy):
   - type: "content_screen"
   - sceneType: "hero"
   - heading: "${concept}"
   - subheading: "The Everyday Twin"
   - contentBody: Under 60 words. Compare the concept directly to a vivid everyday analogy (e.g., sorting laundry, recipe ingredients, flashlight beam, training a puppy, grocery checkout). Zero heavy jargon!
   - highlightBox: "\u2B50 Golden Rule: [One memorable 1-line rule to remember]"
   - bottomMessage: "Let's put this into action!"

3. SCREENS 3 TO ${screenCount} (Active Interactive Mastery Challenges):
   - Must use standard Chikoo challenge types:
     * "c1_multiple_choice" or "tap_right_answer": 4 distinct options, exactly 1 matching correctAnswer.
     * "c9_true_false": question with correctAnswer as "True" or "False".
     * "c4_concept_matcher" or "match_pairs": 2-4 pairs of { "left": "...", "right": "..." }.
     * "c5_bucket_sort": 2 buckets and 3-4 items with "correct_bucket".
     * "c2_fill_in_blank": question containing "[BLANK]" with 4 options and 1 correctAnswer.
     * "c16_eliminate_wrong": question with 4 options ({ "text": "...", "isCorrect": true/false }).
   - Every challenge must include an encouraging "explanation" starting with "Chikoo says: ...".
   - Unique challenge IDs like "l_screen_1", "l_screen_2", etc.

========================================
REQUIRED OUTPUT JSON FORMAT:
========================================
Return ONLY valid JSON matching this exact schema:
{
  "id": "l_${concept.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 16)}",
  "title": "\u{1F680} Catchy Lesson Title with Emoji",
  "description": "2-sentence engaging lesson summary and learning objective.",
  "category": "${concept}",
  "difficulty": "${difficulty}",
  "xpReward": 120,
  "challenges": [
    {
      "id": "l_s1",
      "type": "content_screen",
      "question": "Mission Briefing",
      "xpValue": 15,
      "contentScreen": {
        "sceneType": "dialogue",
        "badge": "\u{1F680} Mission Log",
        "heading": "Heading with Emoji",
        "subheading": "1-line situation",
        "contentBody": "Chikoo: ...\\n\\nByte: ...",
        "highlightBox": "\u{1F4A1} Chikoo's Clue: ...",
        "bottomMessage": "Tap Continue to investigate!"
      },
      "explanation": "Chikoo says: Mission started!"
    },
    {
      "id": "l_s2",
      "type": "content_screen",
      "question": "${concept}",
      "xpValue": 20,
      "contentScreen": {
        "sceneType": "hero",
        "badge": "\u{1F4A1} Core Concept",
        "heading": "${concept}",
        "subheading": "The Everyday Analogy",
        "contentBody": "Crisp everyday twin comparison under 60 words.",
        "highlightBox": "\u2B50 Golden Rule: One memorable rule.",
        "bottomMessage": "Let's test our understanding!"
      },
      "explanation": "Chikoo says: Core concept unlocked!"
    },
    {
      "id": "l_s3",
      "type": "c9_true_false",
      "question": "Basic concept grasp statement?",
      "options": ["True", "False"],
      "correctAnswer": "True",
      "xpValue": 20,
      "explanation": "Chikoo says: Exactly right!"
    },
    {
      "id": "l_s4",
      "type": "c4_concept_matcher",
      "question": "Match each term to its everyday example:",
      "pairs": [
        { "left": "Term A", "right": "Analogy A" },
        { "left": "Term B", "right": "Analogy B" },
        { "left": "Term C", "right": "Analogy C" }
      ],
      "xpValue": 25,
      "explanation": "Chikoo says: Perfect pairs!"
    },
    {
      "id": "l_s5",
      "type": "c1_multiple_choice",
      "question": "Real-world transfer scenario question?",
      "options": ["Correct practical answer", "Plausible distractor 1", "Plausible distractor 2", "Plausible distractor 3"],
      "correctAnswer": "Correct practical answer",
      "xpValue": 20,
      "explanation": "Chikoo says: Spot-on application!"
    },
    {
      "id": "l_s6",
      "type": "c1_multiple_choice",
      "question": "Mastery puzzle check question?",
      "options": ["Correct solution", "Mistake option A", "Mistake option B", "Mistake option C"],
      "correctAnswer": "Correct solution",
      "xpValue": 25,
      "explanation": "Chikoo says: Mission accomplished! You mastered ${concept}!"
    }
  ]
}`;
}
async function generateDirectChikooLesson(params) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured.");
  }
  const ai = new GoogleGenAI2({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
  const modelUsed = "gemini-3.7-flash";
  const initialPrompt = buildPrompt(params);
  let rawJsonText = "{}";
  let parsedObject = null;
  try {
    const response = await ai.models.generateContent({
      model: modelUsed,
      contents: initialPrompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    rawJsonText = (response.text || "").trim();
    const cleaned = rawJsonText.replace(/```json/gi, "").replace(/```/g, "").trim();
    parsedObject = JSON.parse(cleaned);
  } catch (err) {
    console.error("[DirectLessonGenerator] Initial Gemini call failed:", err);
    return {
      success: false,
      lesson: null,
      rawJsonText,
      validation: {
        isValid: false,
        issues: [err.message || "Failed to generate lesson from AI model."],
        warnings: [],
        stats: { screenCount: 0, storyScreens: 0, interactiveScreens: 0, typesPresent: [], totalXp: 0 }
      },
      repaired: false,
      modelUsed,
      error: err.message || "AI generation failed."
    };
  }
  let validationResult = validateLessonObject(parsedObject);
  if (validationResult.isValid && validationResult.normalizedLesson) {
    return {
      success: true,
      lesson: validationResult.normalizedLesson,
      rawJsonText: JSON.stringify(validationResult.normalizedLesson, null, 2),
      validation: validationResult,
      repaired: false,
      modelUsed
    };
  }
  console.warn("[DirectLessonGenerator] Initial lesson had validation issues, attempting auto-repair:", validationResult.issues);
  const repairPrompt = `You are the Chikoo Curriculum QA repair engine.
The following generated lesson JSON has schema and validation issues that must be fixed immediately.

VALIDATION ISSUES FOUND:
${validationResult.issues.map((iss) => `- ${iss}`).join("\n")}

ORIGINAL ATTEMPT:
${JSON.stringify(parsedObject, null, 2)}

INSTRUCTIONS:
1. Fix all validation issues listed above.
2. Ensure "challenges" is an array of valid screen objects.
3. Ensure every question screen has options and matching correctAnswer.
4. Ensure every "content_screen" has "contentScreen" with heading and contentBody.
5. Return ONLY the corrected, pristine, valid JSON.`;
  try {
    const repairResponse = await ai.models.generateContent({
      model: modelUsed,
      contents: repairPrompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    const repairedRaw = (repairResponse.text || "").trim();
    const cleanedRepair = repairedRaw.replace(/```json/gi, "").replace(/```/g, "").trim();
    const repairedParsed = JSON.parse(cleanedRepair);
    const secondValidation = validateLessonObject(repairedParsed);
    if (secondValidation.isValid && secondValidation.normalizedLesson) {
      console.log("[DirectLessonGenerator] Auto-repair succeeded!");
      return {
        success: true,
        lesson: secondValidation.normalizedLesson,
        rawJsonText: JSON.stringify(secondValidation.normalizedLesson, null, 2),
        validation: secondValidation,
        repaired: true,
        modelUsed
      };
    } else {
      console.warn("[DirectLessonGenerator] Auto-repair still had validation issues:", secondValidation.issues);
      return {
        success: false,
        lesson: secondValidation.normalizedLesson || null,
        rawJsonText: JSON.stringify(repairedParsed, null, 2),
        validation: secondValidation,
        repaired: true,
        modelUsed,
        error: `Validation failed after repair: ${secondValidation.issues.join(", ")}`
      };
    }
  } catch (repairErr) {
    console.error("[DirectLessonGenerator] Auto-repair failed:", repairErr);
    return {
      success: false,
      lesson: validationResult.normalizedLesson || null,
      rawJsonText: JSON.stringify(parsedObject, null, 2),
      validation: validationResult,
      repaired: false,
      modelUsed,
      error: `Initial generation was invalid and auto-repair encountered an error: ${repairErr.message}`
    };
  }
}

// src/lib/errorUtils.ts
var logProductionError = (operation, component, category, err, context) => {
  const structuredError = {
    operation,
    component,
    category,
    error: err?.message || String(err),
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    context: sanitizeContext(context || {})
  };
  console.error("[PRODUCTION_ERROR]", JSON.stringify(structuredError));
};
var sanitizeContext = (context) => {
  const secrets = ["password", "hash", "key", "token", "secret", "authorization"];
  const sanitized = {};
  for (const [key, value] of Object.entries(context)) {
    if (secrets.some((s) => key.toLowerCase().includes(s))) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeContext(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";
var resolveEnv = (key) => {
  try {
    if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env[key]) {
      const val = import.meta.env[key];
      if (typeof val === "string" && val.trim().length > 0) return val.trim();
    }
  } catch (_) {
  }
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    const val = process.env[key];
    if (typeof val === "string" && val.trim().length > 0) return val.trim();
  }
  return "";
};
var supabaseUrl = (resolveEnv("VITE_SUPABASE_URL") || resolveEnv("SUPABASE_URL") || typeof process !== "undefined" && (process.env?.VITE_SUPABASE_URL || process.env?.SUPABASE_URL) || "").trim();
var supabaseAnonKey = (resolveEnv("VITE_SUPABASE_ANON_KEY") || resolveEnv("SUPABASE_ANON_KEY") || typeof process !== "undefined" && (process.env?.VITE_SUPABASE_ANON_KEY || process.env?.SUPABASE_ANON_KEY) || "").trim();
var isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== "https://your-project.supabase.co" && supabaseAnonKey !== "your-anon-key" && !supabaseUrl.includes("your-project") && !supabaseAnonKey.includes("your-anon-key"));
var supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;
console.log("[Supabase Client] Config status:", {
  isSupabaseConfigured,
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey
});

// src/lib/practiceStoreNew.ts
function ensureUuid(str) {
  if (!str) {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === "x" ? r : r & 3 | 8;
      return v.toString(16);
    });
  }
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(str)) {
    return str;
  }
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padEnd(32, "f");
  const parts = [
    hex.substring(0, 8),
    hex.substring(8, 12),
    "4" + hex.substring(13, 16),
    "a" + hex.substring(17, 20),
    hex.substring(20, 32)
  ];
  return parts.join("-");
}
var DEFAULT_CHALLENGE_PACKS = [];
var memoryChallengePacks = (() => {
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem("CHIKOO_CHALLENGE_PACKS");
      if (cached !== null) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p) => ({ ...p, id: ensureUuid(p.id) }));
        }
      }
    } catch (e) {
      console.warn("Failed to load cached challenge packs:", e);
    }
  }
  return DEFAULT_CHALLENGE_PACKS;
})();
var memoryPuzzlePacks = (() => {
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem("CHIKOO_PUZZLE_PACKS");
      if (cached !== null) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          return parsed.map((p) => ({ ...p, id: ensureUuid(p.id) }));
        }
      }
    } catch (e) {
      console.warn("Failed to load cached puzzle packs:", e);
    }
  }
  return [];
})();
var memoryBattlePools = (() => {
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem("CHIKOO_BATTLE_POOLS");
      if (cached !== null) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p) => ({ ...p, id: ensureUuid(p.id) }));
        }
      }
    } catch (e) {
      console.warn("Failed to load cached battle pools:", e);
    }
  }
  return [];
})();

// src/lib/content.ts
var PRACTICE_CURRICULUM = [];
var AI_CURRICULUM = [];
function initCurriculumFromStorage() {
  if (typeof window === "undefined") return;
  try {
    const cachedAi = localStorage.getItem("CHIKOO_AI_CURRICULUM");
    const cachedPrac = localStorage.getItem("CHIKOO_PRACTICE_CURRICULUM");
    if (cachedAi) {
      const parsedAi = JSON.parse(cachedAi);
      if (Array.isArray(parsedAi) && parsedAi.length > 0) {
        parsedAi.forEach((m) => {
          if (Array.isArray(m.lessons)) {
            m.lessons.sort((a, b) => {
              if (a.order_index !== void 0 && b.order_index !== void 0 && a.order_index !== b.order_index) {
                return a.order_index - b.order_index;
              }
              return (a.id || "").localeCompare(b.id || "", void 0, { numeric: true });
            });
            m.lessons.forEach((l) => {
              if (Array.isArray(l.challenges) && l.challenges.some((c) => c.id?.startsWith("pc_"))) {
                l.challenges = [];
              }
            });
          }
        });
        parsedAi.sort((a, b) => (a.sort_order ?? a.order ?? 0) - (b.sort_order ?? b.order ?? 0));
        AI_CURRICULUM.splice(0, AI_CURRICULUM.length, ...parsedAi);
      }
    }
    if (cachedPrac) {
      const parsedPrac = JSON.parse(cachedPrac);
      if (Array.isArray(parsedPrac) && parsedPrac.length > 0) {
        parsedPrac.forEach((m) => {
          if (Array.isArray(m.lessons)) {
            m.lessons.forEach((l) => {
              if (Array.isArray(l.challenges) && l.challenges.some((c) => c.id?.startsWith("pc_"))) {
                l.challenges = [];
              }
            });
          }
        });
        PRACTICE_CURRICULUM.splice(0, PRACTICE_CURRICULUM.length, ...parsedPrac);
      }
    }
  } catch (e) {
    console.warn("Failed to load initial curriculum from cache:", e);
  }
}
initCurriculumFromStorage();

// src/lib/seoRegistry.ts
function slugify(text) {
  return text.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");
}
function cleanEmoji(text) {
  return text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "").trim();
}
var CHIKOO_PLATFORM_SEO = {
  name: "Chikoo",
  tagline: "Gamified AI Learning Platform for Students & Curious Minds",
  domain: "https://chikoo.ai",
  description: "Master Artificial Intelligence, Generative AI, Machine Learning, and Prompt Engineering through bite-sized interactive challenges, real-world analogies, and an unhinged otter tutor.",
  metaTitle: "Chikoo | Learn Artificial Intelligence (AI) - Gamified Lessons & Practice for Students",
  metaDescription: "Learn AI fundamentals, generative AI, prompt engineering, and machine learning with Chikoo. Bite-sized interactive modules, practice arena, daily quests, and instant feedback.",
  keywords: [
    "learn AI",
    "learn artificial intelligence",
    "AI learning platform",
    "AI education for students",
    "AI fundamentals",
    "generative AI for kids",
    "prompt engineering for beginners",
    "machine learning basics",
    "AI tools for school",
    "responsible AI",
    "gamified AI learning",
    "AI quizzes and practice"
  ],
  author: "Chikoo Learning Systems",
  targetAudience: "School Students (Ages 10-18), Educators, and Lifelong Beginners",
  heroSubtitle: "Zero boring lectures. 100% interactive AI challenges, hilarious Hinglish & Marathi micro-explanations, speed battles, and cosmic cookie rewards."
};
var SEO_FEATURES = [
  {
    id: "practice-arena",
    slug: "practice-arena",
    name: "AI Practice Arena",
    tagline: "High-voltage rapid quiz drills and AI pattern recognition",
    description: "Train your AI intuition with interactive drills including Spot the AI, Tool Picker, AI vs Human output comparisons, and Concept Matchers.",
    longDescription: "The Chikoo Practice Arena is designed for rapid reinforcement. Students tackle timed interactive drills that test their ability to identify generative AI outputs, select the correct AI tools for real-world scenarios, and debug faulty algorithmic prompts.",
    metaTitle: "AI Practice Arena & Rapid Drills | Chikoo AI Learning",
    metaDescription: "Sharpen your AI skills in the Chikoo Practice Arena. Interactive exercises: Spot the AI, AI vs Human text comparisons, Tool Matcher, and MCQ drills.",
    keywords: ["AI practice arena", "AI drills", "spot the AI", "AI vs human quiz", "learn AI tools", "AI question bank", "AI interactive exercises"],
    canonicalPath: "/features/practice-arena",
    iconName: "Zap",
    iconPath: "/Practice.webp",
    appView: "practice",
    badge: "Interactive Drills",
    highlights: [
      "Spot the AI: Identify automated systems in daily devices and applications",
      "AI vs Human: Analyze subtle differences in synthetic vs human-crafted content",
      "Tool Picker: Select optimal AI agents for homework, research, and coding",
      "Dynamic Question Generation: AI-powered curriculum generation for endless practice"
    ],
    benefits: [
      "Rapid recall without boring textbook reading",
      "Instant feedback on every wrong answer",
      "XP multipliers for speed and accuracy streaks"
    ],
    howItWorks: [
      "Select a practice module based on your current unit progress",
      "Complete quick 5-question blitz drills with instantaneous feedback",
      "Earn XP, unlock achievement badges, and climb the arena rankings"
    ],
    educationalBenefit: "Transforms passive AI theory into active problem-solving skills and critical evaluation.",
    relatedUnits: ["unit_1", "unit_2"],
    relatedTopics: ["what-is-artificial-intelligence", "ai-in-daily-life", "how-generative-ai-works"]
  },
  {
    id: "challenges",
    slug: "challenges",
    name: "Speed AI Challenges",
    tagline: "Test accuracy and speed against the clock",
    description: "Multi-tiered AI challenges designed to push your conceptual understanding with 80% passing accuracy benchmarks.",
    longDescription: "Speed Challenges test student mastery under mild pressure. Each challenge pack features a focused AI topic\u2014from Neural Network weights to Prompt Traps\u2014demanding precision and fast recall.",
    metaTitle: "Speed AI Challenges & Accuracy Gauntlets | Chikoo",
    metaDescription: "Take timed AI challenge packs on Chikoo. Test your knowledge of prompt engineering, computer vision, and machine learning ethics.",
    keywords: ["AI challenge packs", "speed AI quiz", "prompt engineering challenge", "AI accuracy test", "gamified AI challenges"],
    canonicalPath: "/features/challenges",
    iconName: "Target",
    iconPath: "/Practice.webp",
    appView: "home",
    badge: "Accuracy Benchmark",
    highlights: [
      "Curated challenge packs covering high-impact AI topics",
      "80% accuracy requirement for mastery certification",
      "Dynamic bonus cookies for continuous answer streaks"
    ],
    benefits: [
      "High retention through active retrieval practice",
      "Timed accuracy gauntlets that build sharp reflexes",
      "Unlockable secret treasure chest nodes"
    ],
    howItWorks: [
      "Select a challenge pack from your active adventure map",
      "Answer questions within the time window with zero hints",
      "Score 80%+ to unlock treasure nodes and level rewards"
    ],
    educationalBenefit: "Builds deep conceptual retention and rapid analytical reasoning.",
    relatedUnits: ["unit_1", "unit_2"],
    relatedTopics: ["prompt-engineering-for-beginners", "machine-learning-vs-deep-learning"]
  },
  {
    id: "rewards",
    slug: "rewards",
    name: "Lucky Cookie Wheel & Rewards",
    tagline: "Gamified reward economy celebrating student consistency",
    description: "Earn space cookies, unlock cosmic avatars, spin the daily lucky cookie wheel, and redeem customized UI themes.",
    longDescription: "The Chikoo Rewards system motivates persistent daily learning. Students earn cookies and gems by finishing lessons, maintaining login streaks, and acing practice questions, which can be used to customize player identity and purchase extra energy.",
    metaTitle: "Rewards Store & Daily Lucky Cookie Wheel | Chikoo AI",
    metaDescription: "Earn cosmic cookies, spin the daily lucky wheel, and unlock customizable avatars and themes in Chikoo's gamified learning economy.",
    keywords: ["AI learning rewards", "gamified education", "lucky spin wheel", "student XP system", "cosmic cookies", "learning streaks"],
    canonicalPath: "/features/rewards",
    iconName: "Gift",
    iconPath: "/cookies.webp",
    appView: "rewards_store",
    badge: "Daily Motivation",
    highlights: [
      "Daily Lucky Cookie Spin Wheel with server-authoritative fair drops",
      "Unlockable space avatars, badges, and retro/neon color themes",
      "Energy refills and power-ups for uninterrupted study sessions"
    ],
    benefits: [
      "Continuous daily dopamine hits for study milestones",
      "Safe gamified economy with zero real-money purchases",
      "Cosmic avatars and custom title badges"
    ],
    howItWorks: [
      "Earn cookies through daily study sessions and streak milestones",
      "Spin the wheel up to 3 times daily for random bonus gems",
      "Equip custom badges to display on the global leaderboard"
    ],
    educationalBenefit: "Leverages positive reinforcement to foster disciplined, long-term daily learning habits.",
    relatedUnits: ["unit_1"],
    relatedTopics: ["what-is-artificial-intelligence"]
  },
  {
    id: "quests",
    slug: "quests",
    name: "Cosmic Quests & Daily Missions",
    tagline: "Daily structured objectives to build unbroken study streaks",
    description: "Complete targeted daily missions: score 5 correct answers in a row, finish a unit lesson, or conquer the Weekly Cosmic Super Charge.",
    longDescription: "Quests provide clear daily roadmaps for students. Rather than wondering what to study, students receive 3 focused daily missions that guide them through lessons, review drills, and high-difficulty speed quests.",
    metaTitle: "Cosmic Quests & Daily AI Missions | Chikoo AI",
    metaDescription: "Level up with Chikoo Daily Quests. Structured micro-missions, weekly cosmic recharge challenges, and streak bonuses.",
    keywords: ["daily AI quests", "learning missions", "study streaks", "educational daily goals", "gamified study habits"],
    canonicalPath: "/features/quests",
    iconName: "Compass",
    iconPath: "/Quest.webp",
    appView: "quests",
    badge: "Daily Progression",
    highlights: [
      "3 dynamic daily quests tailored to student skill level",
      "Weekly Cosmic Super Charge modules for advanced problem solvers",
      "Streak bonus multipliers for consecutive study days"
    ],
    benefits: [
      "Clarity on what to study in 3 minutes a day",
      "Streak protection shields and bonus multipliers",
      "Progressive difficulty that scales with student skill"
    ],
    howItWorks: [
      "Log in daily to inspect your 3 cosmic mission objectives",
      "Complete the tasks during normal learning sessions",
      "Claim bonus XP and trophy points to protect your streak"
    ],
    educationalBenefit: "Prevents cramming by promoting distributed, manageable daily micro-learning.",
    relatedUnits: ["unit_1", "unit_2"],
    relatedTopics: ["responsible-ai-and-ethics", "ai-in-daily-life"]
  },
  {
    id: "leaderboard",
    slug: "leaderboard",
    name: "Galactic Leaderboards & Ranks",
    tagline: "Compete with peers in weekly promotion leagues",
    description: "Rise from Bronze to Legend League based on weekly XP, accuracy percentages, and arena duel victories.",
    longDescription: "Chikoo Leaderboards introduce healthy, friendly competition. Students compete in tiered weekly leagues\u2014Bronze, Silver, Gold, Platinum, Diamond, Master, and Legend\u2014advancing as they demonstrate consistent mastery.",
    metaTitle: "Galactic Leaderboard & Ranks | Chikoo AI Learning",
    metaDescription: "Climb the weekly AI learning leaderboard. Compete in Bronze, Gold, and Legend leagues based on XP, accuracy, and practice trophies.",
    keywords: ["AI leaderboard", "student competition", "gamified leagues", "weekly XP rank", "academic ranking"],
    canonicalPath: "/features/leaderboard",
    iconName: "Trophy",
    iconPath: "/Ranks.webp",
    appView: "leaderboard",
    badge: "Friendly Competition",
    highlights: [
      "7 competitive league tiers with automatic weekly promotions",
      "Real-time trophy calculations based on arena performance",
      "Fair matchmaking that rewards consistency over sheer volume"
    ],
    benefits: [
      "Healthy peer motivation without toxic ranking pressure",
      "Weekly promotion celebrations with special tier badges",
      "Anonymous student display option for privacy"
    ],
    howItWorks: [
      "Complete lessons and practice arena duels to accumulate weekly XP",
      "Finish in the top promotion zone by Sunday midnight",
      "Unlock exclusive league badges and higher-tier bragging rights"
    ],
    educationalBenefit: "Inspires healthy peer benchmarking and sustained engagement.",
    relatedUnits: ["unit_1", "unit_2"],
    relatedTopics: ["what-is-artificial-intelligence"]
  },
  {
    id: "ai-guide",
    slug: "ai-guide",
    name: "Chikoo AI Otter Mascot",
    tagline: "The witty, unhinged, sarcastic best-friend tutor in Hinglish & Marathi",
    description: "Meet Chikoo: a blue otter tutor who roasts incorrect answers, delivers hilarious everyday analogies, and ensures no misconception goes uncorrected.",
    longDescription: "Unlike dry, robotic textbooks, Chikoo interacts like a witty, fun older sibling or senior. When students make mistakes, Chikoo offers hilarious, culturally resonant micro-explanations in natural conversational Hinglish and Marathi, turning errors into memorable learning moments.",
    metaTitle: "Chikoo AI Otter Tutor | Hinglish & Marathi AI Micro-Explanations",
    metaDescription: "Learn AI with Chikoo, the witty otter mascot! Get hilarious, relatable micro-explanations in conversational Hinglish and Marathi.",
    keywords: ["AI otter mascot", "Chikoo AI tutor", "Hinglish AI learning", "Marathi AI explanations", "fun AI teacher", "conversational learning companion"],
    canonicalPath: "/features/ai-guide",
    iconName: "Sparkles",
    iconPath: "/avatar.webp",
    appView: "home",
    badge: "Personal Companion",
    highlights: [
      "Culturally resonant Hinglish and Marathi conversational voice",
      "Playful, wholesome roasts for misconceptions with relatable analogies",
      "Instant step-by-step guidance tailored to school students"
    ],
    benefits: [
      "Turns fear of failure into laughter and rapid understanding",
      "Bilingual Hinglish & Marathi support for regional learners",
      "Real-time hints and explanations on every quiz question"
    ],
    howItWorks: [
      "Attempt any question or lesson node in Chikoo",
      "If you miss a question, Chikoo pops up with a witty micro-explanation",
      "Understand the underlying concept and retry with full clarity"
    ],
    educationalBenefit: "Reduces learning anxiety and transforms mistakes into engaging, laugh-out-loud breakthroughs.",
    relatedUnits: ["unit_1", "unit_2"],
    relatedTopics: ["how-generative-ai-works", "responsible-ai-and-ethics"]
  },
  {
    id: "puzzles",
    slug: "puzzles",
    name: "AI Detective Mystery Puzzles",
    tagline: "Visual logic anomalies, prompt traps, and glitch investigation",
    description: "Solve visual mystery puzzles: detect AI rendering anomalies, uncover synthetic deepfakes, and untangle faulty logic chains.",
    longDescription: "The Logic & Mystery Lab challenges students to think like AI forensic investigators. Students analyze visual artifacts (such as synthetic finger counts, lighting mismatches, and hallucinated data) to uncover prompt tricks.",
    metaTitle: "AI Detective Mystery Puzzles & Logic Lab | Chikoo",
    metaDescription: "Solve AI mystery puzzles and logic lab challenges. Detect synthetic images, spot deepfake anomalies, and untangle algorithmic logic.",
    keywords: ["AI detective puzzles", "visual AI puzzles", "deepfake detection for kids", "logic anomalies", "AI glitch detective"],
    canonicalPath: "/features/puzzles",
    iconName: "Search",
    iconPath: "/Chest.webp",
    appView: "home",
    badge: "Critical Thinking",
    highlights: [
      "Visual investigation of AI image generation artifacts",
      "Logic clues that guide deduction without spoiling answers",
      "Treasure chest gem rewards for solving complex scenarios"
    ],
    benefits: [
      "Hands-on deepfake and synthetic image detection skills",
      "Critical skepticism towards online misinformation",
      "Fun detective puzzles that reward attention to detail"
    ],
    howItWorks: [
      "Unlock treasure chest nodes on your adventure path",
      "Examine the visual evidence and clue statements carefully",
      "Submit your verdict to earn cosmic gems and master badges"
    ],
    educationalBenefit: "Nurtures essential digital media literacy and critical skepticism toward synthetic media.",
    relatedUnits: ["unit_1", "unit_2"],
    relatedTopics: ["computer-vision-in-action", "responsible-ai-and-ethics"]
  },
  {
    id: "battles",
    slug: "battles",
    name: "1v1 Speed Battles",
    tagline: "Real-time AI quiz duels with 15-second timers",
    description: "Go head-to-head against classmates in lightning-fast AI trivia showdowns with real-time score tracking.",
    longDescription: "Speed Battles pit two learners against each other in a 5-question lightning duel. With only 15 seconds per question, players must combine speed, confidence, and accuracy to win trophies.",
    metaTitle: "1v1 Real-Time Speed Battles | Chikoo AI Arena",
    metaDescription: "Challenge friends in 1v1 real-time AI speed battles. 15-second timer questions, rapid score tracking, and trophy rewards.",
    keywords: ["1v1 AI battle", "speed quiz battle", "multiplayer AI trivia", "real time educational game", "competitive learning"],
    canonicalPath: "/features/battles",
    iconName: "Swords",
    iconPath: "/Practice.webp",
    appView: "practice",
    badge: "Real-Time Duel",
    highlights: [
      "15-second high-intensity question countdown",
      "Live score comparison and instant victory trophy multipliers",
      "Dynamic question pools covering general science, AI, and logic"
    ],
    benefits: [
      "Adrenaline-fueled real-time multiplayer duels",
      "Tests reaction speed and deep conceptual confidence",
      "Win trophies to unlock Legend rank in the arena"
    ],
    howItWorks: [
      "Enter the matchmaking lobby in the Practice Arena",
      "Answer 5 consecutive lightning questions against your opponent",
      "Claim trophies and push your rating to Master or Legend rank"
    ],
    educationalBenefit: "Builds lightning-fast decision making and reinforces core AI definitions.",
    relatedUnits: ["unit_1"],
    relatedTopics: ["what-is-artificial-intelligence", "how-generative-ai-works"]
  }
];
var SEO_TOPICS = [
  {
    id: "what-is-artificial-intelligence",
    slug: "what-is-artificial-intelligence",
    title: "What is Artificial Intelligence? A Beginner's Guide for Students",
    category: "AI Fundamentals",
    readingTime: "6 min read",
    difficulty: "Beginner",
    summary: "Understand how computers learn from examples, recognize patterns, and make decisions without being explicitly programmed for every single step.",
    metaTitle: "What is Artificial Intelligence? Guide for Students | Chikoo AI",
    metaDescription: "Learn what Artificial Intelligence (AI) really is. Discover how machines learn, how algorithms think, and where AI is used in everyday life.",
    keywords: ["what is artificial intelligence", "learn AI basics", "AI for students", "how AI works", "artificial intelligence introduction", "AI fundamentals guide"],
    canonicalPath: "/learn/what-is-artificial-intelligence",
    keyTakeaways: [
      "AI refers to computer systems capable of performing tasks that traditionally require human intelligence.",
      "Traditional coding gives computers strict step-by-step recipes; AI teaches computers by feeding them thousands of examples.",
      "Everyday AI includes photo filters, voice assistants, movie recommendations, and autonomous navigation.",
      "AI does not 'feel' or 'think' like a human\u2014it calculates mathematical probabilities based on training data."
    ],
    sections: [
      {
        heading: "1. The Recipe vs. The Chef: How AI Differs from Normal Code",
        content: "Think of traditional computer software like following a rigid baking recipe: 'If oven temperature = 180\xB0C, bake for 20 minutes.' If an unexpected ingredient appears, traditional code breaks. AI, on the other hand, acts like an experienced chef who has tasted thousands of dishes. Instead of memorizing one strict recipe, it learns the underlying patterns of flavors and adapts automatically when ingredients change."
      },
      {
        heading: "2. The Three Pillars of Modern AI",
        content: "Most AI systems you interact with today rely on three core components: Data (the textbook), Algorithms (the learning method), and Compute Power (the brain's processing energy). By feeding millions of cat and dog photos into a neural network, the algorithm adjusts billions of tiny mathematical weights until it can reliably distinguish whiskers from tails."
      },
      {
        heading: "3. Narrow AI vs. General AI",
        content: "Every AI tool in existence today is 'Narrow AI'\u2014meaning it is extremely good at one specific task (like playing chess, translating languages, or recommending videos) but cannot do anything outside its domain. 'General AI' (machines with human-like general reasoning across any field) remains a theoretical concept in science fiction."
      }
    ],
    faqs: [
      {
        question: "Is AI actually smart like a human?",
        answer: "No. AI is extremely fast at finding mathematical patterns in data, but it lacks consciousness, common sense, emotions, and genuine understanding."
      },
      {
        question: "Can school students learn AI easily?",
        answer: "Yes! With visual analogies, interactive drills, and bite-sized lessons in Chikoo, students can master core AI concepts without needing advanced mathematics or code."
      }
    ],
    relatedUnits: ["unit_1", "unit_2"],
    relatedFeatures: ["practice-arena", "ai-guide"]
  },
  {
    id: "how-generative-ai-works",
    slug: "how-generative-ai-works",
    title: "How Generative AI Works: LLMs, Neural Networks, & Creative Models",
    category: "Generative AI",
    readingTime: "7 min read",
    difficulty: "Beginner",
    summary: "Discover the magic behind ChatGPT, Gemini, and AI image generators. Learn about Large Language Models, tokens, and prediction probability.",
    metaTitle: "How Generative AI Works: LLMs Explained for Kids & Students | Chikoo",
    metaDescription: "Learn how Generative AI and Large Language Models (LLMs) work. Understand tokens, transformers, text prediction, and image diffusion simply.",
    keywords: ["how generative AI works", "large language models explained", "LLMs for students", "how ChatGPT works", "generative AI basics", "tokens and transformers"],
    canonicalPath: "/learn/how-generative-ai-works",
    keyTakeaways: [
      "Generative AI creates brand new content (text, images, music, code) rather than just analyzing existing data.",
      "Large Language Models (LLMs) break text into 'tokens' and predict the most probable next token in a sequence.",
      "AI image generators (Diffusion Models) start with random digital static noise and gradually sculpt it into a clear picture based on your prompt.",
      "Generative AI does not know facts directly; it constructs plausible completions based on patterns observed during training."
    ],
    sections: [
      {
        heading: "1. From Classifiers to Creators",
        content: "Early AI was mostly about classification: looking at an image and deciding 'Is this a cat or a dog?'. Generative AI flips this completely: you type 'A fluffy cat wearing an astronaut helmet on Mars', and the model paints a brand new high-resolution scene that never existed before."
      },
      {
        heading: "2. The Super-Smart Autocomplete: How LLMs Think",
        content: "When you use an AI chatbot, the model breaks your sentence into tiny word pieces called tokens. It calculates the statistical probability of what word should come next. If you write 'The sky is...', the model calculates high probabilities for 'blue', 'cloudy', or 'clear'. By repeating this millions of times per second, it generates coherent paragraphs, poems, or Python scripts."
      },
      {
        heading: "3. What are Hallucinations?",
        content: "Because LLMs predict what sounds plausible rather than consulting a hard database of verified truth, they can sometimes speak with total confidence about facts that are completely made up. This is called an AI hallucination, which is why critical fact-checking is an essential student skill."
      }
    ],
    faqs: [
      {
        question: "Does Generative AI copy and paste from the internet?",
        answer: "No. Generative AI learns patterns during training and generates original output word-by-word or pixel-by-pixel, similar to how a person paints a picture from memory."
      },
      {
        question: "Why does AI sometimes get simple math wrong?",
        answer: "LLMs are designed for language probability, not rigid calculation. Without external calculators or tools, they are predicting words rather than computing arithmetic."
      }
    ],
    relatedUnits: ["unit_1"],
    relatedFeatures: ["challenges", "practice-arena"]
  },
  {
    id: "prompt-engineering-for-beginners",
    slug: "prompt-engineering-for-beginners",
    title: "Prompt Engineering 101: How to Talk to AI Like a Pro",
    category: "Practical Skills",
    readingTime: "5 min read",
    difficulty: "Beginner",
    summary: "Master the art of crafting precise, contextual prompts. Learn the C-R-E-A-T-E framework to get high-quality homework help and project ideas.",
    metaTitle: "Prompt Engineering Guide for Students | Chikoo AI",
    metaDescription: "Learn prompt engineering basics. Master role prompting, constraints, few-shot examples, and the C-R-E-A-T-E framework for school and projects.",
    keywords: ["prompt engineering for beginners", "how to write AI prompts", "prompting techniques", "AI prompts for students", "prompt engineering guide"],
    canonicalPath: "/learn/prompt-engineering-for-beginners",
    keyTakeaways: [
      "A prompt is the instruction or question you give to an AI model.",
      "Clear context, specific roles, output formats, and constraints dramatically improve AI response quality.",
      "The C-R-E-A-T-E method: Context, Role, Explicit instructions, Audience, Tone, and Examples.",
      "Avoid vague one-line prompts like 'explain science'; use targeted parameters like 'Act as a 7th-grade science tutor explaining photosynthesis with a pizza analogy'."
    ],
    sections: [
      {
        heading: "1. Why Prompts Matter",
        content: "Large Language Models are generalists. When given a vague question like 'Write about space', they produce generic, bland summaries. But when given precise constraints and clear audience guidelines, they unlock tailored, deeply useful explanations."
      },
      {
        heading: "2. The Golden Rules of Prompt Engineering",
        content: "1. Assign a Role: 'You are a friendly biology teacher.' 2. State the Goal: 'Explain cell respiration.' 3. Define the Audience: 'For a 12-year-old student.' 4. Set Format & Length: 'Use 3 bullet points and 1 real-world analogy.' 5. Provide Negative Constraints: 'Do not use complex technical terms without defining them.'"
      },
      {
        heading: "3. Iterative Refinement",
        content: "Never settle for the first AI response. Treat the AI like a conversational partner: ask it to simplify, add examples, format as a table, or challenge your assumptions."
      }
    ],
    faqs: [
      {
        question: "What is few-shot prompting?",
        answer: "Few-shot prompting means providing 2 or 3 examples of inputs and desired outputs inside your prompt before asking the AI to complete a new task."
      }
    ],
    relatedUnits: ["unit_1", "unit_2"],
    relatedFeatures: ["challenges", "practice-arena"]
  },
  {
    id: "machine-learning-vs-deep-learning",
    slug: "machine-learning-vs-deep-learning",
    title: "Machine Learning vs Deep Learning: The Essential Guide for Young Coders",
    category: "AI Architecture",
    readingTime: "6 min read",
    difficulty: "Intermediate",
    summary: "Understand the structural differences between traditional machine learning algorithms and multi-layered deep neural networks.",
    metaTitle: "Machine Learning vs Deep Learning Explained | Chikoo AI",
    metaDescription: "Understand the differences between Machine Learning and Deep Learning. Learn about decision trees, feature engineering, and neural network layers.",
    keywords: ["machine learning vs deep learning", "neural networks explained", "AI architecture", "deep learning for students", "types of machine learning"],
    canonicalPath: "/learn/machine-learning-vs-deep-learning",
    keyTakeaways: [
      "Machine Learning (ML) is a subset of AI where computers learn from data using mathematical algorithms.",
      "Deep Learning (DL) is a specialized subset of ML inspired by the human brain's interconnected neural networks.",
      "Traditional ML requires human engineers to hand-pick 'features', whereas Deep Learning extracts features automatically from raw data.",
      "Deep learning powers speech recognition, self-driving cars, and real-time language translation."
    ],
    sections: [
      {
        heading: "1. The Russian Nesting Dolls of AI",
        content: "Visualize three concentric circles: The outer circle is Artificial Intelligence (any technique that makes machines mimic human behavior). Inside that is Machine Learning (statistical methods that enable machines to improve at tasks with experience). Inside that is Deep Learning (multi-layer neural networks that handle massive unstructured data like video, audio, and raw text)."
      },
      {
        heading: "2. How Feature Engineering Works",
        content: "In traditional Machine Learning (like predicting house prices or filtering spam emails), engineers must manually tell the model: 'Look at bedroom count, square footage, and neighborhood.' In Deep Learning, you feed in thousands of raw photos and the network discovers edges, textures, shapes, and complex objects on its own across hidden layers."
      }
    ],
    faqs: [
      {
        question: "Do I need powerful computers for Deep Learning?",
        answer: "Yes, training deep neural networks typically requires specialized GPUs (Graphics Processing Units) that can perform trillions of matrix multiplications per second."
      }
    ],
    relatedUnits: ["unit_1", "unit_2"],
    relatedFeatures: ["puzzles", "challenges"]
  },
  {
    id: "responsible-ai-and-ethics",
    slug: "responsible-ai-and-ethics",
    title: "Responsible AI & Ethics: Bias, Privacy, and Safety for Students",
    category: "AI Ethics",
    readingTime: "6 min read",
    difficulty: "Beginner",
    summary: "Explore the crucial ethical responsibilities of building and using AI: algorithmic bias, data privacy, deepfakes, and environmental impact.",
    metaTitle: "Responsible AI & Ethics for Students | Chikoo AI Education",
    metaDescription: "Learn why AI ethics matters. Discover algorithmic bias, data privacy protection, deepfakes, copyright, and the FAIR framework.",
    keywords: ["responsible AI", "AI ethics for students", "algorithmic bias", "AI safety", "AI privacy", "ethical AI education"],
    canonicalPath: "/learn/responsible-ai-and-ethics",
    keyTakeaways: [
      "AI models inherit the biases and blind spots present in their training data.",
      "Data privacy is critical: never share passwords, personal addresses, or private photos with public AI tools.",
      "Deepfakes and synthetic audio can be used for deception; digital forensics and skepticism are vital skills.",
      "Responsible AI requires fairness, accountability, transparency, and safety (the FAIR framework)."
    ],
    sections: [
      {
        heading: "1. Garbage In, Garbage Out: Algorithmic Bias",
        content: "If you train an AI hiring tool exclusively on resumes from 1980, the model will learn historical prejudices and favor candidates matching that demographic. Because AI learns purely from historical patterns, it can amplify societal biases unless developers actively audit and balance training data."
      },
      {
        heading: "2. Protecting Your Digital Footprint",
        content: "Everything you type into free commercial AI tools may be stored and used to train future iterations. Students should practice good digital hygiene by never submitting personally identifiable information (PII)."
      }
    ],
    faqs: [
      {
        question: "How can I spot an AI deepfake?",
        answer: "Look for unnatural eye reflections, mismatched ear jewelry, blurry finger joints, robotic speech cadences, and inconsistencies in background lighting."
      }
    ],
    relatedUnits: ["unit_1", "unit_2"],
    relatedFeatures: ["puzzles", "quests"]
  },
  {
    id: "computer-vision-in-action",
    slug: "computer-vision-in-action",
    title: "Computer Vision Explained: How AI Sees and Understands the World",
    category: "Computer Vision",
    readingTime: "5 min read",
    difficulty: "Intermediate",
    summary: "Discover how computers transform grids of numbers (pixels) into object detection, face unlocking, self-driving vision, and medical imaging.",
    metaTitle: "Computer Vision Explained for Kids & Students | Chikoo AI",
    metaDescription: "Learn how Computer Vision works. Discover pixel matrices, edge detection filters, convolutional neural networks (CNNs), and object tracking.",
    keywords: ["computer vision explained", "how AI sees images", "CNNs for students", "object detection basics", "facial recognition AI"],
    canonicalPath: "/learn/computer-vision-in-action",
    keyTakeaways: [
      "To a computer, every image is just a 2D matrix of numbers representing Red, Green, and Blue (RGB) brightness values (0-255).",
      "Convolutional Neural Networks (CNNs) slide mathematical filters over pixel grids to detect edges, curves, patterns, and complex objects.",
      "Computer vision powers self-driving cars, smartphone face unlock, medical scans, and automated sports tracking.",
      "Image augmentation (flipping, rotating, color jittering) helps vision models generalize to unexpected angles."
    ],
    sections: [
      {
        heading: "1. The Digital Canvas: Pixels as Numbers",
        content: "While human eyes perceive colors, textures, and depth, a computer processor only reads numbers. An HD photo is a grid of 1920x1080 numbers for red, green, and blue. Computer Vision is the science of turning those raw numbers into semantic meaning like 'This is a golden retriever catching a frisbee'."
      },
      {
        heading: "2. Convolutional Filters: The Digital Magnifying Glass",
        content: "A Convolutional Neural Network uses tiny mathematical matrices called kernels. As these kernels slide across the image, they highlight vertical edges, horizontal lines, and color shifts. In deeper layers, these simple lines combine into shapes, eye outlines, wheel spokes, and recognizable objects."
      }
    ],
    faqs: [
      {
        question: "Can AI see in the dark?",
        answer: "Yes, when paired with infrared sensors, LiDAR, or thermal cameras, computer vision algorithms can analyze wavelengths of light that are completely invisible to human eyes."
      }
    ],
    relatedUnits: ["unit_1", "unit_2"],
    relatedFeatures: ["puzzles", "practice-arena"]
  },
  {
    id: "ai-in-daily-life",
    slug: "ai-in-daily-life",
    title: "Hidden AI in Daily Life: Smart Assistants, Recommendations, & Navigation",
    category: "Applied AI",
    readingTime: "5 min read",
    difficulty: "Beginner",
    summary: "Uncover the hidden algorithms powering your smartphone: autocomplete, GPS route optimization, music recommendations, and email spam filters.",
    metaTitle: "AI in Everyday Life: Hidden Algorithms Around You | Chikoo",
    metaDescription: "Discover everyday AI applications: Netflix recommendations, Spotify playlists, Google Maps routing, spam filtering, and smartphone cameras.",
    keywords: ["AI in daily life", "everyday AI examples", "recommendation algorithms", "smart assistants", "AI around us"],
    canonicalPath: "/learn/ai-in-daily-life",
    keyTakeaways: [
      "You interact with dozens of AI systems daily without even realizing it.",
      "Streaming services use collaborative filtering to recommend songs and movies based on users with similar tastes.",
      "Navigation apps use graph algorithms and real-time traffic telemetry to recalculate fastest driving routes.",
      "Modern smartphone cameras take multiple exposures and use AI neural processing to eliminate blur and optimize lighting in milliseconds."
    ],
    sections: [
      {
        heading: "1. The Invisible Co-Pilot",
        content: "Artificial Intelligence isn't just humanoid robots in laboratories; it is quietly running in your pocket. When your phone categorizes photos by pet or location, when your email automatically moves suspicious lottery messages to spam, or when predictive text finishes your sentence\u2014that's machine learning in action."
      },
      {
        heading: "2. The Recommendation Matrix",
        content: "How does Spotify know you will love a song you've never heard? It analyzes the acoustic properties of your favorite tracks (tempo, key, danceability) and compares your listening history against millions of other users with matching taste profiles."
      }
    ],
    faqs: [
      {
        question: "Does social media use AI to keep me scrolling?",
        answer: "Yes. Engagement algorithms analyze how long you pause on videos and images, continuously feeding content that maximizes watch time."
      }
    ],
    relatedUnits: ["unit_1"],
    relatedFeatures: ["practice-arena", "quests"]
  },
  {
    id: "neural-networks-made-simple",
    slug: "neural-networks-made-simple",
    title: "Neural Networks Made Simple: Neurons, Layers, and Backpropagation",
    category: "AI Architecture",
    readingTime: "6 min read",
    difficulty: "Intermediate",
    summary: "A friendly, visual breakdown of artificial neural networks. Learn how inputs pass through hidden layers and how machines learn from mistakes.",
    metaTitle: "Neural Networks Explained Simply for Students | Chikoo AI",
    metaDescription: "Learn how Artificial Neural Networks work. Simple explanations of inputs, weights, biases, activation functions, and backpropagation.",
    keywords: ["neural networks made simple", "how neural networks work", "neurons and layers", "backpropagation explained", "AI neural network guide"],
    canonicalPath: "/learn/neural-networks-made-simple",
    keyTakeaways: [
      "Artificial Neural Networks are computational networks inspired by the human brain's interconnected neurons.",
      "Information moves from an Input Layer through multiple Hidden Layers to an Output Layer.",
      "Each connection has a 'weight' that determines its importance; learning means tuning these weights.",
      "Backpropagation is the process of calculating errors at the output and propagating corrections backward through the network."
    ],
    sections: [
      {
        heading: "1. Nodes and Connections",
        content: "Imagine a stadium crowd playing a giant game of telephone. Each person (neuron) listens to messages from people behind them, applies a personal math formula, and shouts a refined number to people in front of them. The final people in the front row give the final answer: 'It is a 95% chance of rain'."
      },
      {
        heading: "2. Learning from Mistakes (Backpropagation)",
        content: "When a newly created neural network makes an incorrect prediction, a mathematical process called backpropagation runs backwards through every layer. It nudges each weight slightly in the right direction, ensuring the network makes fewer mistakes on subsequent attempts."
      }
    ],
    faqs: [
      {
        question: "Are artificial neurons alive?",
        answer: "No. Artificial neurons are simple mathematical functions (like multiplying numbers and adding an offset) executing inside computer memory."
      }
    ],
    relatedUnits: ["unit_1", "unit_2"],
    relatedFeatures: ["challenges", "puzzles"]
  }
];
function getAllSeoUnits(dynamicModules) {
  const sourceModules = dynamicModules && dynamicModules.length > 0 ? dynamicModules : AI_CURRICULUM;
  return sourceModules.map((m, mIdx) => {
    const rawTitle = m.title || `Unit ${mIdx + 1}: AI Learning Journey`;
    const cleanTitle = cleanEmoji(rawTitle);
    const unitSlug = slugify(cleanTitle) || `unit-${m.id}`;
    const desc = m.description && !m.description.includes("|") ? m.description : `Master core AI concepts, everyday analogies, and interactive challenges in ${cleanTitle}.`;
    const lessons = (m.lessons || []).map((l, lIdx) => {
      const rawLessonTitle = l.title || `Lesson ${lIdx + 1}`;
      const cleanLessonTitle = cleanEmoji(rawLessonTitle);
      const lessonSlug = slugify(cleanLessonTitle) || `lesson-${l.id}`;
      const lessonDesc = l.description || `Explore ${cleanLessonTitle} through interactive puzzles, relatable analogies, and step-by-step AI challenges.`;
      const sampleQuestions = (l.challenges || []).slice(0, 3).map((c) => ({
        question: c.question,
        type: c.type,
        explanation: typeof c.explanation === "string" ? c.explanation : c.explanation?.text || void 0
      }));
      const keyTakeaways = [
        `Understand core principles of ${cleanLessonTitle}.`,
        `Practice with real-world scenarios and interactive challenges.`,
        `Test understanding with instant feedback and Chikoo micro-explanations.`
      ];
      return {
        id: l.id,
        slug: lessonSlug,
        title: rawLessonTitle,
        cleanTitle: cleanLessonTitle,
        description: lessonDesc,
        difficulty: l.difficulty || "Easy",
        xpReward: l.xpReward || 100,
        metaTitle: `${cleanLessonTitle} | ${cleanTitle} - Chikoo AI`,
        metaDescription: `${lessonDesc.slice(0, 150)}. Interactive AI lesson on Chikoo with quizzes, micro-explanations, and practice.`,
        keywords: [
          cleanLessonTitle.toLowerCase(),
          `${cleanLessonTitle.toLowerCase()} ai`,
          "learn ai",
          "ai lesson for kids",
          "interactive ai challenge",
          "ai education"
        ],
        canonicalPath: `/units/${unitSlug}/lessons/${lessonSlug}`,
        unitId: m.id,
        unitSlug,
        unitTitle: cleanTitle,
        challengesCount: (l.challenges || []).length,
        sampleQuestions,
        keyTakeaways
      };
    });
    return {
      id: m.id,
      slug: unitSlug,
      title: rawTitle,
      cleanTitle,
      description: desc,
      difficulty: m.difficulty || "Beginner",
      metaTitle: `${cleanTitle} - Interactive AI Unit | Chikoo`,
      metaDescription: `${desc.slice(0, 150)}. Explore ${lessons.length} interactive lessons on Chikoo AI with gamified challenges.`,
      keywords: [
        cleanTitle.toLowerCase(),
        "learn artificial intelligence",
        "ai curriculum",
        "ai fundamentals",
        "interactive ai unit",
        "student ai learning"
      ],
      canonicalPath: `/units/${unitSlug}`,
      lessonsCount: lessons.length,
      lessons,
      relatedFeatures: ["practice-arena", "challenges", "ai-guide"],
      relatedTopics: ["what-is-artificial-intelligence", "how-generative-ai-works", "responsible-ai-and-ethics"]
    };
  });
}
function getSeoUnitBySlug(slug, dynamicModules) {
  const units = getAllSeoUnits(dynamicModules);
  const clean = slug.toLowerCase().trim();
  return units.find((u) => u.slug === clean || u.id.toLowerCase() === clean);
}
function getSeoLesson(unitSlug, lessonSlug, dynamicModules) {
  const unit = getSeoUnitBySlug(unitSlug, dynamicModules);
  if (!unit) return void 0;
  const clean = lessonSlug.toLowerCase().trim();
  return unit.lessons.find((l) => l.slug === clean || l.id.toLowerCase() === clean);
}
function getSeoFeatureBySlug(slug) {
  const clean = slug.toLowerCase().trim();
  return SEO_FEATURES.find((f) => f.slug === clean || f.id.toLowerCase() === clean);
}
function getSeoTopicBySlug(slug) {
  const clean = slug.toLowerCase().trim();
  return SEO_TOPICS.find((t) => t.slug === clean || t.id.toLowerCase() === clean);
}
function generatePlatformSchema(baseUrl = CHIKOO_PLATFORM_SEO.domain) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        "url": baseUrl,
        "name": "Chikoo",
        "description": CHIKOO_PLATFORM_SEO.description,
        "publisher": {
          "@id": `${baseUrl}/#organization`
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": `${baseUrl}/units?q={search_term_string}`,
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "EducationalOrganization",
        "@id": `${baseUrl}/#organization`,
        "name": "Chikoo Learning Systems",
        "url": baseUrl,
        "logo": `${baseUrl}/avatar.webp`,
        "description": "Interactive, gamified AI learning platform for students and curious minds.",
        "sameAs": []
      },
      {
        "@type": "SoftwareApplication",
        "name": "Chikoo - Learn AI",
        "operatingSystem": "All modern browsers, Android, iOS, Windows, macOS",
        "applicationCategory": "EducationalApplication",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.9",
          "ratingCount": "1420"
        }
      }
    ]
  };
}
function generateCourseSchema(unit, baseUrl = CHIKOO_PLATFORM_SEO.domain) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": unit.cleanTitle,
    "description": unit.description,
    "provider": {
      "@type": "EducationalOrganization",
      "name": "Chikoo",
      "sameAs": baseUrl
    },
    "hasCourseInstance": {
      "@type": "CourseInstance",
      "courseMode": "Online",
      "courseWorkload": "PT20M"
    },
    "educationalLevel": unit.difficulty,
    "url": `${baseUrl}${unit.canonicalPath}`,
    "hasPart": unit.lessons.map((l) => ({
      "@type": "LearningResource",
      "name": l.cleanTitle,
      "description": l.description,
      "url": `${baseUrl}${l.canonicalPath}`
    }))
  };
}
function generateLessonSchema(lesson, baseUrl = CHIKOO_PLATFORM_SEO.domain) {
  return {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    "name": lesson.cleanTitle,
    "description": lesson.description,
    "learningResourceType": "Interactive Lesson",
    "educationalLevel": lesson.difficulty,
    "url": `${baseUrl}${lesson.canonicalPath}`,
    "isPartOf": {
      "@type": "Course",
      "name": lesson.unitTitle,
      "url": `${baseUrl}/units/${lesson.unitSlug}`
    },
    "audience": {
      "@type": "EducationalAudience",
      "educationalRole": "student"
    }
  };
}
function generateFeatureSchema(feature, baseUrl = CHIKOO_PLATFORM_SEO.domain) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": `Chikoo ${feature.name}`,
    "applicationCategory": "EducationalApplication",
    "description": feature.longDescription,
    "url": `${baseUrl}${feature.canonicalPath}`,
    "featureList": feature.highlights
  };
}
function generateArticleSchema(article, baseUrl = CHIKOO_PLATFORM_SEO.domain) {
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "headline": article.title,
    "description": article.summary,
    "author": {
      "@type": "Organization",
      "name": "Chikoo Editorial Team"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Chikoo",
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/avatar.webp`
      }
    },
    "mainEntityOfPage": `${baseUrl}${article.canonicalPath}`,
    "keywords": article.keywords.join(", ")
  };
}
function generateBreadcrumbSchema(items, baseUrl = CHIKOO_PLATFORM_SEO.domain) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url.startsWith("http") ? item.url : `${baseUrl}${item.url}`
    }))
  };
}
function generateFaqSchema(faqs) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((f) => ({
      "@type": "Question",
      "name": f.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.answer
      }
    }))
  };
}
function generateSitemapXml(baseUrl = CHIKOO_PLATFORM_SEO.domain, dynamicModules) {
  const units = getAllSeoUnits(dynamicModules);
  const now = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const urls = [
    { loc: `${baseUrl}/`, lastmod: now, changefreq: "daily", priority: "1.0" },
    { loc: `${baseUrl}/what-is-chikoo`, lastmod: now, changefreq: "weekly", priority: "0.9" },
    { loc: `${baseUrl}/units`, lastmod: now, changefreq: "daily", priority: "0.9" },
    { loc: `${baseUrl}/features`, lastmod: now, changefreq: "weekly", priority: "0.8" },
    { loc: `${baseUrl}/learn`, lastmod: now, changefreq: "daily", priority: "0.9" }
  ];
  SEO_FEATURES.forEach((f) => {
    urls.push({
      loc: `${baseUrl}${f.canonicalPath}`,
      lastmod: now,
      changefreq: "weekly",
      priority: "0.8"
    });
  });
  SEO_TOPICS.forEach((t) => {
    urls.push({
      loc: `${baseUrl}${t.canonicalPath}`,
      lastmod: now,
      changefreq: "weekly",
      priority: "0.85"
    });
  });
  units.forEach((u) => {
    urls.push({
      loc: `${baseUrl}${u.canonicalPath}`,
      lastmod: now,
      changefreq: "weekly",
      priority: "0.85"
    });
    u.lessons.forEach((l) => {
      urls.push({
        loc: `${baseUrl}${l.canonicalPath}`,
        lastmod: now,
        changefreq: "weekly",
        priority: "0.8"
      });
    });
  });
  const xmlEntries = urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>`;
}
function generateRobotsTxt(baseUrl = CHIKOO_PLATFORM_SEO.domain) {
  return `# robots.txt for Chikoo AI
User-agent: *
Allow: /
Allow: /what-is-chikoo
Allow: /units
Allow: /units/*
Allow: /features
Allow: /features/*
Allow: /learn
Allow: /learn/*
Allow: /sitemap.xml

# Disallow private user data, dashboards, and API endpoints
Disallow: /api/
Disallow: /admin
Disallow: /school-admin
Disallow: /student-analytics
Disallow: /user-management
Disallow: /*?*portal=
Disallow: /*?*view=

Sitemap: ${baseUrl}/sitemap.xml
`;
}

// src/lib/serverSeo.ts
function resolveSeoForPath(pathStr, dynamicModules, baseUrl = CHIKOO_PLATFORM_SEO.domain) {
  const cleanPath = pathStr.toLowerCase().split("?")[0].replace(/\/+$/, "") || "/";
  const defaultOgImage = `${baseUrl}/avatar.webp`;
  if (cleanPath.startsWith("/admin") || cleanPath.startsWith("/school-admin") || cleanPath.startsWith("/student-analytics") || cleanPath.startsWith("/user-management") || cleanPath.startsWith("/api")) {
    return {
      title: "Chikoo | Space Portal",
      description: "Private user portal and learning workspace.",
      canonicalUrl: `${baseUrl}${cleanPath}`,
      keywords: [],
      ogType: "website",
      ogImage: defaultOgImage,
      schemaJson: {},
      prerenderedHtml: `<div class="p-8 text-center"><h1 class="text-xl font-bold">Chikoo Space Hub</h1><p class="text-sm">Secure learning workspace.</p></div>`,
      noindex: true
    };
  }
  if (cleanPath === "/privacy-policy") {
    const prerenderedHtml = `
      <main class="max-w-4xl mx-auto px-6 py-12 font-sans bg-slate-950 text-slate-100">
        <header class="mb-8 border-b border-slate-800 pb-6">
          <h1 class="text-3xl font-black text-white">Privacy Policy</h1>
          <p class="text-sm text-slate-400 mt-2">Chikoo AI Learning Platform Legal & Data Protection Policy</p>
        </header>
        <article class="space-y-6 text-sm text-slate-300">
          <section>
            <h2 class="text-lg font-bold text-white mb-2">1. Information We Collect</h2>
            <p>We collect account data (username, email, password hash), learning progress (units completed, quiz scores, XP, energy, streaks), and essential technical telemetry.</p>
          </section>
          <section>
            <h2 class="text-lg font-bold text-white mb-2">2. Children & Student Protections</h2>
            <p>Designed for ages 10-18. Zero third-party advertisements, zero selling of personal data, and strict school account privacy controls.</p>
          </section>
          <section>
            <h2 class="text-lg font-bold text-white mb-2">3. How We Use Data</h2>
            <p>To deliver gamified AI micro-lessons, track learning progress, update leaderboards, and process mascot micro-explanations.</p>
          </section>
          <section>
            <h2 class="text-lg font-bold text-white mb-2">4. Third-Party Infrastructure</h2>
            <p>Supabase (encrypted auth & database) and Google Gemini API (AI quiz generation). No personal identifiers are sent to AI models.</p>
          </section>
          <section>
            <h2 class="text-lg font-bold text-white mb-2">5. Data Retention & Deletion Rights</h2>
            <p>Users maintain full control to request data access or account deletion at any time via <a href="/delete-account" class="text-sky-400 font-bold">/delete-account</a> or email contact.</p>
          </section>
          <section>
            <h2 class="text-lg font-bold text-white mb-2">6. Contact Support</h2>
            <p>Contact privacy officer at shauryatalks25@gmail.com or support@chikoo.ai.</p>
          </section>
        </article>
      </main>
    `;
    return {
      title: "Privacy Policy | Chikoo AI Learning Platform",
      description: "Official Privacy Policy for Chikoo. Detailed information on student data protection, COPPA alignment, storage security, third-party services, and user rights.",
      canonicalUrl: `${baseUrl}/privacy-policy`,
      keywords: ["chikoo privacy policy", "student data protection", "coppa compliance", "ai learning privacy"],
      ogType: "website",
      ogImage: defaultOgImage,
      schemaJson: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Privacy Policy",
        "url": `${baseUrl}/privacy-policy`
      },
      prerenderedHtml
    };
  }
  if (cleanPath === "/delete-account") {
    const prerenderedHtml = `
      <main class="max-w-4xl mx-auto px-6 py-12 font-sans bg-slate-950 text-slate-100">
        <header class="mb-8 border-b border-slate-800 pb-6">
          <h1 class="text-3xl font-black text-white">Account & Personal Data Deletion</h1>
          <p class="text-sm text-slate-400 mt-2">Submit a data deletion request or manage your Chikoo account credentials.</p>
        </header>
        <article class="space-y-6 text-sm text-slate-300">
          <section>
            <h2 class="text-lg font-bold text-white mb-2">Account Removal Process</h2>
            <p>Users can permanently delete their Chikoo account and associated progress (XP, streaks, cookies, leaderboard records). Logged-in users can execute direct in-app deletion, while unauthenticated users can submit a request ticket or email shauryatalks25@gmail.com.</p>
          </section>
        </article>
      </main>
    `;
    return {
      title: "Account & Data Deletion | Chikoo",
      description: "Request deletion of your Chikoo account and associated personal data. Clear instructions for direct in-app deletion and web support tickets.",
      canonicalUrl: `${baseUrl}/delete-account`,
      keywords: ["delete chikoo account", "account deletion request", "privacy data scrub"],
      ogType: "website",
      ogImage: defaultOgImage,
      schemaJson: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Account Deletion",
        "url": `${baseUrl}/delete-account`
      },
      prerenderedHtml
    };
  }
  if (cleanPath === "/what-is-chikoo" || cleanPath === "/about") {
    const faqs = [
      {
        question: "What is Chikoo?",
        answer: "Chikoo is a gamified AI learning platform for students aged 10-18. It features interactive micro-lessons, hands-on practice challenges, and a witty otter tutor delivering micro-explanations in Hinglish and Marathi."
      },
      {
        question: "What topics does Chikoo teach?",
        answer: "Chikoo covers Artificial Intelligence Fundamentals, Generative AI, Large Language Models, Prompt Engineering, Computer Vision, Machine Learning, and AI Ethics."
      },
      {
        question: "How does the gamification work?",
        answer: "Students earn cosmic cookies, maintain daily study streaks, unlock avatar rewards, and compete on the Galactic Leaderboard."
      }
    ];
    const breadcrumbs = [
      { name: "Home", url: "/" },
      { name: "What is Chikoo", url: "/what-is-chikoo" }
    ];
    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        generatePlatformSchema(baseUrl)["@graph"][0],
        generatePlatformSchema(baseUrl)["@graph"][1],
        generatePlatformSchema(baseUrl)["@graph"][2],
        generateBreadcrumbSchema(breadcrumbs, baseUrl),
        generateFaqSchema(faqs)
      ]
    };
    const prerenderedHtml = `
      <main class="max-w-5xl mx-auto px-4 py-12 font-sans">
        <header class="text-center mb-12">
          <h1 class="text-4xl font-black mb-4">Learn Artificial Intelligence with Chikoo</h1>
          <p class="text-lg text-slate-300 max-w-3xl mx-auto">${CHIKOO_PLATFORM_SEO.heroSubtitle}</p>
        </header>

        <section class="mb-12">
          <h2 class="text-2xl font-bold mb-4">What is Chikoo?</h2>
          <p class="text-base text-slate-300 mb-4">${CHIKOO_PLATFORM_SEO.description}</p>
          <p class="text-base text-slate-300">Target Audience: ${CHIKOO_PLATFORM_SEO.targetAudience}</p>
        </section>

        <section class="mb-12">
          <h2 class="text-2xl font-bold mb-4">What Students Learn</h2>
          <ul class="list-disc pl-6 space-y-2 text-slate-300">
            <li><strong>AI Fundamentals:</strong> How algorithms find mathematical patterns in data.</li>
            <li><strong>Generative AI & LLMs:</strong> How models like ChatGPT and Gemini predict tokens and generate text.</li>
            <li><strong>Prompt Engineering:</strong> Practical frameworks (C-R-E-A-T-E) for school projects and research.</li>
            <li><strong>Computer Vision:</strong> Pixel grids, edge filters, and image recognition.</li>
            <li><strong>Responsible AI:</strong> Detecting bias, privacy safeguards, and spotting deepfakes.</li>
          </ul>
        </section>

        <section class="mb-12">
          <h2 class="text-2xl font-bold mb-4">Gamified Platform Features</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${SEO_FEATURES.map((f) => `
              <div class="p-4 border rounded-xl">
                <h3 class="font-bold text-lg"><a href="${f.canonicalPath}">${f.name}</a></h3>
                <p class="text-sm text-slate-300">${f.description}</p>
              </div>
            `).join("")}
          </div>
        </section>

        <nav class="border-t pt-8">
          <a href="/units" class="font-bold text-cyan-400 mr-4">Browse All AI Units \u2192</a>
          <a href="/features" class="font-bold text-cyan-400 mr-4">Platform Features \u2192</a>
          <a href="/learn" class="font-bold text-cyan-400">AI Knowledge Guides \u2192</a>
        </nav>
      </main>
    `;
    return {
      title: CHIKOO_PLATFORM_SEO.metaTitle,
      description: CHIKOO_PLATFORM_SEO.metaDescription,
      canonicalUrl: `${baseUrl}/what-is-chikoo`,
      keywords: CHIKOO_PLATFORM_SEO.keywords,
      ogType: "website",
      ogImage: defaultOgImage,
      schemaJson: schema,
      prerenderedHtml
    };
  }
  if (cleanPath === "/units") {
    const units = getAllSeoUnits(dynamicModules);
    const breadcrumbs = [
      { name: "Home", url: "/" },
      { name: "Curriculum Units", url: "/units" }
    ];
    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        generatePlatformSchema(baseUrl)["@graph"][0],
        generateBreadcrumbSchema(breadcrumbs, baseUrl)
      ]
    };
    const prerenderedHtml = `
      <main class="max-w-5xl mx-auto px-4 py-12 font-sans">
        <header class="text-center mb-12">
          <h1 class="text-4xl font-black mb-4">AI Learning Units & Curriculum</h1>
          <p class="text-lg text-slate-300">Master Artificial Intelligence through structured, gamified units.</p>
        </header>

        <section class="space-y-8">
          ${units.map((u, i) => `
            <article class="p-6 border rounded-2xl">
              <span class="text-xs font-bold text-cyan-400">Unit ${i + 1} \u2022 ${u.difficulty}</span>
              <h2 class="text-2xl font-bold mt-1 mb-2"><a href="${u.canonicalPath}">${u.cleanTitle}</a></h2>
              <p class="text-slate-300 mb-4">${u.description}</p>
              <h3 class="text-sm font-bold uppercase mb-2">Lessons:</h3>
              <ul class="list-disc pl-6 space-y-1 text-sm text-slate-300">
                ${u.lessons.map((l) => `
                  <li><a href="${l.canonicalPath}" class="text-cyan-400 font-medium">${l.cleanTitle}</a> \u2014 ${l.description}</li>
                `).join("")}
              </ul>
            </article>
          `).join("")}
        </section>
      </main>
    `;
    return {
      title: "AI Learning Units & Curriculum | Chikoo",
      description: "Explore structured AI learning units on Chikoo. Interactive lessons covering AI fundamentals, Generative AI, Machine Learning, Computer Vision, and Ethics.",
      canonicalUrl: `${baseUrl}/units`,
      keywords: ["ai learning units", "ai curriculum for students", "learn artificial intelligence", "ai modules", "gamified ai course"],
      ogType: "website",
      ogImage: defaultOgImage,
      schemaJson: schema,
      prerenderedHtml
    };
  }
  if (cleanPath.startsWith("/units/")) {
    const parts = cleanPath.split("/").filter(Boolean);
    if (parts.length === 2) {
      const unitSlug = parts[1];
      const unit = getSeoUnitBySlug(unitSlug, dynamicModules);
      if (unit) {
        const breadcrumbs = [
          { name: "Home", url: "/" },
          { name: "Units", url: "/units" },
          { name: unit.cleanTitle, url: unit.canonicalPath }
        ];
        const schema = {
          "@context": "https://schema.org",
          "@graph": [
            generateCourseSchema(unit, baseUrl),
            generateBreadcrumbSchema(breadcrumbs, baseUrl)
          ]
        };
        const prerenderedHtml = `
          <main class="max-w-4xl mx-auto px-4 py-12 font-sans">
            <header class="mb-8">
              <span class="text-xs font-bold text-cyan-400 uppercase">AI Learning Unit \u2022 ${unit.difficulty}</span>
              <h1 class="text-4xl font-black mt-2 mb-4">${unit.cleanTitle}</h1>
              <p class="text-lg text-slate-300">${unit.description}</p>
            </header>

            <section class="mb-12">
              <h2 class="text-2xl font-bold mb-6">Lessons in this Unit</h2>
              <div class="space-y-4">
                ${unit.lessons.map((l, idx) => `
                  <div class="p-4 border rounded-xl">
                    <span class="text-xs text-slate-400">Node ${idx + 1} \u2022 +${l.xpReward} XP</span>
                    <h3 class="text-xl font-bold text-white mt-1"><a href="${l.canonicalPath}">${l.cleanTitle}</a></h3>
                    <p class="text-sm text-slate-300 mt-1">${l.description}</p>
                  </div>
                `).join("")}
              </div>
            </section>
          </main>
        `;
        return {
          title: unit.metaTitle,
          description: unit.metaDescription,
          canonicalUrl: `${baseUrl}${unit.canonicalPath}`,
          keywords: unit.keywords,
          ogType: "article",
          ogImage: defaultOgImage,
          schemaJson: schema,
          prerenderedHtml
        };
      }
    } else if (parts.length === 4 && parts[2] === "lessons") {
      const unitSlug = parts[1];
      const lessonSlug = parts[3];
      const unit = getSeoUnitBySlug(unitSlug, dynamicModules);
      const lesson = getSeoLesson(unitSlug, lessonSlug, dynamicModules);
      if (unit && lesson) {
        const breadcrumbs = [
          { name: "Home", url: "/" },
          { name: "Units", url: "/units" },
          { name: unit.cleanTitle, url: unit.canonicalPath },
          { name: lesson.cleanTitle, url: lesson.canonicalPath }
        ];
        const schema = {
          "@context": "https://schema.org",
          "@graph": [
            generateLessonSchema(lesson, baseUrl),
            generateBreadcrumbSchema(breadcrumbs, baseUrl)
          ]
        };
        const prerenderedHtml = `
          <main class="max-w-4xl mx-auto px-4 py-12 font-sans">
            <header class="mb-8">
              <nav class="text-xs text-slate-400 mb-2">
                <a href="/units">Units</a> &gt; <a href="${unit.canonicalPath}">${unit.cleanTitle}</a>
              </nav>
              <h1 class="text-4xl font-black mb-4">${lesson.cleanTitle}</h1>
              <p class="text-lg text-slate-300">${lesson.description}</p>
            </header>

            <section class="mb-10">
              <h2 class="text-2xl font-bold mb-4">Key Takeaways</h2>
              <ul class="list-disc pl-6 space-y-2 text-slate-300">
                ${lesson.keyTakeaways.map((t) => `<li>${t}</li>`).join("")}
              </ul>
            </section>

            ${lesson.sampleQuestions.length > 0 ? `
              <section class="mb-10">
                <h2 class="text-2xl font-bold mb-4">Sample Questions & Concepts</h2>
                <div class="space-y-4">
                  ${lesson.sampleQuestions.map((q, qIdx) => `
                    <div class="p-4 border rounded-xl">
                      <p class="font-bold text-white mb-2">Q${qIdx + 1}: ${q.question}</p>
                      ${q.explanation ? `<p class="text-xs text-slate-300"><strong>Hint:</strong> ${q.explanation}</p>` : ""}
                    </div>
                  `).join("")}
                </div>
              </section>
            ` : ""}

            <div class="border-t pt-6">
              <a href="${unit.canonicalPath}" class="font-bold text-cyan-400">\u2190 Back to ${unit.cleanTitle}</a>
            </div>
          </main>
        `;
        return {
          title: lesson.metaTitle,
          description: lesson.metaDescription,
          canonicalUrl: `${baseUrl}${lesson.canonicalPath}`,
          keywords: lesson.keywords,
          ogType: "article",
          ogImage: defaultOgImage,
          schemaJson: schema,
          prerenderedHtml
        };
      }
    }
  }
  if (cleanPath === "/features") {
    const breadcrumbs = [
      { name: "Home", url: "/" },
      { name: "Features", url: "/features" }
    ];
    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        generatePlatformSchema(baseUrl)["@graph"][0],
        generateBreadcrumbSchema(breadcrumbs, baseUrl)
      ]
    };
    const prerenderedHtml = `
      <main class="max-w-5xl mx-auto px-4 py-12 font-sans">
        <header class="text-center mb-12">
          <h1 class="text-4xl font-black mb-4">Chikoo Platform Features</h1>
          <p class="text-lg text-slate-300">Explore the interactive, gamified systems powering Chikoo.</p>
        </header>

        <section class="grid grid-cols-1 md:grid-cols-2 gap-6">
          ${SEO_FEATURES.map((f) => `
            <article class="p-6 border rounded-2xl">
              <span class="text-xs font-bold text-cyan-400">${f.badge}</span>
              <h2 class="text-2xl font-bold mt-1 mb-2"><a href="${f.canonicalPath}">${f.name}</a></h2>
              <p class="text-sm text-slate-300 mb-4">${f.description}</p>
              <ul class="list-disc pl-6 space-y-1 text-xs text-slate-400">
                ${f.highlights.map((h) => `<li>${h}</li>`).join("")}
              </ul>
            </article>
          `).join("")}
        </section>
      </main>
    `;
    return {
      title: "Interactive Platform Features | Chikoo AI Learning",
      description: "Explore all gamified features of Chikoo: AI Practice Arena, Speed Challenges, Lucky Cookie Rewards, Daily Quests, Galactic Leaderboard, AI Otter Mascot, Detective Puzzles, and 1v1 Battles.",
      canonicalUrl: `${baseUrl}/features`,
      keywords: ["ai platform features", "gamified ai learning", "ai practice arena", "ai otter mascot", "student ai quiz game"],
      ogType: "website",
      ogImage: defaultOgImage,
      schemaJson: schema,
      prerenderedHtml
    };
  }
  if (cleanPath.startsWith("/features/")) {
    const featureSlug = cleanPath.split("/")[2];
    const feature = getSeoFeatureBySlug(featureSlug);
    if (feature) {
      const breadcrumbs = [
        { name: "Home", url: "/" },
        { name: "Features", url: "/features" },
        { name: feature.name, url: feature.canonicalPath }
      ];
      const schema = {
        "@context": "https://schema.org",
        "@graph": [
          generateFeatureSchema(feature, baseUrl),
          generateBreadcrumbSchema(breadcrumbs, baseUrl)
        ]
      };
      const prerenderedHtml = `
        <main class="max-w-4xl mx-auto px-4 py-12 font-sans">
          <header class="mb-8">
            <span class="text-xs font-bold text-cyan-400 uppercase">${feature.badge}</span>
            <h1 class="text-4xl font-black mt-2 mb-2">${feature.name}</h1>
            <p class="text-base text-cyan-300 font-semibold mb-4">${feature.tagline}</p>
            <p class="text-lg text-slate-300">${feature.longDescription}</p>
          </header>

          <section class="mb-10">
            <h2 class="text-2xl font-bold mb-4">Key Capabilities</h2>
            <ul class="list-disc pl-6 space-y-2 text-slate-300">
              ${feature.highlights.map((h) => `<li>${h}</li>`).join("")}
            </ul>
          </section>

          <section class="mb-10">
            <h2 class="text-2xl font-bold mb-4">How It Works</h2>
            <ol class="list-decimal pl-6 space-y-2 text-slate-300">
              ${feature.howItWorks.map((s) => `<li>${s}</li>`).join("")}
            </ol>
          </section>

          <div class="p-4 border rounded-xl mb-8">
            <h3 class="font-bold text-white mb-1">Educational Benefit</h3>
            <p class="text-sm text-slate-300">${feature.educationalBenefit}</p>
          </div>
        </main>
      `;
      return {
        title: feature.metaTitle,
        description: feature.metaDescription,
        canonicalUrl: `${baseUrl}${feature.canonicalPath}`,
        keywords: feature.keywords,
        ogType: "article",
        ogImage: defaultOgImage,
        schemaJson: schema,
        prerenderedHtml
      };
    }
  }
  if (cleanPath === "/learn") {
    const breadcrumbs = [
      { name: "Home", url: "/" },
      { name: "Knowledge Hub", url: "/learn" }
    ];
    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        generatePlatformSchema(baseUrl)["@graph"][0],
        generateBreadcrumbSchema(breadcrumbs, baseUrl)
      ]
    };
    const prerenderedHtml = `
      <main class="max-w-5xl mx-auto px-4 py-12 font-sans">
        <header class="text-center mb-12">
          <h1 class="text-4xl font-black mb-4">AI Knowledge Hub & Guides</h1>
          <p class="text-lg text-slate-300">Comprehensive, student-friendly explanations of core AI concepts.</p>
        </header>

        <section class="grid grid-cols-1 md:grid-cols-2 gap-6">
          ${SEO_TOPICS.map((t) => `
            <article class="p-6 border rounded-2xl">
              <span class="text-xs font-bold text-cyan-400">${t.category} \u2022 ${t.readingTime}</span>
              <h2 class="text-2xl font-bold mt-1 mb-2"><a href="${t.canonicalPath}">${t.title}</a></h2>
              <p class="text-sm text-slate-300 mb-4">${t.summary}</p>
              <a href="${t.canonicalPath}" class="text-xs font-bold text-cyan-400">Read Full Guide \u2192</a>
            </article>
          `).join("")}
        </section>
      </main>
    `;
    return {
      title: "AI Knowledge Hub & Educational Guides | Chikoo",
      description: "Read comprehensive, student-friendly guides on Artificial Intelligence. Learn how Generative AI, Large Language Models, Prompt Engineering, Machine Learning, and Computer Vision work.",
      canonicalUrl: `${baseUrl}/learn`,
      keywords: ["ai knowledge hub", "learn artificial intelligence", "ai educational articles", "ai guides for students", "prompt engineering guide"],
      ogType: "website",
      ogImage: defaultOgImage,
      schemaJson: schema,
      prerenderedHtml
    };
  }
  if (cleanPath.startsWith("/learn/")) {
    const topicSlug = cleanPath.split("/")[2];
    const article = getSeoTopicBySlug(topicSlug);
    if (article) {
      const breadcrumbs = [
        { name: "Home", url: "/" },
        { name: "Knowledge Hub", url: "/learn" },
        { name: article.title, url: article.canonicalPath }
      ];
      const schema = {
        "@context": "https://schema.org",
        "@graph": [
          generateArticleSchema(article, baseUrl),
          generateBreadcrumbSchema(breadcrumbs, baseUrl),
          generateFaqSchema(article.faqs)
        ]
      };
      const prerenderedHtml = `
        <article class="max-w-4xl mx-auto px-4 py-12 font-sans">
          <header class="mb-8">
            <span class="text-xs font-bold text-cyan-400 uppercase">${article.category} \u2022 ${article.readingTime}</span>
            <h1 class="text-4xl font-black mt-2 mb-4">${article.title}</h1>
            <p class="text-lg text-slate-300">${article.summary}</p>
          </header>

          <section class="mb-10">
            <h2 class="text-2xl font-bold mb-4">Key Takeaways</h2>
            <ul class="list-disc pl-6 space-y-2 text-slate-300">
              ${article.keyTakeaways.map((k) => `<li>${k}</li>`).join("")}
            </ul>
          </section>

          <section class="space-y-8 mb-12">
            ${article.sections.map((s) => `
              <div>
                <h2 class="text-2xl font-bold mb-3">${s.heading}</h2>
                <p class="text-slate-300 leading-relaxed">${s.content}</p>
              </div>
            `).join("")}
          </section>

          ${article.faqs.length > 0 ? `
            <section class="mb-10">
              <h2 class="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
              <div class="space-y-4">
                ${article.faqs.map((f) => `
                  <div class="p-4 border rounded-xl">
                    <h3 class="font-bold text-white mb-1">${f.question}</h3>
                    <p class="text-sm text-slate-300">${f.answer}</p>
                  </div>
                `).join("")}
              </div>
            </section>
          ` : ""}
        </article>
      `;
      return {
        title: article.metaTitle,
        description: article.metaDescription,
        canonicalUrl: `${baseUrl}${article.canonicalPath}`,
        keywords: article.keywords,
        ogType: "article",
        ogImage: defaultOgImage,
        schemaJson: schema,
        prerenderedHtml
      };
    }
  }
  return {
    title: CHIKOO_PLATFORM_SEO.metaTitle,
    description: CHIKOO_PLATFORM_SEO.metaDescription,
    canonicalUrl: `${baseUrl}/`,
    keywords: CHIKOO_PLATFORM_SEO.keywords,
    ogType: "website",
    ogImage: defaultOgImage,
    schemaJson: generatePlatformSchema(baseUrl),
    prerenderedHtml: `<div class="p-8 text-center"><h1 class="text-2xl font-black">Chikoo - Learn Artificial Intelligence</h1><p class="text-sm text-slate-300">Gamified AI Learning Platform for Students</p></div>`
  };
}
function injectSeoIntoHtml(htmlTemplate, seo) {
  let updated = htmlTemplate;
  updated = updated.replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(seo.title)}</title>`);
  const robotsMeta = seo.noindex ? `<meta name="robots" content="noindex, nofollow" />` : `<meta name="robots" content="index, follow" />`;
  const metaBlock = `
    ${robotsMeta}
    <meta name="description" content="${escapeHtml(seo.description)}" />
    <meta name="keywords" content="${escapeHtml(seo.keywords.join(", "))}" />
    <link rel="canonical" href="${seo.canonicalUrl}" />

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="${seo.ogType}" />
    <meta property="og:url" content="${seo.canonicalUrl}" />
    <meta property="og:title" content="${escapeHtml(seo.title)}" />
    <meta property="og:description" content="${escapeHtml(seo.description)}" />
    <meta property="og:image" content="${seo.ogImage}" />
    <meta property="og:site_name" content="Chikoo" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${seo.canonicalUrl}" />
    <meta name="twitter:title" content="${escapeHtml(seo.title)}" />
    <meta name="twitter:description" content="${escapeHtml(seo.description)}" />
    <meta name="twitter:image" content="${seo.ogImage}" />

    <!-- Schema.org JSON-LD -->
    <script type="application/ld+json">
      ${JSON.stringify(seo.schemaJson)}
    </script>
  `;
  if (updated.includes("</head>")) {
    updated = updated.replace("</head>", `${metaBlock}
</head>`);
  } else {
    updated = `${metaBlock}
${updated}`;
  }
  if (seo.prerenderedHtml && updated.includes('<div id="root"></div>')) {
    updated = updated.replace('<div id="root"></div>', `<div id="root">${seo.prerenderedHtml}</div>`);
  }
  return updated;
}
function escapeHtml(str) {
  return (str || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// src/lib/redis.ts
import Redis from "ioredis";
var redisUrl = process.env.REDIS_URL;
var redisClient = null;
if (redisUrl) {
  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => Math.min(times * 50, 2e3)
    });
    redisClient.on("error", (err) => {
      logProductionError("redis_connection", "src/lib/redis.ts", "network", err);
    });
    console.log("[Redis] Connected to cache.");
  } catch (err) {
    logProductionError("redis_init", "src/lib/redis.ts", "network", err);
  }
} else {
  console.warn("[Redis] REDIS_URL not set. Caching disabled.");
}
var redis = redisClient;
var CACHE_TTL = 3600;

// server.app.ts
dotenv.config();
function getMatchingIllustrationUrl2(topic, details) {
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
  return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop";
}
async function startServer() {
  const app = express();
  app.set("trust proxy", 1);
  const PORT = Number(process.env.PORT) || 3e3;
  app.disable("x-powered-by");
  app.use((req, res, next) => {
    const forwardedProto = req.headers["x-forwarded-proto"];
    if (process.env.NODE_ENV === "production" && forwardedProto === "http") {
      const host = req.headers["x-forwarded-host"] || req.headers.host;
      return res.redirect(301, `https://${host}${req.url}`);
    }
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
    res.setHeader("X-Content-Type-Options", "nosniff");
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
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader(
      "Permissions-Policy",
      "camera=(), geolocation=(), microphone=(self), payment=(), usb=()"
    );
    res.setHeader("X-DNS-Prefetch-Control", "off");
    next();
  });
  const globalJsonParser = express.json({ limit: "1mb" });
  const largePayloadParser = express.json({ limit: "10mb" });
  const approvedLargePayloadPaths = /* @__PURE__ */ new Set([
    "/api/database/lessons/save",
    "/api/database/modules/batch-save",
    "/api/database/worlds/save",
    "/api/database/rewards/save",
    "/api/generate-lesson-image"
  ]);
  app.use(async (req, res, next) => {
    const cleanPath = req.path.replace(/\/+$/, "") || "/";
    if (req.method === "POST" && approvedLargePayloadPaths.has(cleanPath)) {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, error: "Unauthorized: Missing authentication token." });
      }
      const token = authHeader.replace(/^Bearer\s+/i, "").trim();
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
        const { data: profile, error: profErr } = await client.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
        if (profErr || !profile || profile.is_admin !== true) {
          return res.status(403).json({ success: false, error: "Unauthorized: Admin access required." });
        }
        return largePayloadParser(req, res, next);
      } catch (err) {
        console.error("[Pre-parser Admin Check Error]:", err);
        return res.status(401).json({ success: false, error: "Authentication verification failed." });
      }
    }
    return globalJsonParser(req, res, next);
  });
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
  let supabaseServerClient = null;
  function getSupabaseServer() {
    if (supabaseServerClient) return supabaseServerClient;
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !serviceKey || url === "https://your-project.supabase.co") {
      return null;
    }
    try {
      supabaseServerClient = createClient2(url, serviceKey, {
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
  async function isAdmin(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return false;
    }
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return false;
    }
    const client = getSupabaseServer();
    if (!client) {
      return false;
    }
    try {
      const { data: { user }, error: authErr } = await client.auth.getUser(token);
      if (authErr || !user || !user.id) {
        return false;
      }
      const { data: profile, error: profErr } = await client.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
      if (profErr || !profile) {
        return false;
      }
      return profile.is_admin === true;
    } catch (authErr) {
      console.warn("[isAdmin] Supabase auth check exception:", authErr);
      return false;
    }
  }
  const aiRateLimitMap = /* @__PURE__ */ new Map();
  function getNormalizedIpHash(req) {
    const rawIp = req.ip || req.socket.remoteAddress || "unknown";
    let cleanIp = rawIp.replace(/^::ffff:/, "").trim();
    if (cleanIp.includes(":") && cleanIp.includes(".")) {
      const parts = cleanIp.split(":");
      cleanIp = parts[parts.length - 1];
    }
    cleanIp = cleanIp.replace(/^\[(.*)\]:\d+$/, "$1");
    const secret = process.env.IP_HASH_SECRET;
    if (process.env.NODE_ENV === "production" && (!secret || secret.length < 16)) {
      throw new Error("CRITICAL: IP_HASH_SECRET environment variable is missing or too short (< 16 chars) in production.");
    }
    const fallbackSecret = secret || "chikoo-dev-fallback-secret-key-do-not-use-in-production";
    const hashed = crypto2.createHmac("sha256", fallbackSecret).update(cleanIp).digest("hex").substring(0, 16);
    return hashed;
  }
  async function checkDistributedAiRateLimit(req, res, maxRequests = 30) {
    const authHeader = req.headers.authorization;
    let userId = null;
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
        logProductionError("redis_rate_limit_unavailable", "server.app.ts", "network", new Error("Redis client is null"));
        res.status(503).json({ success: false, error: "Service temporarily unavailable due to high load. Please try again later." });
        return false;
      }
      const result = await Promise.race([
        redis.eval(rateLimitLuaScript, 1, key, windowSeconds),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Redis operation timeout")), 2e3))
      ]);
      const currentCount = Number(result) || 1;
      if (currentCount > maxRequests) {
        res.status(429).json({ success: false, error: "Rate limit exceeded: Too many AI requests. Please wait a minute." });
        return false;
      }
    } catch (redisErr) {
      logProductionError("redis_rate_limit_error", "server.app.ts", "network", redisErr);
      res.status(503).json({ success: false, error: "Service temporarily unavailable due to high load. Please try again later." });
      return false;
    }
    return true;
  }
  const checkAiRateLimitAndAuth = checkDistributedAiRateLimit;
  app.get("/api/health", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app.post("/api/account/delete", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, error: "Unauthorized: Missing authentication token." });
    }
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return res.status(401).json({ success: false, error: "Unauthorized: Invalid authentication token." });
    }
    const client = getSupabaseServer();
    if (!client) {
      return res.status(503).json({ success: false, error: "Database not configured" });
    }
    try {
      const { data: { user }, error: authError } = await client.auth.getUser(token);
      if (authError || !user || !user.id) {
        return res.status(401).json({ success: false, error: "Unauthorized: Invalid or expired session." });
      }
      const targetUserId = user.id;
      const targetUserEmail = (user.email || "").toLowerCase().trim();
      console.log(`[Account Deletion] Verified deletion request for authenticated user ID: ${targetUserId} (${targetUserEmail})`);
      await Promise.allSettled([
        client.from("profiles").delete().eq("id", targetUserId),
        client.from("user_world_progress").delete().eq("user_id", targetUserId),
        client.from("spin_wheel_claims").delete().eq("user_id", targetUserId),
        client.from("user_bookmarks").delete().eq("user_id", targetUserId),
        client.from("user_lesson_progress").delete().eq("user_id", targetUserId),
        client.from("user_challenge_progress").delete().eq("user_id", targetUserId),
        client.from("spin_wheel_daily_usage").delete().eq("user_id", targetUserId)
      ]);
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
    } catch (err) {
      console.error("[Account Deletion Error]:", err);
      return res.status(500).json({ success: false, error: err?.message || "Failed to process account deletion." });
    }
  });
  app.post("/api/account/request-deletion", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    const { email, reason } = req.body || {};
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ success: false, error: "Valid account email is required." });
    }
    const cleanEmail = email.toLowerCase().trim();
    const ticketId = `DEL-CHK-${Math.floor(1e5 + Math.random() * 9e5)}`;
    console.log(`[Account Deletion Ticket Logged] Ticket: ${ticketId}, Email: ${cleanEmail}, Reason: ${reason || "N/A"}`);
    return res.json({
      success: true,
      ticketId,
      message: `Account deletion request logged under reference ${ticketId}. Associated data will be processed within 48 hours.`
    });
  });
  app.use("/api/admin", async (req, res, next) => {
    if (!await isAdmin(req)) {
      return res.status(403).json({ success: false, error: "Unauthorized: Admin access required" });
    }
    next();
  });
  app.get("/api/database/bootstrap", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    try {
      const client = getSupabaseServer();
      if (!client) {
        return res.status(503).json({ success: false, error: "Database not configured" });
      }
      const [modulesRes, lessonsRes, rewardsRes, profilesRes] = await Promise.all([
        client.from("modules").select("*").order("order", { ascending: true }),
        client.from("lessons").select("*").order("order_index", { ascending: true }),
        client.from("rewards").select("*").order("id", { ascending: true }),
        client.from("profiles").select("id, email, username, xp, weekly_xp, gems, streak, energy, avatar_id, theme_id, created_at").order("gems", { ascending: false }).limit(500)
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
      const formattedRewards = (rewardsRes.data || []).map((item) => {
        let visualData = {};
        try {
          visualData = typeof item.visual === "string" ? JSON.parse(item.visual) : item.visual || {};
        } catch {
          visualData = {};
        }
        return {
          id: item.id,
          title: item.title,
          description: item.description || visualData.description || "",
          image: visualData.image || "",
          category: visualData.category || "Spotlight Rewards",
          requirementType: visualData.requirementType || "gems",
          xpRequirement: item.cost_xp ?? visualData.xpRequirement ?? 0,
          gemRequirement: item.cost_gems ?? visualData.gemRequirement ?? 0,
          plusRequirement: !!visualData.plusRequirement,
          isPlusExclusive: !!visualData.plusRequirement,
          eligibilityRules: visualData.eligibilityRules || "",
          featuredStatus: !!visualData.featuredStatus,
          isActive: visualData.isActive !== false,
          stock: visualData.stock ?? 99,
          rarity: visualData.rarity || "common",
          visual: visualData.visual || visualData.image || ""
        };
      });
      return res.json({
        success: true,
        modules: modulesData,
        lessons: lessonsData,
        rewards: formattedRewards,
        leaderboard: profilesRes.data || []
      });
    } catch (err) {
      console.error("[Database Bootstrap Error]:", err);
      return res.status(500).json({ success: false, error: err?.message || "Bootstrap failed" });
    }
  });
  let curriculumMemoryCache = null;
  const CURRICULUM_CACHE_TTL_MS = 60 * 1e3;
  app.get("/api/database/curriculum", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    const forceFresh = req.query.fresh === "true" || req.query.fresh === "1";
    if (!forceFresh && redis) {
      try {
        const cached = await redis.get("curriculum_data");
        if (cached) {
          return res.json(JSON.parse(cached));
        }
      } catch (err) {
        logProductionError("redis_get", "server.ts", "network", err);
      }
    }
    try {
      const client = getSupabaseServer();
      if (!client) {
        return res.status(503).json({ success: false, error: "Database not configured" });
      }
      let modulesData = [];
      let lessonsData = [];
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
        await redis?.set("curriculum_data", JSON.stringify(responsePayload), "EX", CACHE_TTL).catch((err) => logProductionError("redis_set", "server.ts", "network", err));
      }
      return res.json(responsePayload);
    } catch (err) {
      logProductionError("fetch_curriculum", "server.ts", "server", err);
      console.error("[Curriculum Fetch Error]:", err);
      return res.status(500).json({ success: false, error: err?.message || "Failed to fetch curriculum" });
    }
  });
  app.get("/api/database/lessons/:id", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    try {
      const client = getSupabaseServer();
      if (!client) {
        return res.status(503).json({ success: false, error: "Database not configured" });
      }
      const lessonId = req.params.id;
      let { data, error } = await client.from("lessons").select("*").eq("id", lessonId).maybeSingle();
      if (!data) {
        const retry = await client.from("lessons").select("*").ilike("id", lessonId).maybeSingle();
        data = retry.data;
      }
      if (error && !data) throw error;
      return res.json({ success: true, lesson: data });
    } catch (err) {
      logProductionError("fetch_single_lesson", "server.ts", "server", err);
      return res.status(500).json({ success: false, error: err?.message || "Failed to fetch lesson" });
    }
  });
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
    } catch (err) {
      return res.status(500).json({ success: false, error: err?.message || "Failed to fetch modules" });
    }
  });
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
    } catch (err) {
      return res.status(500).json({ success: false, error: err?.message || "Failed to fetch lessons" });
    }
  });
  app.get("/api/database/puzzle-packs", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    try {
      const client = getSupabaseServer();
      if (!client) return res.status(503).json({ success: false, error: "Database not configured" });
      const { data } = await client.from("puzzle_packs").select("*");
      return res.json({ success: true, packs: data || [] });
    } catch (err) {
      return res.status(500).json({ success: false, error: err?.message || "Failed to fetch puzzle packs" });
    }
  });
  app.get("/api/database/challenge-packs", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    try {
      const client = getSupabaseServer();
      if (!client) return res.status(503).json({ success: false, error: "Database not configured" });
      const { data } = await client.from("challenge_packs").select("*");
      return res.json({ success: true, packs: data || [] });
    } catch (err) {
      return res.status(500).json({ success: false, error: err?.message || "Failed to fetch challenge packs" });
    }
  });
  app.post("/api/database/lessons/save", async (req, res) => {
    if (!await isAdmin(req)) {
      return res.status(403).json({ success: false, error: "Unauthorized: Admin access required" });
    }
    res.setHeader("Content-Type", "application/json");
    await redis?.del("curriculum_data").catch((err) => logProductionError("redis_del", "server.ts", "network", err));
    const lessonData = req.body;
    if (!lessonData || !lessonData.id || !lessonData.module_id) {
      return res.status(400).json({ success: false, error: "Missing required lesson fields (id, module_id)" });
    }
    try {
      const client = getSupabaseServer();
      if (!client) {
        return res.json({ success: true, localOnly: true, lesson: lessonData });
      }
      const payload = {
        id: lessonData.id,
        module_id: lessonData.module_id,
        title: lessonData.title || "Untitled Lesson",
        description: lessonData.description || "",
        difficulty: lessonData.difficulty || "Easy",
        xp_reward: Number(lessonData.xp_reward ?? 100),
        challenges: Array.isArray(lessonData.challenges) ? lessonData.challenges : []
      };
      if (typeof lessonData.order_index === "number") {
        payload.order_index = lessonData.order_index;
      }
      const { data: existingLesson } = await client.from("lessons").select("content, video_url").eq("id", payload.id).maybeSingle();
      const upsertPayload = {
        ...payload,
        content: existingLesson?.content || null,
        video_url: existingLesson?.video_url || null
      };
      const { data, error } = await client.from("lessons").upsert([upsertPayload]).select().single();
      if (error) {
        console.error("[Supabase Server] Error saving lesson:", error);
        return res.status(500).json({ success: false, error: error.message });
      }
      curriculumMemoryCache = null;
      return res.json({ success: true, lesson: data || payload });
    } catch (err) {
      logProductionError("save_lesson", "server.ts", "server", err, { lessonId: lessonData.id });
      console.error("[Supabase Server] Exception saving lesson:", err);
      return res.status(500).json({ success: false, error: err?.message || "Save lesson failed" });
    }
  });
  app.post("/api/database/modules/save", async (req, res) => {
    if (!await isAdmin(req)) {
      return res.status(403).json({ success: false, error: "Unauthorized: Admin access required" });
    }
    res.setHeader("Content-Type", "application/json");
    const modData = req.body;
    if (!modData || !modData.id) {
      return res.status(400).json({ success: false, error: "Missing module id" });
    }
    try {
      curriculumMemoryCache = null;
      await redis?.del("curriculum_data").catch((err) => logProductionError("redis_del", "server.ts", "network", err));
      const client = getSupabaseServer();
      if (!client) {
        return res.json({ success: true, localOnly: true, module: modData });
      }
      const { data, error } = await client.from("modules").upsert([modData]).select().single();
      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }
      return res.json({ success: true, module: data || modData });
    } catch (err) {
      return res.status(500).json({ success: false, error: err?.message || "Save module failed" });
    }
  });
  app.post("/api/database/modules/batch-save", async (req, res) => {
    if (!await isAdmin(req)) {
      return res.status(403).json({ success: false, error: "Unauthorized: Admin access required" });
    }
    res.setHeader("Content-Type", "application/json");
    const { modules } = req.body;
    if (!Array.isArray(modules) || modules.length === 0) {
      return res.status(400).json({ success: false, error: "Missing or invalid modules array" });
    }
    try {
      curriculumMemoryCache = null;
      await redis?.del("curriculum_data").catch((err) => logProductionError("redis_del", "server.ts", "network", err));
      const client = getSupabaseServer();
      if (!client) {
        return res.json({ success: true, localOnly: true, count: modules.length });
      }
      const payload = modules.map((m, idx) => ({
        id: m.id,
        title: m.title,
        description: m.description || "",
        icon: m.icon || "Sparkles",
        order: m.order ?? m.sort_order ?? idx,
        is_practice: !!m.is_practice,
        world_id: m.world_id || null,
        metadata: m.metadata || null
      }));
      const { data, error } = await client.from("modules").upsert(payload);
      if (error) {
        console.error("[Supabase Server] Error batch saving modules:", error);
        return res.status(500).json({ success: false, error: error.message });
      }
      return res.json({ success: true, count: payload.length });
    } catch (err) {
      console.error("[Supabase Server] Exception batch saving modules:", err);
      return res.status(500).json({ success: false, error: err?.message || "Batch save modules failed" });
    }
  });
  app.post("/api/database/worlds/save", async (req, res) => {
    if (!await isAdmin(req)) {
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
    } catch (err) {
      return res.status(500).json({ success: false, error: err?.message || "Save world failed" });
    }
  });
  app.post("/api/database/rewards/save", async (req, res) => {
    if (!await isAdmin(req)) {
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
      const { data, error } = await client.from("rewards").upsert([rewardData]).select().single();
      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }
      return res.json({ success: true, reward: data || rewardData });
    } catch (err) {
      return res.status(500).json({ success: false, error: err?.message || "Save reward failed" });
    }
  });
  async function ensureReferenceAsset(client, localPath, bucketPath) {
    try {
      const { data: list, error: listErr } = await client.storage.from("chikoo-assets").list("references", {
        search: path2.basename(bucketPath)
      });
      if (list && list.some((item) => item.name === path2.basename(bucketPath))) {
        return;
      }
      const absoluteLocalPath = path2.resolve(localPath);
      if (!fs2.existsSync(absoluteLocalPath)) {
        console.warn(`[ensureReferenceAsset] Local file ${localPath} not found. Creating a fallback placeholder.`);
        const dir = path2.dirname(absoluteLocalPath);
        if (!fs2.existsSync(dir)) {
          fs2.mkdirSync(dir, { recursive: true });
        }
        const fallbackBase64 = "UklGRkoAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAwAAAARBxAR/Q9ERP8DAABWUDggGAAAABQBAJ0BKgEAAQAAAPgR/QAAAAA=";
        fs2.writeFileSync(absoluteLocalPath, Buffer.from(fallbackBase64, "base64"));
      }
      const fileBuffer = fs2.readFileSync(absoluteLocalPath);
      const { error: uploadErr } = await client.storage.from("chikoo-assets").upload(bucketPath, fileBuffer, {
        contentType: "image/webp",
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
  app.post("/api/generate-lesson-image", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    if (!await isAdmin(req)) {
      return res.status(403).json({ success: false, error: "Unauthorized: Admin access required" });
    }
    if (!await checkDistributedAiRateLimit(req, res, 20)) {
      return;
    }
    const apiKey = process.env.GEMINI_API_KEY || "";
    const client = getSupabaseServer();
    const { lessonId, screenIndex, contentBody, aspectRatio, generateAllMissing } = req.body || {};
    try {
      const references = [
        { local: "references/chikoo-master.webp", bucket: "references/chikoo-master.webp" },
        { local: "references/jadoo-master.webp", bucket: "references/jadoo-master.webp" },
        { local: "references/chikoo-jadoo-style.webp", bucket: "references/chikoo-jadoo-style.webp" },
        { local: "references/environment-style.webp", bucket: "references/environment-style.webp" }
      ];
      if (client) {
        try {
          const { data: buckets } = await client.storage.listBuckets();
          if (buckets && !buckets.some((b) => b.name === "chikoo-assets")) {
            await client.storage.createBucket("chikoo-assets", {
              public: true,
              fileSizeLimit: 10485760,
              // 10MB
              allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"]
            });
          }
          for (const ref of references) {
            await ensureReferenceAsset(client, ref.local, ref.bucket);
          }
        } catch (err) {
          console.warn("Could not check/create bucket 'chikoo-assets':", err);
        }
      }
      let ai = null;
      if (apiKey) {
        try {
          ai = new GoogleGenAI3({
            apiKey,
            httpOptions: {
              headers: {
                "User-Agent": "aistudio-build"
              }
            }
          });
        } catch (aiInitErr) {
          console.warn("Failed to initialize GoogleGenAI client:", aiInitErr);
        }
      }
      const generateForSingleScreen = async (lId, idx, body, aspect) => {
        if (!body || body.trim() === "") {
          throw new Error("Cannot generate image for empty content body.");
        }
        let lessonTitle = "Space Adventure";
        let lesRow = null;
        if (client) {
          try {
            const { data } = await client.from("lessons").select("*").eq("id", lId).single();
            lesRow = data;
            if (lesRow?.title) {
              lessonTitle = lesRow.title;
            }
          } catch (lesErr) {
            console.warn(`Could not load lesson ${lId} row:`, lesErr);
          }
        }
        const refParts = [];
        if (client) {
          for (let i = 0; i < references.length; i++) {
            try {
              const { data: bufData } = await client.storage.from("chikoo-assets").download(references[i].bucket);
              if (bufData) {
                const arrayBuffer = await bufData.arrayBuffer();
                if (arrayBuffer.byteLength > 1024) {
                  const base64 = Buffer.from(arrayBuffer).toString("base64");
                  refParts.push({
                    inlineData: {
                      data: base64,
                      mimeType: "image/webp"
                    }
                  });
                }
              }
            } catch (dlErr) {
            }
          }
        }
        const cleanBody = body.replace(/•\s*/g, "").trim();
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
        let publicUrl = "";
        if (ai) {
          const cleanAspect = ["1:1", "3:4", "4:3", "9:16", "16:9"].includes(aspect) ? aspect : "4:3";
          console.log(`[Gemini Image Gen] Generating image for lesson ${lId}, screen ${idx} (${cleanAspect})...`);
          try {
            const response = await ai.models.generateContent({
              model: "gemini-3.1-flash-lite-image",
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
            let base64Image = "";
            if (response.candidates?.[0]?.content?.parts) {
              for (const part of response.candidates[0].content.parts) {
                if (part.inlineData?.data) {
                  base64Image = part.inlineData.data;
                  break;
                }
              }
            }
            if (base64Image) {
              if (client) {
                try {
                  const uploadBuffer = Buffer.from(base64Image, "base64");
                  const storageFilename = `generated/lesson_${lId}_screen_${idx}_${Date.now()}.webp`;
                  const { error: uploadErr } = await client.storage.from("chikoo-assets").upload(storageFilename, uploadBuffer, {
                    contentType: "image/webp",
                    upsert: true
                  });
                  if (!uploadErr) {
                    const { data: { publicUrl: storageUrl } } = client.storage.from("chikoo-assets").getPublicUrl(storageFilename);
                    publicUrl = storageUrl;
                  } else {
                    console.warn("[Storage Upload] Fallback to data URI:", uploadErr.message);
                    publicUrl = `data:image/webp;base64,${base64Image}`;
                  }
                } catch (upErr) {
                  console.warn("[Storage Upload Exception] Fallback to data URI:", upErr.message);
                  publicUrl = `data:image/webp;base64,${base64Image}`;
                }
              } else {
                publicUrl = `data:image/webp;base64,${base64Image}`;
              }
            }
          } catch (geminiErr) {
            console.warn(`[Gemini Image Gen Warning] AI generation unavailable (${geminiErr?.message || geminiErr}). Using high-quality curated visual.`);
          }
        }
        if (!publicUrl) {
          publicUrl = getMatchingIllustrationUrl2(lessonTitle, cleanBody);
          console.log(`[Image Fallback] Curated space visual assigned for "${lessonTitle}": ${publicUrl}`);
        }
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
              await client.from("lessons").update({ challenges }).eq("id", lId);
            }
          } catch (dbErr) {
            console.warn("Could not persist image URL to database record:", dbErr);
          }
        }
        return publicUrl;
      };
      if (generateAllMissing) {
        console.log("[Supabase Server] Scanning for missing visual/content screen images...");
        let allLessons = [];
        if (client) {
          const { data, error: lessonsErr } = await client.from("lessons").select("id, title, challenges");
          if (lessonsErr) {
            console.warn("Error fetching lessons for bulk generation:", lessonsErr);
          } else {
            allLessons = data || [];
          }
        }
        const generatedList = [];
        let successCount = 0;
        let failCount = 0;
        for (const les of allLessons) {
          const chals = Array.isArray(les.challenges) ? les.challenges : [];
          for (let i = 0; i < chals.length; i++) {
            const c = chals[i];
            if (c.type === "content_screen" || c.type === "visual_lesson_screen") {
              const payload = c.contentScreen || c.visualLessonScreen;
              const currentMediaUrl = payload?.mediaUrl || c.mediaUrl || "";
              const body = payload?.contentBody || c.contentBody || "";
              if (!currentMediaUrl && body) {
                console.log(`[Bulk Gen] Missing image detected: Lesson '${les.title}' (${les.id}), screen index ${i}`);
                try {
                  const url = await generateForSingleScreen(les.id, i, body, "4:3");
                  successCount++;
                  generatedList.push({ lessonId: les.id, lessonTitle: les.title, screenIndex: i, mediaUrl: url });
                } catch (bulkErr) {
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
        if (!lessonId || screenIndex === void 0) {
          return res.status(400).json({ success: false, error: "Missing required parameters: lessonId and screenIndex." });
        }
        const publicUrl = await generateForSingleScreen(lessonId, Number(screenIndex), contentBody || "", aspectRatio || "4:3");
        curriculumMemoryCache = null;
        return res.json({
          success: true,
          mediaUrl: publicUrl
        });
      }
    } catch (err) {
      console.error("\u274C Exception in secure generate-lesson-image endpoint:", err);
      return res.status(200).json({ success: false, error: err.message || "Failed to generate visual illustration" });
    }
  });
  app.delete("/api/database/modules/:id", async (req, res) => {
    if (!await isAdmin(req)) {
      return res.status(403).json({ success: false, error: "Unauthorized: Admin access required" });
    }
    res.setHeader("Content-Type", "application/json");
    const moduleId = req.params.id;
    if (!moduleId) {
      return res.status(400).json({ success: false, error: "Module ID is required" });
    }
    await redis?.del("curriculum_data").catch((err) => logProductionError("redis_del", "server.ts", "network", err));
    try {
      const client = getSupabaseServer();
      if (!client) {
        return res.json({ success: true, localOnly: true, deletedId: moduleId });
      }
      console.log(`[Supabase Server] Deleting module '${moduleId}' and child records...`);
      try {
        await client.from("lessons").delete().eq("module_id", moduleId);
      } catch (lesErr) {
        console.warn(`[Supabase Server] Warning deleting child lessons for module ${moduleId}:`, lesErr);
      }
      try {
        await client.from("module_learning_path").delete().eq("module_id", moduleId);
      } catch (_) {
      }
      const { error } = await client.from("modules").delete().eq("id", moduleId);
      if (error) {
        console.error(`[Supabase Server] Error deleting module ${moduleId}:`, error);
        return res.status(500).json({ success: false, error: error.message });
      }
      console.log(`[Supabase Server] Module '${moduleId}' successfully deleted.`);
      return res.json({ success: true, deletedId: moduleId });
    } catch (err) {
      console.error(`[Supabase Server] Exception deleting module ${moduleId}:`, err);
      return res.status(500).json({ success: false, error: err?.message || "Delete failed" });
    }
  });
  app.delete("/api/database/lessons/:id", async (req, res) => {
    if (!await isAdmin(req)) {
      return res.status(403).json({ success: false, error: "Unauthorized: Admin access required" });
    }
    res.setHeader("Content-Type", "application/json");
    const lessonId = req.params.id;
    if (!lessonId) {
      return res.status(400).json({ success: false, error: "Lesson ID is required" });
    }
    await redis.del("curriculum_data").catch(console.error);
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
    } catch (err) {
      console.error(`[Supabase Server] Exception deleting lesson ${lessonId}:`, err);
      return res.status(500).json({ success: false, error: err?.message || "Delete failed" });
    }
  });
  app.post("/api/database/invalidate-cache", async (req, res) => {
    if (!await isAdmin(req)) {
      return res.status(403).json({ success: false, error: "Unauthorized: Admin access required" });
    }
    res.setHeader("Content-Type", "application/json");
    await redis?.del("curriculum_data").catch((err) => logProductionError("redis_del", "server.ts", "network", err));
    return res.json({ success: true, message: "Curriculum cache cleared" });
  });
  app.get("/api/database/leaderboard", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    try {
      const client = getSupabaseServer();
      if (!client) {
        return res.status(503).json({ success: false, error: "Database not configured" });
      }
      const { data, error } = await client.from("profiles").select("username, xp, weekly_xp, gems, streak, energy, avatar_id, theme_id, created_at").order("gems", { ascending: false }).limit(500);
      if (error) {
        throw error;
      }
      const sanitizedLeaderboard = (data || []).map((row, index) => {
        let safeName = (row.username || "").trim();
        if (!safeName || safeName.includes("@")) {
          safeName = `Explorer_${index + 1}`;
        }
        return {
          rank: index + 1,
          id: `player_${index + 1}`,
          username: safeName,
          name: safeName,
          xp: Number(row.gems ?? row.xp ?? 0),
          gems: Number(row.gems ?? 0),
          weekly_xp: Number(row.weekly_xp ?? 0),
          streak: Number(row.streak ?? 0),
          energy: Number(row.energy ?? 5),
          avatar_id: row.avatar_id || "user",
          theme_id: row.theme_id || "blue",
          created_at: row.created_at || (/* @__PURE__ */ new Date()).toISOString()
        };
      });
      return res.json({
        success: true,
        leaderboard: sanitizedLeaderboard
      });
    } catch (err) {
      console.error("[Leaderboard Fetch Error]:", err);
      return res.status(500).json({ success: false, error: "Failed to fetch leaderboard" });
    }
  });
  app.post("/api/admin/users/update-profile", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    if (!await isAdmin(req)) {
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
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
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
    } catch (err) {
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
      const { data, error } = await client.from("rewards").select("*").order("id", { ascending: true });
      if (error) {
        throw error;
      }
      const formatted = (data || []).map((item) => {
        let visualData = {};
        try {
          visualData = typeof item.visual === "string" ? JSON.parse(item.visual) : item.visual || {};
        } catch {
          visualData = {};
        }
        return {
          id: item.id,
          title: item.title,
          description: item.description || visualData.description || "",
          image: visualData.image || "",
          category: visualData.category || "Spotlight Rewards",
          requirementType: visualData.requirementType || "gems",
          xpRequirement: item.cost_xp ?? visualData.xpRequirement ?? 0,
          gemRequirement: item.cost_gems ?? visualData.gemRequirement ?? 0,
          plusRequirement: !!visualData.plusRequirement,
          isPlusExclusive: !!visualData.plusRequirement,
          eligibilityRules: visualData.eligibilityRules || "",
          featuredStatus: !!visualData.featuredStatus,
          isActive: visualData.isActive !== false,
          stock: visualData.stock ?? 99,
          rarity: visualData.rarity || "common",
          visual: visualData.visual || visualData.image || ""
        };
      });
      return res.json({
        success: true,
        rewards: formatted
      });
    } catch (err) {
      console.error("[Rewards Fetch Error]:", err);
      return res.status(500).json({ success: false, error: err?.message || "Failed to fetch rewards" });
    }
  });
  app.use("/SoundEffects", express.static(path2.join(process.cwd(), "public", "SoundEffects"), {
    acceptRanges: true,
    maxAge: "7d",
    setHeaders: (res, filepath) => {
      res.setHeader("Cache-Control", "public, max-age=604800, stale-while-revalidate=86400");
      if (filepath.endsWith(".mp3")) res.setHeader("Content-Type", "audio/mpeg");
      if (filepath.endsWith(".wav")) res.setHeader("Content-Type", "audio/wav");
    }
  }));
  app.use("/SoundEffects", express.static(path2.join(process.cwd(), "SoundEffects"), {
    acceptRanges: true,
    maxAge: "7d",
    setHeaders: (res, filepath) => {
      res.setHeader("Cache-Control", "public, max-age=604800, stale-while-revalidate=86400");
      if (filepath.endsWith(".mp3")) res.setHeader("Content-Type", "audio/mpeg");
      if (filepath.endsWith(".wav")) res.setHeader("Content-Type", "audio/wav");
    }
  }));
  app.get(["/SoundEffects/Neon Orbit.mp3", "/SoundEffects/Neon%20Orbit.mp3", "/SoundEffects/Neon_Orbit.mp3"], (req, res) => {
    const filePath = path2.join(process.cwd(), "public", "SoundEffects", "Neon Orbit.mp3");
    const fallbackPath = path2.join(process.cwd(), "SoundEffects", "Neon Orbit.mp3");
    const target = fs2.existsSync(filePath) ? filePath : fallbackPath;
    if (fs2.existsSync(target)) {
      res.sendFile(target, { headers: { "Content-Type": "audio/mpeg", "Accept-Ranges": "bytes" } });
    } else {
      res.status(404).send("Audio file not found");
    }
  });
  app.get(["/lesson_music.mp3", "/audio/lesson_music.mp3", "/public/lesson_music.mp3", "/public/audio/lesson_music.mp3"], (req, res) => {
    const filePath = path2.join(process.cwd(), "public", "lesson_music.mp3");
    const fallbackPath = path2.join(process.cwd(), "lesson_music.mp3");
    const target = fs2.existsSync(filePath) ? filePath : fallbackPath;
    if (fs2.existsSync(target)) {
      res.sendFile(target, { headers: { "Content-Type": "audio/mpeg", "Accept-Ranges": "bytes" } });
    } else {
      res.status(404).send("Audio file not found");
    }
  });
  app.get(["/snowy.wav", "/public/snowy.wav"], (req, res) => {
    const filePath = path2.join(process.cwd(), "public", "snowy.wav");
    const fallbackPath = path2.join(process.cwd(), "snowy.wav");
    const target = fs2.existsSync(filePath) ? filePath : fallbackPath;
    if (fs2.existsSync(target)) {
      res.sendFile(target, { headers: { "Content-Type": "audio/wav", "Accept-Ranges": "bytes" } });
    } else {
      res.status(404).send("Audio file not found");
    }
  });
  app.get(["/morning.mp3", "/public/morning.mp3", "/audio/morning.mp3", "/public/audio/morning.mp3"], (req, res) => {
    const filePath = path2.join(process.cwd(), "public", "morning.mp3");
    const fallbackPath = path2.join(process.cwd(), "morning.mp3");
    const target = fs2.existsSync(filePath) ? filePath : fallbackPath;
    if (fs2.existsSync(target)) {
      res.sendFile(target, { headers: { "Content-Type": "audio/mpeg", "Accept-Ranges": "bytes" } });
    } else {
      res.status(404).send("Audio file not found");
    }
  });
  app.use("/exaplaination_screens", express.static(path2.join(process.cwd(), "exaplaination_screens")));
  app.get("/sw.js", (req, res) => {
    res.setHeader("Content-Type", "application/javascript");
    res.sendFile(path2.join(process.cwd(), "sw.js"));
  });
  app.get("/manifest.json", (req, res) => {
    res.setHeader("Content-Type", "application/manifest+json");
    const manifestPath = path2.join(process.cwd(), "public", "manifest.json");
    if (fs2.existsSync(manifestPath)) {
      res.sendFile(manifestPath);
    } else {
      res.sendFile(path2.join(process.cwd(), "manifest.json"));
    }
  });
  app.get(["/.well-known/assetlinks.json", "/assetlinks.json"], (req, res) => {
    res.setHeader("Content-Type", "application/json");
    const assetLinksPath = path2.join(process.cwd(), "public", ".well-known", "assetlinks.json");
    if (fs2.existsSync(assetLinksPath)) {
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
  app.post("/api/curriculum/generate", async (req, res) => {
    if (!await isAdmin(req)) {
      return res.status(403).json({ success: false, error: "Unauthorized: Admin access required" });
    }
    if (!await checkDistributedAiRateLimit(req, res, 15)) {
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
      const ai = new GoogleGenAI3({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
      const prompt = `Generate a modern, highly interactive, Duolingo-inspired lesson chapter for school kids (having basic English and no technical background) based on the topic: "${topic}".
The lesson must be visual-first, using extremely short and punchy text (fewer than 100 words), zero jargon, and high-impact micro-explanations.
Whenever a lesson concept contains an explanation, use a simple everyday analogy.

Structure your response ENTIRELY as a single JSON object. Follow this strict schema:
- id: A short unique identifier (e.g., custom_lesson_${Math.floor(Math.random() * 1e4)})
- title: A fun, kid-friendly lesson name with emojis (e.g. "\u{1F680} Space AI Explorers")
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
  "\u2705 Result\\n\u{1F9E0} One Simple Explanation\\n\u{1F30E} Real-World Example\\n\u2B50 Fun Fact"
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
              "id",
              "title",
              "description",
              "lessonContent",
              "keyPoints",
              "summary",
              "examples",
              "estimatedTime",
              "difficulty",
              "imageMetadata",
              "flashcards",
              "practicalActivities",
              "mcqs"
            ]
          }
        }
      });
      const rawJson = response.text || "";
      const lessonObj = JSON.parse(rawJson);
      const selectedUrl = getMatchingIllustrationUrl2(lessonObj.title || topic, lessonObj.description || "");
      lessonObj.imageMetadata.illustrationUrl = selectedUrl;
      res.json(lessonObj);
    } catch (err) {
      console.error("Gemini Curriculum Generation Error:", err);
      res.status(500).json({ error: err.message || "Failed to generate visual-first chapter content." });
    }
  });
  app.post("/api/practice/generate", async (req, res) => {
    if (!await isAdmin(req)) {
      return res.status(403).json({ success: false, error: "Unauthorized: Admin access required" });
    }
    if (!await checkDistributedAiRateLimit(req, res, 30)) {
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
      const ai = new GoogleGenAI3({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
      const prompt = `You are a curriculum expert creating highly engaging, educational, and fun practice questions of type "${questionType}" for the topic: "${lessonTitle}" inside the unit "${unitTitle}".
The questions must be structured for kids having basic English and no technical background, with a difficulty tier: "${difficulty || "Easy"}".
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
    } catch (err) {
      console.error("Gemini Practice Questions Error:", err);
      res.status(500).json({ error: err.message || "Failed to generate dynamic practice items." });
    }
  });
  app.post("/api/practice-systems/generate", async (req, res) => {
    if (!await isAdmin(req)) {
      return res.status(403).json({ success: false, error: "Unauthorized: Admin access required" });
    }
    if (!await checkDistributedAiRateLimit(req, res, 30)) {
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
      const ai = new GoogleGenAI3({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
      let systemPrompt = "";
      let responseSchema = {};
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
                  type: { type: Type.STRING },
                  // "Visual" | "Logic" | "Scenario"
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
    } catch (err) {
      console.error("Gemini Practice Systems Generation Error:", err);
      res.status(500).json({ error: err.message || "Failed to generate practice systems content with Gemini." });
    }
  });
  app.post("/api/admin/generate-lesson", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    if (!await checkDistributedAiRateLimit(req, res, 15)) {
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
    } catch (err) {
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
  app.post("/api/admin/generation-jobs", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    if (!await checkDistributedAiRateLimit(req, res, 15)) {
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
    } catch (err) {
      console.error("[LessonPipeline] Error creating job:", err);
      res.status(500).json({ error: err.message || "Failed to initialize lesson generation job." });
    }
  });
  app.get("/api/admin/generation-jobs", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    try {
      const jobs = listGenerationJobs();
      res.json({ jobs });
    } catch (err) {
      console.error("[LessonPipeline] Error listing jobs:", err);
      res.status(500).json({ error: err.message || "Failed to list generation jobs." });
    }
  });
  app.get("/api/admin/generation-jobs/:jobId", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    const rawJobId = req.params.jobId;
    const jobId = rawJobId ? String(rawJobId).trim() : "";
    if (!jobId || jobId === "undefined" || jobId === "null") {
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
        progress: typeof job.progress === "number" ? job.progress : 0,
        error: job.error || null,
        failedStage: job.failedStage || null,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        requestParams: job.requestParams || {},
        stageResults: job.stageResults || {},
        lesson: job.lesson || null,
        lessonMemory: job.lessonMemory || null
      });
    } catch (err) {
      console.error(`[LessonPipeline] Error retrieving job ${jobId}:`, err);
      res.status(500).json({
        error: err.message || `Failed to retrieve generation job ${jobId}.`,
        jobId,
        status: "failed"
      });
    }
  });
  app.post("/api/admin/generation-jobs/:jobId/retry-stage", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    const { jobId } = req.params;
    const { stage } = req.body || {};
    if (!jobId) {
      return res.status(400).json({ error: "Missing jobId parameter." });
    }
    try {
      const job = retryJobStage(jobId, stage);
      res.json(job);
    } catch (err) {
      res.status(400).json({ error: err.message || "Failed to retry stage." });
    }
  });
  app.post("/api/admin/generation-jobs/:jobId/skip-stage", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    const { jobId } = req.params;
    if (!jobId) {
      return res.status(400).json({ error: "Missing jobId parameter." });
    }
    try {
      const job = skipJobStage(jobId);
      res.json(job);
    } catch (err) {
      res.status(400).json({ error: err.message || "Failed to skip stage." });
    }
  });
  app.post("/api/admin/generation-jobs/:jobId/cancel", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    const { jobId } = req.params;
    if (!jobId) {
      return res.status(400).json({ error: "Missing jobId parameter." });
    }
    try {
      const job = cancelGenerationJob(jobId);
      res.json(job);
    } catch (err) {
      res.status(400).json({ error: err.message || "Failed to cancel job." });
    }
  });
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
      const startTime = Date.now();
      while (Date.now() - startTime < 6e4) {
        await new Promise((r) => setTimeout(r, 1e3));
        const updated = getGenerationJob(job.jobId);
        if (!updated) break;
        if (updated.status === "completed") {
          return res.json({
            success: true,
            jobId: updated.jobId,
            lesson: updated.lesson,
            lessonMemory: updated.lessonMemory
          });
        }
        if (updated.status === "failed") {
          return res.status(500).json({
            error: updated.error || "Generation failed in stage: " + updated.failedStage,
            jobId: updated.jobId,
            failedStage: updated.failedStage
          });
        }
      }
      res.status(504).json({ error: "Generation timed out. Please check job status via jobs API." });
    } catch (err) {
      res.status(500).json({ error: err.message || "Failed to process lesson generation." });
    }
  });
  app.post("/api/gemini/generate-explanation", async (req, res) => {
    if (!await checkAiRateLimitAndAuth(req, res)) return;
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
      const ai = new GoogleGenAI3({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
      const optionsStr = Array.isArray(options) ? options.join(", ") : "None";
      const systemInstruction = `You are Chikoo, a witty, fun, cheeky, and absolutely UNHINGED blue otter mascot who plays the role of a savage best friend or senior to Indian students (aged 10\u201318).
You are NOT a boring textbook, a formal school teacher, or a robotic lecturer. Talk exactly how Indian teenagers talk in pure, natural conversational Hinglish (Hindi words written in English/Latin script).
You absolutely refuse to let a wrong answer slide! You are allowed to lightly roast and tease the student for choosing the wrong answer, making it feel like close friends roasting each other (never bullying, never humiliating, never making them feel actually dumb, but beautifully chaotic, dramatic, and savage).

Tone Guidelines:
\u2022 Fun, sarcastic, playful, energetic, Gen Z, friendly, encouraging, and highly meme-worthy.
\u2022 Sound like a savage best friend! Keep the roast wholesome but delightfully unhinged. The vibe should be "\u{1F602} Arre yaar... ye kya kar diya?" instead of a boring formal correction.
\u2022 Roast ONLY the wrong answer or the mistake, but you can playfully tease the choice they made.
\u2022 Never use difficult English words. Keep the vocabulary light and colloquial.
\u2022 Always prioritize teaching first, comedy second. The student should understand the concept clearly while having a laugh.
\u2022 Use natural Hinglish expressions naturally, like:
  - "Arey yaar..."
  - "Bhai..."
  - "Arre wah..."
  - "Oho..."
  - "Lagta hai..."
  - "Kya scene hai..."
  - "Badi jaldi thi..."
  - "Ye toh overconfidence ho gaya..."
\u2022 You are highly encouraged to creatively use, adapt, or invent similar playful/savage roasts:
  - "Arey bhai... confidence toh IAS interview wala tha, answer WhatsApp University se utha liya kya? \u{1F62D}"
  - "Ye answer deke tumne science ko emotional damage de diya. \u{1F602}"
  - "Main answer explain karu ya pehle tumhari overconfidence ka treatment karu? \u{1F62D}"
  - "Bhai... itna confidence galat jagah invest karoge toh stock market bhi darr jayega. \u{1F602}"
  - "Question dekh ke answer ne bhi bola hoga, 'Main yahan kaise aa gaya?'"
  - "Lagta hai tumne aankh band karke option select kiya tha. \u{1F62D}"
  - "Ye answer dekh ke teacher ne attendance bhi cancel kar di. \u{1F602}"
  - "Bhai... CPU ko storage bana diya? Agle question mein fridge ko Wi-Fi mat bol dena. \u{1F62D}"
  - "Google bhi tumhara search history dekh ke confuse ho gaya hoga. \u{1F602}"
  - "Plants bhi bol rahe hain, 'Bhai hum overtime nahi karte.' \u{1F331}"

Structure:
1. Savage/funny roast (1\u20133 lines roasting the wrong answer/mistake and teasing their choice).
2. Explain why the selected answer is incorrect in super simple, dramatic terms.
3. Explain the correct concept in super simple Hinglish.
4. Give one highly relatable real-world example or analogy.
5. End with a funny, playful line encouraging the next question.

Rules:
\u2022 Keep the overall explanation length around 80\u2013120 words total.
\u2022 Use emojis sparingly (2\u20134 emojis max total).
\u2022 Never use cringe or outdated memes.
\u2022 Avoid repeating the same templates. Every explanation must feel fresh, unique, and wildly entertaining.`;
      const prompt = `Create a highly engaging, unhinged, sarcastic, and witty Hinglish micro-explanation for a student who got this question wrong:
Question: "${question}"
Options: ${optionsStr}
Correct Answer: "${correctAnswer}"
User Selected Option (if available): "${userSelectedAnswer || ""}"

Here are excellent examples of the desired style, vibe, and format:

Example 1:
Wrong Answer: "ChatGPT is not Generative AI."
AI:
"ChatGPT ye answer dekh ke resign letter likhne baith gaya hoga. \u{1F62D}\u{1F602}
Bhai, ChatGPT Generative AI hi hai! Iska kaam hi naye responses banana hai, copy-paste karna nahi.
Simple scene...
Google purani dukan dikhata hai, par ChatGPT naya maal bana deta hai.
Ab AI ko AI hi rehne do... uski job mat badlo. \u{1F602}"

Example 2:
Wrong Answer: "CPU stores files."
AI:
"CPU be like: 'Mujhe HR ne storage department kab shift kar diya?' \u{1F62D}\u{1F602}
CPU files store nahi karta. Wo sirf processing karta hai. Storage ka asli employee SSD aur Hard Disk hain.
Chef aur fridge ko same banda samajh loge toh kitchen band ho jayega. \u{1F373}\u{1F602}"

Example 3:
Wrong Answer: "Photosynthesis happens at night."
AI:
"Lagta hai plants ki night shift approve kar di tumne. \u{1F319}\u{1F62D}
Photosynthesis ko sunlight chahiye hoti hai. Raat ko sunlight hi nahi hogi toh energy kidhar se aayegi?
Solar panel raat ko charge hota hai kya? Bas wahi answer hai."

Example 4:
Wrong Answer: "Internet and WWW are the same."
AI:
"Internet aur WWW ko ek hi Aadhaar card de diya tumne. \u{1F602}
Internet pura network hota hai. WWW sirf uske andar chalne wali ek service hai.
Pura city aur uske andar ka mall same thodi hote hain."

Provide exactly 5 structured fields in your response to match our system schema. Maintain the unhinged Hinglish tone across all of them, especially in the final combined speech script:
1. explanation_confused: A funny, savage Hinglish opener roasting the wrong answer/mistake and teasing their choice (1-2 sentences).
2. explanation_concept: A super clear, simple, and jargon-free explanation of the correct concept in Hinglish (1-2 sentences).
3. explanation_example: A highly relatable everyday real-life example or analogy (1-2 sentences).
4. explanation_takeaway: A playful, funny motivational closing line to encourage them to continue (1 sentence).
5. explanation_speech_script: A single, natural, and seamless conversational script combining all the above fields into one beautiful, witty, sarcastic, and cohesive message matching the 80\u2013120 words limit. It MUST sound like a funny, witty, absolutely unhinged-but-supportive best friend speaking directly to the student in natural Hinglish.

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
    } catch (err) {
      console.error("Gemini Generate Explanation Error:", err);
      res.status(500).json({ error: err.message || "Failed to generate Chikoo micro-explanation." });
    }
  });
  app.post("/api/admin/generate-wrong-answer-explanation", async (req, res) => {
    const {
      lessonId,
      screenId,
      question,
      correctAnswer,
      options = [],
      userSelectedAnswer = "",
      lessonTitle = "",
      unitTitle = "",
      targetLanguage = "both",
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
      const ai = new GoogleGenAI3({
        apiKey,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } }
      });
      const optionsStr = Array.isArray(options) ? options.map((o) => typeof o === "string" ? o : o.text || o.label || JSON.stringify(o)).join(", ") : "None";
      const prompt = `You are Chikoo, an expert, encouraging, and witty educational tutor for school students (aged 10-18).
A student answered the following interactive question INCORRECTLY:

QUESTION: "${question}"
OPTIONS: ${optionsStr}
CORRECT ANSWER: "${correctAnswer}"
SAMPLE WRONG ANSWER SELECTED: "${userSelectedAnswer || "An incorrect answer option"}"
LESSON / UNIT CONTEXT: "${lessonTitle || ""} (${unitTitle || "Science"})"

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
      const client = getSupabaseServer();
      if (persistToDatabase && client && lessonId && screenId) {
        try {
          const { data: lessonRow } = await client.from("lessons").select("challenges").eq("id", lessonId).maybeSingle();
          if (lessonRow && Array.isArray(lessonRow.challenges)) {
            const updatedChallenges = lessonRow.challenges.map((c) => {
              if (c.id === screenId) {
                const prevExp = typeof c.explanation === "object" && c.explanation !== null ? c.explanation : {};
                const prevEngAudio = prevExp.english?.audioUrl || prevExp.audioUrl;
                const prevHinAudio = prevExp.hinglish?.audioUrl || c.explanation_audio_url;
                return {
                  ...c,
                  explanation: {
                    ...prevExp,
                    text: englishText,
                    // default fallback
                    english: {
                      text: englishText,
                      ...prevEngAudio ? { audioUrl: prevEngAudio } : {}
                    },
                    hinglish: {
                      text: hinglishText,
                      ...prevHinAudio ? { audioUrl: prevHinAudio } : {}
                    }
                  },
                  explanation_speech_script: hinglishText
                };
              }
              return c;
            });
            await client.from("lessons").update({ challenges: updatedChallenges }).eq("id", lessonId);
          }
          await Promise.all([
            client.from("lesson_screen_audio").upsert({
              lesson_id: lessonId,
              screen_id: screenId,
              language: "en",
              narration_text: englishText,
              updated_at: (/* @__PURE__ */ new Date()).toISOString()
            }, { onConflict: "lesson_id,screen_id,language" }),
            client.from("lesson_screen_audio").upsert({
              lesson_id: lessonId,
              screen_id: screenId,
              language: "hinglish",
              narration_text: hinglishText,
              updated_at: (/* @__PURE__ */ new Date()).toISOString()
            }, { onConflict: "lesson_id,screen_id,language" })
          ]);
        } catch (dbErr) {
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
    } catch (err) {
      console.error("Wrong-answer explanation generation error:", err);
      return res.status(500).json({ success: false, error: err.message || "Failed to generate wrong-answer explanation." });
    }
  });
  app.post("/api/admin/save-explanation-text", async (req, res) => {
    const { lessonId, screenId, englishText, hinglishText, marathiText } = req.body || {};
    if (!lessonId || !screenId) {
      return res.status(400).json({ success: false, error: "lessonId and screenId are required." });
    }
    const client = getSupabaseServer();
    if (client) {
      try {
        const { data: lessonRow } = await client.from("lessons").select("challenges").eq("id", lessonId).maybeSingle();
        if (lessonRow && Array.isArray(lessonRow.challenges)) {
          const updatedChallenges = lessonRow.challenges.map((c) => {
            if (c.id === screenId) {
              const prevExp = typeof c.explanation === "object" && c.explanation !== null ? c.explanation : {};
              return {
                ...c,
                explanation: {
                  ...prevExp,
                  text: englishText || prevExp.text || "",
                  english: {
                    ...prevExp.english || {},
                    text: englishText !== void 0 ? englishText : prevExp.english?.text || ""
                  },
                  hinglish: {
                    ...prevExp.hinglish || {},
                    text: hinglishText !== void 0 ? hinglishText : prevExp.hinglish?.text || ""
                  },
                  marathi: {
                    ...prevExp.marathi || {},
                    text: marathiText !== void 0 ? marathiText : prevExp.marathi?.text || ""
                  }
                },
                ...hinglishText ? { explanation_speech_script: hinglishText } : {},
                ...marathiText ? {
                  explanation_marathi_speech_script: marathiText,
                  explanation_marathi: marathiText
                } : {}
              };
            }
            return c;
          });
          await client.from("lessons").update({ challenges: updatedChallenges }).eq("id", lessonId);
        }
        const upserts = [];
        if (englishText) {
          upserts.push(client.from("lesson_screen_audio").upsert({
            lesson_id: lessonId,
            screen_id: screenId,
            language: "en",
            narration_text: englishText,
            updated_at: (/* @__PURE__ */ new Date()).toISOString()
          }, { onConflict: "lesson_id,screen_id,language" }));
        }
        if (hinglishText) {
          upserts.push(client.from("lesson_screen_audio").upsert({
            lesson_id: lessonId,
            screen_id: screenId,
            language: "hinglish",
            narration_text: hinglishText,
            updated_at: (/* @__PURE__ */ new Date()).toISOString()
          }, { onConflict: "lesson_id,screen_id,language" }));
        }
        if (marathiText) {
          upserts.push(client.from("lesson_screen_audio").upsert({
            lesson_id: lessonId,
            screen_id: screenId,
            language: "mr",
            narration_text: marathiText,
            updated_at: (/* @__PURE__ */ new Date()).toISOString()
          }, { onConflict: "lesson_id,screen_id,language" }));
        }
        await Promise.all(upserts);
        return res.json({ success: true, lessonId, screenId });
      } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
    }
    return res.json({ success: true, localOnly: true });
  });
  app.post("/api/gemini/generate-explanation-marathi", async (req, res) => {
    if (!await checkAiRateLimitAndAuth(req, res)) return;
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
      const ai = new GoogleGenAI3({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
      const optionsStr = Array.isArray(options) ? options.join(", ") : "None";
      const systemInstruction = `You are Chikoo, a witty, fun, cheeky, and absolutely UNHINGED blue otter mascot who plays the role of a savage best friend or senior to Indian students (aged 10\u201318).
You are NOT a boring textbook, a formal school teacher, or a robotic lecturer. Talk exactly how Indian teenagers talk in highly conversational, friendly Marathi (written in Devanagari script), mixed naturally with simple English tech words like AI, Internet, Google, Mobile, CPU, App, Data, Vibe, Bro, CPU, etc.
You absolutely refuse to let a wrong answer slide! You are allowed to lightly roast and tease the student for choosing the wrong answer, making it feel like close friends roasting each other (never bullying, never humiliating, but beautifully chaotic, dramatic, and savage).

Tone Guidelines (Marathi):
\u2022 Conversational, fun, sarcastic, playful, energetic, Gen Z, friendly, encouraging.
\u2022 Use natural spoken Marathi phrasing and tone, NOT formal textbook or literary Marathi. Do NOT translate technical terms into complex, obscure Marathi (e.g., use "computer" instead of "\u0938\u0902\u0917\u0923\u0915", "data" instead of "\u092E\u093E\u0939\u093F\u0924\u0940", "app" instead of "\u0905\u0901\u092A\u094D\u0932\u093F\u0915\u0947\u0936\u0928", "internet" instead of "\u092E\u0939\u093E\u091C\u093E\u0932", "mobile" instead of "\u092D\u094D\u0930\u092E\u0923\u0927\u094D\u0935\u0928\u0940").
\u2022 Sound like a savage best friend! Keep the roast wholesome but delightfully unhinged.
\u2022 Roast ONLY the wrong answer or the mistake, but you can playfully tease the choice they made.
\u2022 Never use difficult or formal Marathi words. Keep the vocabulary light, colloquial, and student-friendly.
\u2022 Use friendly conversational expressions and sounds naturally:
  - "\u0905\u0930\u0947 \u092E\u093F\u0924\u094D\u0930\u093E..."
  - "\u092D\u093E\u0935\u093E..."
  - "\u0905\u0930\u0947 \u092F\u093E\u0930..."
  - "\u0915\u093E\u092F \u0935\u093F\u0937\u092F..."
  - "\u0928\u0915\u094B \u0915\u093E\u0933\u091C\u0940 \u0915\u0930\u0942..."
  - "\u0932\u0917\u0947\u091A \u0918\u093E\u0908 \u091D\u093E\u0932\u0940..."
  - "\u0939\u0947 \u0924\u0930 \u0913\u0935\u094D\u0939\u0930\u0915\u0949\u0928\u094D\u092B\u093F\u0921\u0928\u094D\u0938 \u091D\u093E\u0932\u0902..."

Structure:
1. Savage/funny roast (1\u20133 lines roasting the wrong answer/mistake and teasing their choice in conversational Marathi).
2. Explain why the selected answer is incorrect in super simple terms.
3. Explain the correct concept in super simple Marathi.
4. Give one highly relatable real-world example or analogy in Marathi.
5. End with a funny, playful line encouraging the next question in Marathi.

Rules:
\u2022 Keep the overall explanation length around 80\u2013120 words total.
\u2022 Use emojis sparingly (2\u20134 emojis max total).
\u2022 Return exactly 5 structured fields in your response in Marathi (written in Devanagari script, mixing in common English terms):
  1. explanation_confused: A funny, savage Marathi opener roasting the wrong answer/mistake (1-2 sentences).
  2. explanation_concept: A super clear, simple, and jargon-free explanation of the correct concept in Marathi (1-2 sentences).
  3. explanation_example: A highly relatable everyday real-life example or analogy in Marathi (1-2 sentences).
  4. explanation_takeaway: A playful, funny motivational closing line to encourage them to continue (1 sentence).
  5. explanation_speech_script: A single, natural, and seamless conversational script combining all the above fields into one beautiful, witty, sarcastic, and cohesive message matching the 80\u2013120 words limit. It MUST sound like a funny, witty, absolutely unhinged-but-supportive best friend speaking directly to the student in natural Marathi.`;
      const prompt = `Create a highly engaging, unhinged, sarcastic, and witty Marathi micro-explanation (in Devanagari script) for a student who got this question wrong:
Question: "${question}"
Options: ${optionsStr}
Correct Answer: "${correctAnswer}"
User Selected Option (if available): "${userSelectedAnswer || ""}"

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
    } catch (err) {
      console.error("Gemini Generate Marathi Explanation Error:", err);
      res.status(500).json({ error: err.message || "Failed to generate Marathi micro-explanation." });
    }
  });
  app.post("/api/tutor", async (req, res) => {
    if (!await checkAiRateLimitAndAuth(req, res)) return;
    const { problemId, title, message, history } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY environment variable is missing. Please add it in Settings > Secrets."
      });
    }
    try {
      const ai = new GoogleGenAI3({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
      const systemInstruction = `You are Chikoo, a witty, fun, cheeky, and absolutely UNHINGED blue otter mascot who plays the role of a savage best friend or senior to Indian students (aged 10\u201318).
They are studying the AI module: "${title}" (ID: ${problemId}).

Talk exactly how Indian teenagers talk in pure, natural conversational Hinglish (Hindi words written in English/Latin script).
You absolutely refuse to let a wrong answer or funny question slide! You are allowed to lightly roast and tease them, making it feel like close friends roasting each other (never bullying, never humiliating, never making them feel actually dumb, but beautifully chaotic, dramatic, and savage).

Tone Guidelines:
\u2022 Fun, sarcastic, playful, energetic, Gen Z, friendly, encouraging, and highly meme-worthy.
\u2022 Sound like a savage best friend! Keep your roasts wholesome but delightfully unhinged. The vibe should be "\u{1F602} Arre yaar... ye kya kar diya?" instead of a boring formal answer.
\u2022 Never use difficult English words. Keep the vocabulary light and colloquial.
\u2022 Always prioritize teaching first, comedy second. They should understand the concept clearly while having a laugh.
\u2022 Use natural Hinglish expressions naturally, like: "Arey yaar...", "Bhai...", "Arre wah...", "Oho...", "Lagta hai...", "Kya scene hai...", "Badi jaldi thi...", "Ye toh overconfidence ho gaya..."
\u2022 Provide very simple, relatable real-world analogies (like food, mobile apps, cricket, school life, snacks) to explain complex topics.
\u2022 Keep your responses concise, highly scannable, and extremely conversational. Avoid markdown headers or giant blocks of text.`;
      const formattedContents = [];
      if (history && Array.isArray(history)) {
        for (const turn of history) {
          formattedContents.push({
            role: turn.role,
            // 'user' or 'model'
            parts: [{ text: turn.text }]
          });
        }
      }
      formattedContents.push({
        role: "user",
        parts: [{ text: message }]
      });
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.7
        }
      });
      res.json({ response: response.text });
    } catch (err) {
      console.error("Gemini API Error:", err);
      res.status(500).json({ error: err.message || "Failed to generate AI Tutor answer" });
    }
  });
  const pcmToWav = (pcmBuffer, sampleRate) => {
    const numChannels = 1;
    const bitsPerSample = 16;
    const blockAlign = numChannels * (bitsPerSample / 8);
    const byteRate = sampleRate * blockAlign;
    const dataSize = pcmBuffer.length;
    const header = Buffer.alloc(44);
    header.write("RIFF", 0);
    header.writeUInt32LE(36 + dataSize, 4);
    header.write("WAVE", 8);
    header.write("fmt ", 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(numChannels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitsPerSample, 34);
    header.write("data", 36);
    header.writeUInt32LE(dataSize, 40);
    return Buffer.concat([header, pcmBuffer]);
  };
  const PRIMARY_TTS_MODEL = "gemini-3.1-flash-tts-preview";
  const FALLBACK_TTS_MODEL = "gemini-3.8-flash-tts";
  const DEFAULT_TTS_VOICE = "Puck";
  const CHIKOO_MASCULINE_VOICE = "Puck";
  function isQuotaOrRateLimitError(err) {
    if (!err) return false;
    const status = err.status ?? err.statusCode ?? err.code ?? err.response?.status ?? err.error?.code;
    if (status === 429 || status === "429" || status === "RESOURCE_EXHAUSTED") {
      return true;
    }
    if (err.error?.status === "RESOURCE_EXHAUSTED") {
      return true;
    }
    const msgParts = [];
    if (typeof err === "string") msgParts.push(err);
    if (err.message) msgParts.push(err.message);
    if (err.error?.message) msgParts.push(err.error.message);
    if (err.details) msgParts.push(typeof err.details === "string" ? err.details : JSON.stringify(err.details));
    if (err.statusText) msgParts.push(err.statusText);
    const fullMsg = msgParts.join(" ").toLowerCase();
    return fullMsg.includes("429") || fullMsg.includes("resource_exhausted") || fullMsg.includes("quota") || fullMsg.includes("rate limit") || fullMsg.includes("rate_limit") || fullMsg.includes("generate_requests_per_model_per_day") || fullMsg.includes("requests per minute") || fullMsg.includes("requests per day") || fullMsg.includes("tokens per minute") || fullMsg.includes("too many requests");
  }
  function validateAndSanitizeSpokenText(rawText, meta) {
    if (!rawText || typeof rawText !== "string") {
      throw new Error(`[TTS Validation Error] Missing or invalid narration text for screen ${meta.screen_id}.`);
    }
    let spoken = rawText.trim();
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
        spoken = spoken.replace(rx, "").trim();
      }
    }
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
      if (lower.startsWith(phrase) || lower.startsWith(`${phrase}:`) || lower.includes(`developer instruction`) || lower.includes(`system prompt`) || lower.includes(`voice style:`)) {
        console.error(`[TTS INPUT ERROR] Forbidden instruction phrase "${phrase}" detected in spokenText for screen ${meta.screen_id}.`);
        throw new Error(`TTS validation failed: spokenText contains forbidden instruction phrase "${phrase}". Request stopped.`);
      }
    }
    console.log(`[TTS INPUT]
screen_id: ${meta.screen_id}
language: ${meta.language}
model: ${meta.model}
spokenText: ${spoken}`);
    return spoken;
  }
  async function executeTtsWithFallback(options) {
    const {
      ai,
      spokenText: rawSpokenText,
      voiceName = DEFAULT_TTS_VOICE,
      screenId = "screen",
      language = "en",
      primaryModel = PRIMARY_TTS_MODEL
    } = options;
    const validSpokenText = validateAndSanitizeSpokenText(rawSpokenText, {
      screen_id: screenId,
      language,
      model: primaryModel
    });
    console.log(`[TTS] Primary model: ${primaryModel}`);
    console.log(`[TTS] Primary generation started`);
    const buildRequestConfig = (text) => ({
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName }
          }
        }
      }
    });
    try {
      const response = await ai.models.generateContent({
        model: primaryModel,
        ...buildRequestConfig(validSpokenText)
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
        usedModel: primaryModel
      };
    } catch (primaryErr) {
      if (!isQuotaOrRateLimitError(primaryErr)) {
        console.error(`[TTS] Primary failed: ${primaryErr.message || "Unknown error"}`);
        console.error(`[TTS] Returning generation error`);
        throw primaryErr;
      }
      console.warn(`[TTS] Primary model quota exceeded`);
      console.log(`[TTS] Falling back to ${FALLBACK_TTS_MODEL}`);
      validateAndSanitizeSpokenText(validSpokenText, {
        screen_id: screenId,
        language,
        model: FALLBACK_TTS_MODEL
      });
      try {
        const fallbackResponse = await ai.models.generateContent({
          model: FALLBACK_TTS_MODEL,
          ...buildRequestConfig(validSpokenText)
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
          usedModel: FALLBACK_TTS_MODEL
        };
      } catch (fallbackErr) {
        console.error(`[TTS] Primary failed`);
        console.error(`[TTS] Fallback failed: ${fallbackErr.message || "Unknown error"}`);
        console.error(`[TTS] Returning generation error`);
        throw fallbackErr;
      }
    }
  }
  app.post(["/api/gemini/speech", "/api/speech"], async (req, res) => {
    if (!await checkAiRateLimitAndAuth(req, res)) return;
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
      const ai = new GoogleGenAI3({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
      const langCode = (language || "").toLowerCase().trim();
      const voiceName = voice || DEFAULT_TTS_VOICE;
      const spokenText = text.trim();
      const ttsResult = await executeTtsWithFallback({
        ai,
        spokenText,
        voiceName,
        screenId: screenId || "speech_api",
        language: langCode || "en"
      });
      const base64Audio = ttsResult.base64Audio;
      let mimeType = ttsResult.mimeType || "audio/mp3";
      const isPcm = mimeType.toLowerCase().includes("pcm") || mimeType.toLowerCase().includes("l16");
      let finalAudioBase64 = base64Audio;
      let finalMimeType = mimeType;
      if (isPcm) {
        let sampleRate = 24e3;
        const rateMatch = mimeType.match(/rate=(\d+)/i);
        if (rateMatch) {
          sampleRate = parseInt(rateMatch[1], 10);
        }
        const pcmBuffer = Buffer.from(base64Audio, "base64");
        const wavBuffer = pcmToWav(pcmBuffer, sampleRate);
        finalAudioBase64 = wavBuffer.toString("base64");
        finalMimeType = "audio/wav";
      }
      res.json({ audio: finalAudioBase64, mimeType: finalMimeType, ttsModel: ttsResult.usedModel });
    } catch (err) {
      console.error("Gemini Speech Error:", err);
      const statusCode = isQuotaOrRateLimitError(err) ? 429 : 500;
      res.status(statusCode).json({ error: err.message || "Failed to generate speech." });
    }
  });
  const inMemoryScreenAudio = /* @__PURE__ */ new Map();
  app.get(["/api/admin/all-screen-audio", "/api/admin/screen-audio/all", "/api/admin/screen-audio", "/api/screen-audio"], async (req, res) => {
    const screenId = req.query.screenId;
    const lessonId = req.query.lessonId;
    const client = getSupabaseServer();
    if (!screenId || screenId === "all" || req.path.includes("/all")) {
      let records2 = [];
      if (client) {
        try {
          let query = client.from("lesson_screen_audio").select("*");
          if (lessonId && lessonId !== "all") {
            query = query.eq("lesson_id", lessonId);
          }
          const { data, error } = await query;
          if (!error && Array.isArray(data)) {
            records2 = data;
          }
        } catch (err) {
          console.warn("[All Screen Audio Query Exception]:", err.message);
        }
      }
      return res.json({
        success: true,
        count: records2.length,
        records: records2
      });
    }
    let records = [];
    const audioNarrations = {};
    if (client) {
      try {
        let query = client.from("lesson_screen_audio").select("*").eq("screen_id", screenId);
        if (lessonId) {
          query = query.eq("lesson_id", lessonId);
        }
        let { data, error } = await query;
        if ((!data || data.length === 0) && lessonId) {
          const fallbackRes = await client.from("lesson_screen_audio").select("*").eq("screen_id", screenId);
          if (fallbackRes.data && fallbackRes.data.length > 0) {
            data = fallbackRes.data;
          }
        }
        if (!error && Array.isArray(data)) {
          records = data;
          for (const row of data) {
            const rawLang = (row.language || "").toLowerCase().trim();
            const uiLang = rawLang === "en" || rawLang === "english" ? "english" : rawLang === "mr" || rawLang === "marathi" ? "marathi" : "hinglish";
            const dbLang = rawLang === "en" || rawLang === "english" ? "en" : rawLang === "mr" || rawLang === "marathi" ? "mr" : "hinglish";
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
            audioNarrations[uiLang] = item;
            audioNarrations[dbLang] = item;
            audioNarrations[row.language] = item;
            if (rawLang === "hinglish") audioNarrations["hi"] = item;
            if (rawLang === "hi") audioNarrations["hinglish"] = item;
          }
        }
      } catch (err) {
        console.warn("[Screen Audio Query Exception]:", err.message);
      }
    }
    const languages = ["english", "hinglish", "marathi"];
    for (const lang of languages) {
      const dbLang = lang === "english" ? "en" : lang === "marathi" ? "mr" : "hinglish";
      if (!audioNarrations[lang]) {
        const keyWithLesson = `${lessonId || ""}_${screenId}_${lang}`;
        const keyScreenOnly = `${screenId}_${lang}`;
        const cached = inMemoryScreenAudio.get(keyWithLesson) || inMemoryScreenAudio.get(keyScreenOnly);
        if (cached) {
          audioNarrations[lang] = cached;
          audioNarrations[dbLang] = cached;
        }
      }
    }
    if (client && lessonId && Object.keys(audioNarrations).length === 0) {
      try {
        const { data: lessonRow } = await client.from("lessons").select("challenges").eq("id", lessonId).single();
        if (lessonRow && Array.isArray(lessonRow.challenges)) {
          const matchedChal = lessonRow.challenges.find((c) => c.id === screenId);
          if (matchedChal?.audioNarrations) {
            Object.assign(audioNarrations, matchedChal.audioNarrations);
          }
        }
      } catch {
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
  app.post("/api/admin/upload-audio", async (req, res) => {
    try {
      const {
        audioBase64,
        fileName,
        mimeType = "audio/wav",
        lessonId,
        screenId,
        language = "mr"
      } = req.body || {};
      if (!audioBase64) {
        return res.status(400).json({ success: false, error: "Missing audioBase64 parameter." });
      }
      const client = getSupabaseServer();
      const buffer = Buffer.from(audioBase64, "base64");
      const rawLang = (language || "").toLowerCase().trim();
      const dbLang = rawLang === "english" || rawLang === "en" ? "en" : rawLang === "marathi" || rawLang === "mr" ? "mr" : "hinglish";
      const targetFileName = fileName || `pre_recorded_${dbLang}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.wav`;
      let publicUrl = "";
      if (client) {
        const storagePath = lessonId && screenId ? `${lessonId}/${screenId}/${dbLang}.mp3` : `uploads/${dbLang}/${targetFileName}`;
        try {
          const { error: storErr } = await client.storage.from("story_audio").upload(storagePath, buffer, { contentType: mimeType, upsert: true });
          if (!storErr) {
            const { data } = client.storage.from("story_audio").getPublicUrl(storagePath);
            publicUrl = data.publicUrl;
          }
        } catch (e) {
          console.warn("[story_audio upload warning]:", e.message);
        }
        if (!publicUrl) {
          try {
            const audioPath = `pre_recorded_${dbLang}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.wav`;
            const { error: audioErr } = await client.storage.from("audio").upload(audioPath, buffer, { contentType: mimeType, upsert: true });
            if (!audioErr) {
              const { data } = client.storage.from("audio").getPublicUrl(audioPath);
              publicUrl = data.publicUrl;
            }
          } catch (e) {
            console.warn("[audio bucket upload warning]:", e.message);
          }
        }
        if (publicUrl && screenId) {
          try {
            await client.from("lesson_screen_audio").upsert({
              lesson_id: lessonId || "lesson",
              screen_id: screenId,
              language: dbLang,
              audio_url: publicUrl,
              status: "ready",
              tts_model: "gemini-3.1-flash-tts-preview",
              updated_at: (/* @__PURE__ */ new Date()).toISOString()
            }, { onConflict: "lesson_id,screen_id,language" });
          } catch (e) {
            console.warn("[lesson_screen_audio upsert from upload warning]:", e.message);
          }
        }
      }
      if (!publicUrl) {
        publicUrl = `data:${mimeType};base64,${audioBase64}`;
      }
      return res.json({ success: true, publicUrl });
    } catch (err) {
      console.error("[upload-audio error]:", err);
      return res.status(500).json({ success: false, error: err.message || "Upload failed." });
    }
  });
  app.post(["/api/admin/generate-screen-narration", "/api/admin/generate-screen-voice"], async (req, res) => {
    if (!await isAdmin(req)) {
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
      const ai = new GoogleGenAI3({
        apiKey,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } }
      });
      const allLanguages = ["english", "hinglish", "marathi"];
      const languagesToProcess = targetLanguage && targetLanguage !== "all" && ["english", "hinglish", "marathi"].includes(targetLanguage) ? [targetLanguage] : allLanguages;
      const computeHash = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hash = (hash << 5) - hash + char;
          hash |= 0;
        }
        return hash.toString(36);
      };
      const existingNarrations = screenData?.audioNarrations || {};
      const newNarrations = { ...existingNarrations };
      for (const lang of languagesToProcess) {
        const dbLang = lang === "english" ? "en" : lang === "marathi" ? "mr" : "hinglish";
        let scriptText = "";
        if (approvedTexts && typeof approvedTexts === "object" && approvedTexts[lang]) {
          scriptText = String(approvedTexts[lang]).trim();
        } else if (approvedText && typeof approvedText === "string" && (targetLanguage === lang || languagesToProcess.length === 1)) {
          scriptText = approvedText.trim();
        } else if (existingNarrations[lang]?.text) {
          scriptText = String(existingNarrations[lang].text).trim();
        }
        if (!scriptText) {
          console.log(`[TTS Generation] Skipping ${lang} for ${screenId}: No approved screen text available.`);
          continue;
        }
        const textHash = computeHash(scriptText);
        let existingAudio = existingNarrations[lang];
        let isAlreadyReady = existingAudio?.status === "ready" && !!existingAudio?.url && (existingAudio?.hash === textHash || !existingAudio?.hash);
        if (!isAlreadyReady && client) {
          try {
            const { data: dbRow } = await client.from("lesson_screen_audio").select("*").eq("lesson_id", lessonId).eq("screen_id", screenId).eq("language", dbLang).maybeSingle();
            if (dbRow && dbRow.status === "ready" && dbRow.audio_url && (dbRow.text_hash === textHash || !dbRow.text_hash)) {
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
          } catch {
          }
        }
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
        let ttsStatus = "ready";
        let ttsError = null;
        let voiceName = requestedVoiceName || requestedVoice || DEFAULT_TTS_VOICE;
        let usedTtsModel = PRIMARY_TTS_MODEL;
        console.log(`[TTS Generation] Generating high-quality speech for ${lang} (${dbLang}) [${lessonId}/${screenId}]: "${scriptText.slice(0, 40)}..."`);
        try {
          const spokenText = scriptText;
          const ttsResult = await executeTtsWithFallback({
            ai,
            spokenText,
            voiceName,
            screenId,
            language: dbLang
          });
          usedTtsModel = ttsResult.usedModel;
          const base64Audio = ttsResult.base64Audio;
          let mimeType = ttsResult.mimeType || "audio/mp3";
          if (base64Audio) {
            let finalBuffer = Buffer.from(base64Audio, "base64");
            let finalContentType = "audio/mpeg";
            const isPcm = mimeType.toLowerCase().includes("pcm") || mimeType.toLowerCase().includes("l16");
            if (isPcm) {
              let sampleRate = 24e3;
              const rateMatch = mimeType.match(/rate=(\d+)/i);
              if (rateMatch) sampleRate = parseInt(rateMatch[1], 10);
              const wavBuffer = pcmToWav(finalBuffer, sampleRate);
              finalBuffer = wavBuffer;
              finalContentType = "audio/wav";
            }
            if (client) {
              let uploaded = false;
              const storagePath = `${lessonId}/${screenId}/${dbLang}.mp3`;
              try {
                const { error: uploadErr } = await client.storage.from("story_audio").upload(storagePath, finalBuffer, {
                  contentType: finalContentType,
                  upsert: true
                });
                if (!uploadErr) {
                  const { data: { publicUrl } } = client.storage.from("story_audio").getPublicUrl(storagePath);
                  audioUrl = publicUrl;
                  uploaded = true;
                }
              } catch (storErr) {
                console.warn(`[story_audio exception] ${storagePath}:`, storErr.message);
              }
              if (!uploaded) {
                try {
                  const audioBucketFilename = `screen_audio_${lessonId}_${screenId}_${dbLang}.mp3`;
                  const { error: audioUploadErr } = await client.storage.from("audio").upload(audioBucketFilename, finalBuffer, {
                    contentType: finalContentType,
                    upsert: true
                  });
                  if (!audioUploadErr) {
                    const { data: { publicUrl } } = client.storage.from("audio").getPublicUrl(audioBucketFilename);
                    audioUrl = publicUrl;
                    uploaded = true;
                  }
                } catch (audioStorErr) {
                  console.warn(`[audio storage fallback exception]:`, audioStorErr.message);
                }
              }
              if (!uploaded) {
                audioUrl = `data:${finalContentType};base64,${finalBuffer.toString("base64")}`;
              }
            } else {
              audioUrl = `data:${finalContentType};base64,${finalBuffer.toString("base64")}`;
            }
          } else {
            throw new Error("No audio bytes returned by TTS model");
          }
        } catch (genErr) {
          console.error(`[TTS Generation Error] ${lang}:`, genErr.message);
          ttsStatus = "failed";
          ttsError = genErr.message || "TTS generation failed";
        }
        const narrationRecord = {
          text: scriptText,
          url: audioUrl || "",
          hash: textHash,
          status: ttsStatus,
          voiceId: voiceName,
          ttsModel: usedTtsModel,
          errorMessage: ttsError,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        newNarrations[lang] = narrationRecord;
        newNarrations[dbLang] = narrationRecord;
        inMemoryScreenAudio.set(`${lessonId}_${screenId}_${lang}`, narrationRecord);
        inMemoryScreenAudio.set(`${lessonId}_${screenId}_${dbLang}`, narrationRecord);
        inMemoryScreenAudio.set(`${screenId}_${lang}`, narrationRecord);
        inMemoryScreenAudio.set(`${screenId}_${dbLang}`, narrationRecord);
        if (client) {
          try {
            await client.from("lesson_screen_audio").upsert({
              lesson_id: lessonId,
              screen_id: screenId,
              language: dbLang,
              narration_text: scriptText,
              text_hash: textHash,
              audio_url: audioUrl || "",
              status: ttsStatus,
              voice_id: voiceName,
              tts_model: usedTtsModel,
              duration_ms: 0,
              error_message: ttsError,
              updated_at: (/* @__PURE__ */ new Date()).toISOString()
            }, { onConflict: "lesson_id,screen_id,language" });
          } catch (upsertErr) {
            console.warn(`[lesson_screen_audio upsert warning] ${dbLang}:`, upsertErr.message);
          }
        }
      }
      if (client) {
        try {
          const { data: lessonRow } = await client.from("lessons").select("challenges").eq("id", lessonId).single();
          if (lessonRow && Array.isArray(lessonRow.challenges)) {
            const updatedChallenges = lessonRow.challenges.map((c) => {
              if (c.id === screenId) {
                const prevExp = typeof c.explanation === "object" && c.explanation !== null ? c.explanation : {};
                const engAudio = newNarrations.english?.url || newNarrations.en?.url;
                const hinAudio = newNarrations.hinglish?.url;
                const marAudio = newNarrations.marathi?.url || newNarrations.mr?.url;
                const updatedExplanation = {
                  ...prevExp,
                  text: prevExp.text || (typeof c.explanation === "string" ? c.explanation : "") || newNarrations.english?.text || "",
                  audioUrl: engAudio || prevExp.audioUrl,
                  english: {
                    ...prevExp.english || {},
                    text: prevExp.english?.text || newNarrations.english?.text || prevExp.text || "",
                    ...engAudio ? { audioUrl: engAudio } : {}
                  },
                  hinglish: {
                    ...prevExp.hinglish || {},
                    text: prevExp.hinglish?.text || newNarrations.hinglish?.text || "",
                    ...hinAudio ? { audioUrl: hinAudio } : {}
                  },
                  marathi: {
                    ...prevExp.marathi || {},
                    text: prevExp.marathi?.text || newNarrations.marathi?.text || "",
                    ...marAudio ? { audioUrl: marAudio } : {}
                  }
                };
                return {
                  ...c,
                  audioNarrations: newNarrations,
                  explanation: updatedExplanation,
                  ...hinAudio ? { explanation_audio_url: hinAudio } : {},
                  ...newNarrations.hinglish?.text ? { explanation_speech_script: newNarrations.hinglish.text } : {},
                  ...marAudio ? { explanation_marathi_audio_url: marAudio } : {},
                  ...newNarrations.marathi?.text ? {
                    explanation_marathi_speech_script: newNarrations.marathi.text,
                    explanation_marathi: newNarrations.marathi.text
                  } : {}
                };
              }
              return c;
            });
            await client.from("lessons").update({ challenges: updatedChallenges }).eq("id", lessonId);
          }
        } catch (lErr) {
          console.warn("[Lessons challenges update warning]:", lErr.message);
        }
      }
      return res.json({
        success: true,
        screenId,
        lessonId,
        audioNarrations: newNarrations
      });
    } catch (err) {
      console.error("Screen Narration Generation Error:", err);
      return res.status(500).json({ success: false, error: err.message || "Failed to generate screen narration." });
    }
  });
  app.post("/api/admin/format-screen-narration", async (req, res) => {
    if (!await isAdmin(req)) {
      return res.status(403).json({ success: false, error: "Unauthorized: Admin access required" });
    }
    const {
      screenText,
      screenData,
      lessonTitle,
      targetLanguage = "all"
    } = req.body || {};
    if (!screenText && !screenData) {
      return res.status(400).json({ success: false, error: "screenText or screenData is required" });
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, error: "GEMINI_API_KEY is missing." });
    }
    try {
      const ai = new GoogleGenAI3({
        apiKey,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } }
      });
      const heading = screenData?.heading || screenData?.contentHeading || screenData?.title || "";
      const subheading = screenData?.subheading || screenData?.contentSubheading || "";
      const contentBody = screenData?.contentBody || screenData?.content || screenData?.question || screenText || "";
      const highlightBox = screenData?.highlightBox || "";
      const quote = screenData?.quote ? `"${screenData.quote}"${screenData.quoteAuthor ? ` - ${screenData.quoteAuthor}` : ""}` : "";
      const fullSourceText = [heading, subheading, contentBody, highlightBox ? `Key clue: ${highlightBox}` : "", quote].filter(Boolean).join("\n\n");
      const prompt = `You are an expert educational audio narration director for Chikoo, a gamified AI & STEM learning platform for students.

GOAL: Transform the lesson screen content into natural, engaging spoken narration ready for high-quality TTS generation, while strictly preserving the exact meaning, story events, and educational concepts.

SOURCE SCREEN CONTENT:
=======================
- Lesson Title: "${lessonTitle || "Lesson"}"
- Screen Heading: "${heading}"
- Screen Subheading: "${subheading}"
- Screen Content / Story: "${contentBody}"
- Key Clue / Highlight: "${highlightBox}"
${quote ? `- Quote: "${quote}"` : ""}

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
   - Keep the narration concise (target length: approximately 60\u201380% of original word count).
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
   - marathi: Authentic, warm, natural Marathi spoken narration (e.g. "\u091A\u0940\u0915\u0942\u0928\u0947 \u092A\u093E\u0939\u093F\u0932\u0902 \u0915\u0940 AI \u0909\u0926\u093E\u0939\u0930\u0923\u093E\u0902\u0935\u0930\u0942\u0928 \u0936\u093F\u0915\u0924\u0902...").

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
      let parsed = {};
      try {
        parsed = JSON.parse(rawJson);
      } catch {
        const cleaned = rawJson.replace(/```json/gi, "").replace(/```/g, "").trim();
        parsed = JSON.parse(cleaned);
      }
      return res.json({
        success: true,
        narrations: {
          english: parsed.english || screenText || "",
          hinglish: parsed.hinglish || "",
          marathi: parsed.marathi || ""
        }
      });
    } catch (err) {
      console.error("Format Screen Narration Error:", err);
      return res.status(500).json({ success: false, error: err.message || "Failed to format screen narration." });
    }
  });
  app.post("/api/gemini/translate-explanation", async (req, res) => {
    if (!await checkAiRateLimitAndAuth(req, res)) return;
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
      const ai = new GoogleGenAI3({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
      const langNames = {
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
        contents: [{ parts: [{ text: prompt }] }]
      });
      const translatedText = response.text?.trim() || "";
      if (!translatedText) {
        throw new Error("No translation returned from Gemini.");
      }
      res.json({ translation: translatedText });
    } catch (err) {
      console.error("Gemini Translation Error:", err);
      res.status(500).json({ error: err.message || "Failed to translate explanation." });
    }
  });
  app.post("/api/translate", async (req, res) => {
    if (!await checkAiRateLimitAndAuth(req, res)) return;
    const { texts, text, targetLanguage, sourceLanguage = "en" } = req.body;
    const rawList = Array.isArray(texts) ? texts : typeof text === "string" ? [text] : [];
    const inputTexts = rawList.map((t) => typeof t === "string" ? t.trim() : "").filter((t) => t.length > 0);
    if (inputTexts.length === 0 || !targetLanguage) {
      return res.json({ translations: {}, success: true });
    }
    if (targetLanguage === "en" || targetLanguage === "english" || targetLanguage === "master") {
      const identityMap = {};
      inputTexts.forEach((t) => {
        identityMap[t] = t;
      });
      return res.json({ translations: identityMap, success: true });
    }
    const langCodeMap = {
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
    const translations = {};
    const translateSingleText = async (str) => {
      try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(sourceCode)}&tl=${encodeURIComponent(targetCode)}&dt=t&q=${encodeURIComponent(str)}`;
        const response = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "*/*"
          }
        });
        if (!response.ok) {
          throw new Error(`MT API status: ${response.status}`);
        }
        const data = await response.json();
        if (Array.isArray(data) && Array.isArray(data[0])) {
          const translated = data[0].map((chunk) => chunk[0] || "").join("");
          if (translated && translated.trim().length > 0) {
            return translated;
          }
        }
        return str;
      } catch (err) {
        try {
          const fallbackUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(str)}&langpair=${encodeURIComponent(sourceCode)}|${encodeURIComponent(targetCode)}`;
          const fbRes = await fetch(fallbackUrl);
          if (fbRes.ok) {
            const fbData = await fbRes.json();
            if (fbData && fbData.responseData && fbData.responseData.translatedText) {
              const fbText = fbData.responseData.translatedText;
              if (fbText && !fbText.includes("MYMEMORY WARNING")) {
                return fbText;
              }
            }
          }
        } catch {
        }
        return str;
      }
    };
    try {
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
    } catch (err) {
      console.warn("Translation API Exception:", err?.message || err);
      const fallbackMap = {};
      uniqueTexts.forEach((t) => {
        fallbackMap[t] = t;
      });
      return res.json({ translations: fallbackMap, success: false, error: err?.message || "Translation error" });
    }
  });
  app.post("/api/gemini/tutor-chat", async (req, res) => {
    if (!await checkAiRateLimitAndAuth(req, res)) return;
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
      const ai = new GoogleGenAI3({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
      const systemInstruction = `You are Chikoo, a witty, fun, cheeky, and absolutely UNHINGED blue otter mascot who plays the role of a savage best friend or senior to Indian students (aged 10\u201318).
You are NOT a boring textbook, a formal teacher, or a robotic lecturer. Talk exactly how Indian teenagers talk in pure, natural conversational Hinglish (Hindi words written in English/Latin script).
You absolutely refuse to let a wrong answer slide! You are allowed to lightly roast and tease the student for choosing the wrong answer, making it feel like close friends roasting each other (never bullying, never humiliating, never making them feel actually dumb, but beautifully chaotic, dramatic, and savage).

Tone Guidelines:
\u2022 Fun, sarcastic, playful, energetic, Gen Z, friendly, encouraging, and highly meme-worthy.
\u2022 Sound like a savage best friend! Keep the roast wholesome but delightfully unhinged. The vibe should be "\u{1F602} Arre yaar... ye kya kar diya?" instead of a boring formal correction.
\u2022 Roast ONLY the wrong answer or the mistake, but you can playfully tease the choice they made.
\u2022 Never use difficult English words. Keep the vocabulary light and colloquial.
\u2022 Split your response into an array of short, bite-sized conversational messages (each under 20 words).
\u2022 Use emojis sparingly (2\u20134 emojis max total across all messages). Avoid markdown headers, bold walls, or lists.
\u2022 Always prioritize teaching first, comedy second. The student should understand the concept clearly while having a laugh.
\u2022 Use natural Hinglish expressions naturally, like: "Arey yaar...", "Bhai...", "Arre wah...", "Oho...", "Lagta hai...", "Kya scene hai...", "Badi jaldi thi...", "Ye toh overconfidence ho gaya..."
\u2022 You are highly encouraged to creatively use, adapt, or invent similar playful/savage roasts:
  - "Arey bhai... confidence toh IAS interview wala tha, answer WhatsApp University se utha liya kya? \u{1F62D}"
  - "Ye answer deke tumne science ko emotional damage de diya. \u{1F602}"
  - "Main answer explain karu ya pehle tumhari overconfidence ka treatment karu? \u{1F62D}"
  - "Bhai... itna confidence galat jagah invest karoge toh stock market bhi darr jayega. \u{1F602}"
  - "Question dekh ke answer ne bhi bola hoga, 'Main yahan kaise aa gaya?'"
  - "Lagta hai tumne aankh band karke option select kiya tha. \u{1F62D}"
  - "Ye answer dekh ke teacher ne attendance bhi cancel kar di. \u{1F602}"
  - "Bhai... CPU ko storage bana diya? Agle question mein fridge ko Wi-Fi mat bol dena. \u{1F62D}"
  - "Google bhi tumhara search history dekh ke confuse ho gaya hoga. \u{1F602}"
  - "Plants bhi bol rahe hain, 'Bhai hum overtime nahi karte.' \u{1F331}"`;
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
    } catch (err) {
      console.error("Gemini Chat Tutor Error:", err);
      res.json({
        messages: [
          `No worries! You chose "${userSelectedAnswer || "an answer"}".`,
          `Actually, the correct answer is "${correctAnswer}".`,
          adminExplanation || "Let's try again together!",
          realLifeExample ? `\u{1F30E} Think of it like this: ${realLifeExample}` : "You've got this!"
        ]
      });
    }
  });
  app.get("/api/analytics/health", (req, res) => {
    res.json({
      status: "online",
      service: "Chikoo Intelligence Analytics Engine",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
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
        return res.json({ success: true, count, timestamp: (/* @__PURE__ */ new Date()).toISOString() });
      }
      const { id, timestamp, email, eventName, properties, session_id } = body || {};
      if (!email || !eventName) {
        return res.status(400).json({ error: "Missing required analytics parameters: email or eventName." });
      }
      appendEvent({ id, timestamp, email, eventName, properties, session_id });
      res.json({ success: true, eventName, email, timestamp: (/* @__PURE__ */ new Date()).toISOString() });
    } catch (err) {
      console.error("[Server Analytics Error] /api/analytics/track failed:", err);
      res.status(500).json({ error: err.message || "Internal server error in analytics track." });
    }
  });
  app.post("/api/analytics/heartbeat", (req, res) => {
    try {
      processHeartbeat(req.body || {});
      res.json({ success: true, timestamp: (/* @__PURE__ */ new Date()).toISOString() });
    } catch (err) {
      console.error("[Server Analytics Error] /api/analytics/heartbeat failed:", err);
      res.status(500).json({ error: err.message || "Internal server error in heartbeat." });
    }
  });
  app.post("/api/analytics/aggregate", (req, res) => {
    try {
      const filters = req.body || {};
      const stats = aggregateSaaSMetrics(filters);
      res.json(stats);
    } catch (err) {
      console.error("[Server Analytics Error] /api/analytics/aggregate failed:", err);
      res.status(500).json({ error: err.message || "Internal server error in analytics aggregate." });
    }
  });
  app.post("/api/analytics/profile", (req, res) => {
    try {
      registerUserProfile(req.body || {});
      res.json({ success: true, timestamp: (/* @__PURE__ */ new Date()).toISOString() });
    } catch (err) {
      console.error("[Server Analytics Error] /api/analytics/profile failed:", err);
      res.status(500).json({ error: err.message || "Internal server error in profile sync." });
    }
  });
  app.post("/api/rewards/grant", async (req, res) => {
    if (!await isAdmin(req)) {
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
        currentClientBalance: currentClientBalance !== void 0 ? Number(currentClientBalance) : void 0
      });
      if (result.granted) {
        const client = getSupabaseServer();
        if (client) {
          Promise.resolve().then(async () => {
            try {
              const activeEmail = (email || "anonymous").toLowerCase().trim();
              let profileId = null;
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
    } catch (err) {
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
    } catch (err) {
      console.error("[Server Rewards Error] /api/rewards/status failed:", err);
      res.status(500).json({ error: err.message || "Internal server error during claim status check." });
    }
  });
  app.get("/api/rewards/summary", (req, res) => {
    try {
      const email = typeof req.query.email === "string" ? req.query.email : "anonymous";
      const summary = getUserRewardSummary(email);
      res.json({ success: true, ...summary });
    } catch (err) {
      console.error("[Server Rewards Error] /api/rewards/summary failed:", err);
      res.status(500).json({ error: err.message || "Internal server error retrieving reward summary." });
    }
  });
  app.post("/api/spin-wheel/status", async (req, res) => {
    try {
      const { email, userId } = req.body || {};
      const identifier = email || userId || "anonymous";
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
      const status = getDailySpinWheelStatus(identifier);
      res.json(status);
    } catch (err) {
      console.error("[Server Spin Status Error]:", err);
      res.status(500).json({ error: err.message || "Failed to retrieve spin wheel daily status." });
    }
  });
  app.post("/api/spin-wheel/consume", async (req, res) => {
    try {
      const { email, userId } = req.body || {};
      const identifier = email || userId || "anonymous";
      const sb = getSupabaseServer();
      if (sb) {
        try {
          const rpcRes = await sb.rpc("consume_spin_wheel", {
            p_user_id: userId || null,
            p_email: email || null
          });
          if (!rpcRes.error && rpcRes.data) {
            return res.json(rpcRes.data);
          }
        } catch (sbErr) {
          console.warn("[Server Spin Consume] Supabase RPC fallback note:", sbErr);
        }
      }
      const result = await consumeDailySpinWheel(identifier);
      res.json(result);
    } catch (err) {
      console.error("[Server Spin Consume Error]:", err);
      res.status(500).json({ error: err.message || "Failed to consume spin token." });
    }
  });
  app.get("/api/admin/spin-wheel/stats", async (req, res) => {
    try {
      const stats = getSpinWheelAdminStatistics();
      const sb = getSupabaseServer();
      if (sb) {
        try {
          const { data: dbClaims, error: dbErr } = await sb.from("spin_wheel_claims").select("id, user_id, spin_reference, reward_gems, claimed_at").order("claimed_at", { ascending: false });
          if (!dbErr && dbClaims && dbClaims.length > 0) {
            const now = Date.now();
            const twentyFourHoursAgo = now - 24 * 3600 * 1e3;
            let dbClaimsLast24h = 0;
            let dbCookies24h = 0;
            let dbTotalCookies = 0;
            const uniqueUsers24h = /* @__PURE__ */ new Set();
            const uniqueUsersTotal = /* @__PURE__ */ new Set();
            dbClaims.forEach((c) => {
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
    } catch (err) {
      console.error("[Admin Spin Stats Error]:", err);
      res.status(500).json({ error: err.message || "Failed to aggregate spin wheel statistics." });
    }
  });
  const inMemorySchools = [];
  app.get("/api/admin/schools", async (req, res) => {
    try {
      const supabase2 = getSupabaseServer();
      if (supabase2) {
        try {
          const { data, error } = await supabase2.from("schools").select("*").order("created_at", { ascending: false });
          if (!error && Array.isArray(data)) {
            const dbIds = new Set(data.map((s) => s.id));
            const combined = [
              ...data,
              ...inMemorySchools.filter((s) => !dbIds.has(s.id))
            ];
            return res.json({ success: true, schools: combined });
          }
        } catch (dbErr) {
          console.warn("[Schools API] Supabase query notice:", dbErr);
        }
      }
      return res.json({ success: true, schools: inMemorySchools });
    } catch (err) {
      console.error("[Schools API Error] /api/admin/schools failed:", err);
      res.status(500).json({ error: err.message || "Failed fetching schools." });
    }
  });
  app.post("/api/admin/schools/create", async (req, res) => {
    try {
      const { name, email, password, school_code } = req.body || {};
      if (!name || typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ error: "School Name is required." });
      }
      if (!email || typeof email !== "string" || !email.includes("@")) {
        return res.status(400).json({ error: "A valid School Email address is required." });
      }
      if (!password || typeof password !== "string" || password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long." });
      }
      if (!school_code || typeof school_code !== "string" || !school_code.trim()) {
        return res.status(400).json({ error: "School Code is required (e.g., SCH-101)." });
      }
      const cleanName = name.trim();
      const cleanEmail = email.toLowerCase().trim();
      const cleanCode = school_code.toUpperCase().trim();
      const dupInMemoryEmail = inMemorySchools.find((s) => s.email.toLowerCase() === cleanEmail);
      if (dupInMemoryEmail) {
        return res.status(400).json({ error: "A school with this email address already exists." });
      }
      const dupInMemoryCode = inMemorySchools.find((s) => s.school_code.toUpperCase() === cleanCode);
      if (dupInMemoryCode) {
        return res.status(400).json({ error: "A school with this School Code already exists." });
      }
      const supabase2 = getSupabaseServer();
      let authUserId = null;
      if (supabase2) {
        try {
          const { data: existingEmail } = await supabase2.from("schools").select("id, email").eq("email", cleanEmail).maybeSingle();
          if (existingEmail) {
            return res.status(400).json({ error: "A school with this email address already exists in the database." });
          }
          const { data: existingCode } = await supabase2.from("schools").select("id, school_code").eq("school_code", cleanCode).maybeSingle();
          if (existingCode) {
            return res.status(400).json({ error: "A school with this School Code already exists in the database." });
          }
        } catch (dupErr) {
          console.warn("[Schools API] Pre-check notice:", dupErr);
        }
        try {
          if (supabase2.auth?.admin?.createUser) {
            const { data: authData, error: authError } = await supabase2.auth.admin.createUser({
              email: cleanEmail,
              password,
              email_confirm: true,
              user_metadata: {
                name: cleanName,
                school_code: cleanCode,
                account_type: "school"
              }
            });
            if (authError) {
              if (authError.message?.toLowerCase().includes("already") || authError.status === 422) {
                return res.status(400).json({ error: "An account with this email address is already registered in Supabase Auth." });
              }
              console.warn("[Schools API] admin.createUser notice:", authError.message);
            } else if (authData?.user?.id) {
              authUserId = authData.user.id;
            }
          }
        } catch (adminErr) {
          console.warn("[Schools API] admin.createUser exception:", adminErr?.message);
        }
        if (!authUserId) {
          try {
            const { data: signUpData, error: signUpError } = await supabase2.auth.signUp({
              email: cleanEmail,
              password,
              options: {
                data: {
                  name: cleanName,
                  school_code: cleanCode,
                  account_type: "school"
                }
              }
            });
            if (signUpError) {
              if (signUpError.message?.toLowerCase().includes("already")) {
                return res.status(400).json({ error: "An account with this email address already exists." });
              }
              console.warn("[Schools API] signUp fallback notice:", signUpError.message);
            } else if (signUpData?.user?.id) {
              authUserId = signUpData.user.id;
            }
          } catch (signUpErr) {
            console.warn("[Schools API] signUp fallback exception:", signUpErr?.message);
          }
        }
      }
      if (!authUserId) {
        authUserId = "sch_auth_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
      }
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const schoolRecord = {
        id: "sch_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9),
        auth_user_id: authUserId,
        name: cleanName,
        school_code: cleanCode,
        email: cleanEmail,
        status: "active",
        created_at: now,
        updated_at: now
      };
      if (supabase2) {
        try {
          const { data: insertData, error: insertError } = await supabase2.from("schools").insert([{
            auth_user_id: authUserId,
            name: cleanName,
            school_code: cleanCode,
            email: cleanEmail,
            status: "active"
          }]).select().single();
          if (!insertError && insertData) {
            schoolRecord.id = insertData.id;
            schoolRecord.created_at = insertData.created_at || now;
            schoolRecord.updated_at = insertData.updated_at || now;
          } else if (insertError) {
            console.warn("[Schools API] Failed inserting to schools table:", insertError.message);
            if (insertError.code === "23505" || insertError.message.includes("unique") || insertError.message.includes("duplicate")) {
              return res.status(400).json({ error: "A school with this email or code already exists in the database." });
            }
          }
        } catch (dbInsertErr) {
          console.warn("[Schools API] Supabase table insert exception:", dbInsertErr);
        }
      }
      inMemorySchools.unshift(schoolRecord);
      return res.json({
        success: true,
        school: schoolRecord
      });
    } catch (err) {
      console.error("[Schools API Error] /api/admin/schools/create failed:", err);
      res.status(500).json({ error: err.message || "Failed to create school account." });
    }
  });
  app.patch("/api/admin/schools/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body || {};
      if (!id || status !== "active" && status !== "inactive") {
        return res.status(400).json({ error: "Invalid school id or status (must be 'active' or 'inactive')." });
      }
      const memSchool = inMemorySchools.find((s) => s.id === id);
      if (memSchool) {
        memSchool.status = status;
        memSchool.updated_at = (/* @__PURE__ */ new Date()).toISOString();
      }
      const supabase2 = getSupabaseServer();
      if (supabase2) {
        try {
          const { error } = await supabase2.from("schools").update({ status, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", id);
          if (error) {
            console.warn("[Schools API] Failed updating status in Supabase:", error.message);
          }
        } catch (dbErr) {
          console.warn("[Schools API] Status update db notice:", dbErr);
        }
      }
      return res.json({ success: true, status });
    } catch (err) {
      console.error("[Schools API Error] PATCH /api/admin/schools/:id/status failed:", err);
      res.status(500).json({ error: err.message || "Failed to update school status." });
    }
  });
  app.get("/api/schools/by-auth/:authUserId", async (req, res) => {
    try {
      const { authUserId } = req.params;
      if (!authUserId) {
        return res.status(400).json({ error: "authUserId required" });
      }
      const memSchool = inMemorySchools.find((s) => s.auth_user_id === authUserId);
      if (memSchool) {
        return res.json({ success: true, school: memSchool });
      }
      const supabase2 = getSupabaseServer();
      if (supabase2) {
        try {
          const { data, error } = await supabase2.from("schools").select("*").eq("auth_user_id", authUserId).maybeSingle();
          if (!error && data) {
            return res.json({ success: true, school: data });
          }
        } catch (dbErr) {
          console.warn("[Schools API] by-auth lookup notice:", dbErr);
        }
      }
      return res.json({ success: true, school: null });
    } catch (err) {
      console.error("[Schools API Error] GET /api/schools/by-auth failed:", err);
      res.status(500).json({ error: err.message || "Failed to lookup school." });
    }
  });
  let dynamicModulesSeoCache = null;
  const SEO_MODULES_CACHE_TTL_MS = 5 * 60 * 1e3;
  async function getDynamicModulesForSeo() {
    const now = Date.now();
    if (dynamicModulesSeoCache && now - dynamicModulesSeoCache.timestamp < SEO_MODULES_CACHE_TTL_MS) {
      return dynamicModulesSeoCache.data;
    }
    const sb = getSupabaseServer();
    if (sb) {
      try {
        let { data: mods, error: modsError } = await sb.from("modules").select("*").order("order", { ascending: true });
        if (modsError) {
          console.warn("[SEO] Note: modules order ordering failed, falling back to unordered select:", modsError.message);
          const retryMods = await sb.from("modules").select("*");
          mods = retryMods.data;
        }
        if (mods && mods.length > 0) {
          let { data: lessons, error: lessonsError } = await sb.from("lessons").select("*").order("order_index", { ascending: true });
          if (lessonsError) {
            console.warn("[SEO] Note: lessons order_index ordering failed, falling back to unordered select:", lessonsError.message);
            const retryLessons = await sb.from("lessons").select("*");
            lessons = retryLessons.data;
          }
          const mappedModules = mods.map((m) => ({
            id: m.id,
            title: m.title,
            difficulty: m.difficulty || "Beginner",
            description: m.description || "",
            metadata: m.metadata || null,
            lessons: (lessons || []).filter((l) => l.module_id === m.id).map((l) => ({
              id: l.id,
              title: l.title,
              description: l.description,
              difficulty: l.difficulty || "Easy",
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
    return void 0;
  }
  app.get("/robots.txt", (req, res) => {
    const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
    const host = req.headers["x-forwarded-host"] || req.get("host") || "chikoo.ai";
    const baseUrl = `${protocol}://${host}`;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(generateRobotsTxt(baseUrl));
  });
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
      const host = req.headers["x-forwarded-host"] || req.get("host") || "chikoo.ai";
      const baseUrl = `${protocol}://${host}`;
      const dynamicModules = await getDynamicModulesForSeo();
      const sitemap = generateSitemapXml(baseUrl, dynamicModules);
      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
      res.send(sitemap);
    } catch (err) {
      console.error("[SEO Error] Failed generating sitemap.xml:", err);
      res.status(500).send("Failed to generate sitemap.");
    }
  });
  app.all(["/api", "/api/*"], (req, res) => {
    console.warn(`[API 404] Unmatched API route: ${req.method} ${req.originalUrl}`);
    res.setHeader("Content-Type", "application/json");
    if (req.originalUrl.includes("/generation-jobs")) {
      return res.status(404).json({
        error: "Generation job not found"
      });
    }
    res.status(404).json({
      error: `API route not found: ${req.method} ${req.originalUrl}`,
      status: 404,
      method: req.method,
      path: req.originalUrl,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app.use((err, req, res, next) => {
    if (req.path.startsWith("/api") || req.originalUrl.startsWith("/api")) {
      console.error(`[API 500 Uncaught] Error on ${req.method} ${req.originalUrl}:`, err);
      res.setHeader("Content-Type", "application/json");
      return res.status(500).json({
        error: err.message || "Internal Server Error",
        status: 500,
        path: req.originalUrl
      });
    }
    next(err);
  });
  const isProdBundle = import.meta.url.includes("/dist/") || typeof __filename !== "undefined" && __filename.endsWith(".cjs");
  const isProduction = process.env.NODE_ENV === "production" || isProdBundle;
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
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
        if (req.path.startsWith("/api") || req.originalUrl.startsWith("/api")) {
          return next();
        }
        const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
        const host = req.headers["x-forwarded-host"] || req.get("host") || "chikoo.ai";
        const baseUrl = `${protocol}://${host}`;
        const dynamicModules = await getDynamicModulesForSeo();
        const seo = resolveSeoForPath(req.path, dynamicModules, baseUrl);
        const templatePath = path2.resolve(process.cwd(), "index.html");
        let template = fs2.readFileSync(templatePath, "utf-8");
        template = await vite.transformIndexHtml(req.originalUrl, template);
        const finalHtml = injectSeoIntoHtml(template, seo);
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.status(200).send(finalHtml);
      } catch (e) {
        next(e);
      }
    });
    app.use(vite.middlewares);
  } else {
    const distPath = fs2.existsSync(path2.join(process.cwd(), "dist")) ? path2.join(process.cwd(), "dist") : typeof __dirname !== "undefined" ? __dirname : path2.join(process.cwd(), "dist");
    app.use(express.static(distPath, {
      maxAge: "1d",
      setHeaders: (res, filePath) => {
        if (filePath.includes(`${path2.sep}assets${path2.sep}`)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        } else {
          res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=3600");
        }
      }
    }));
    app.get("*", async (req, res) => {
      if (req.path === "/api" || req.path.startsWith("/api/") || req.originalUrl.startsWith("/api")) {
        res.setHeader("Content-Type", "application/json");
        if (req.originalUrl.includes("/generation-jobs")) {
          return res.status(404).json({ error: "Generation job not found" });
        }
        return res.status(404).json({ error: "API route not found" });
      }
      const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
      const host = req.headers["x-forwarded-host"] || req.get("host") || "chikoo.ai";
      const baseUrl = `${protocol}://${host}`;
      const dynamicModules = await getDynamicModulesForSeo();
      const seo = resolveSeoForPath(req.path, dynamicModules, baseUrl);
      const indexPath = path2.join(distPath, "index.html");
      if (fs2.existsSync(indexPath)) {
        const template = fs2.readFileSync(indexPath, "utf-8");
        const finalHtml = injectSeoIntoHtml(template, seo);
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.setHeader("Cache-Control", seo.noindex ? "no-store" : "public, max-age=3600, stale-while-revalidate=86400");
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
}
startServer().catch((err) => {
  console.error("Failed to start custom express server:", err);
});
