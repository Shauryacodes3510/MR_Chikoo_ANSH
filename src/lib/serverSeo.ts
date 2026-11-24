import { 
  CHIKOO_PLATFORM_SEO, 
  SEO_FEATURES, 
  SEO_TOPICS, 
  getAllSeoUnits, 
  getSeoUnitBySlug, 
  getSeoLesson, 
  getSeoFeatureBySlug, 
  getSeoTopicBySlug,
  generatePlatformSchema,
  generateCourseSchema,
  generateLessonSchema,
  generateFeatureSchema,
  generateArticleSchema,
  generateBreadcrumbSchema,
  generateFaqSchema,
  generateSitemapXml,
  generateRobotsTxt,
  SeoUnit,
  SeoLesson,
  SeoFeature,
  SeoTopicArticle
} from './seoRegistry';
import { Module } from './curriculumTypes';

export interface SeoRenderResult {
  title: string;
  description: string;
  canonicalUrl: string;
  keywords: string[];
  ogType: string;
  ogImage: string;
  schemaJson: object;
  prerenderedHtml: string;
  noindex?: boolean;
}

export function resolveSeoForPath(pathStr: string, dynamicModules?: Module[], baseUrl: string = CHIKOO_PLATFORM_SEO.domain): SeoRenderResult {
  const cleanPath = pathStr.toLowerCase().split('?')[0].replace(/\/+$/, '') || '/';
  const defaultOgImage = `${baseUrl}/avatar.webp`;

  // Private routes -> noindex
  if (
    cleanPath.startsWith('/admin') || 
    cleanPath.startsWith('/school-admin') || 
    cleanPath.startsWith('/student-analytics') || 
    cleanPath.startsWith('/user-management') ||
    cleanPath.startsWith('/api')
  ) {
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

  // Privacy Policy
  if (cleanPath === '/privacy-policy') {
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

  // Account Deletion
  if (cleanPath === '/delete-account') {
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

  // 1. What is Chikoo
  if (cleanPath === '/what-is-chikoo' || cleanPath === '/about') {
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
            ${SEO_FEATURES.map(f => `
              <div class="p-4 border rounded-xl">
                <h3 class="font-bold text-lg"><a href="${f.canonicalPath}">${f.name}</a></h3>
                <p class="text-sm text-slate-300">${f.description}</p>
              </div>
            `).join('')}
          </div>
        </section>

        <nav class="border-t pt-8">
          <a href="/units" class="font-bold text-cyan-400 mr-4">Browse All AI Units →</a>
          <a href="/features" class="font-bold text-cyan-400 mr-4">Platform Features →</a>
          <a href="/learn" class="font-bold text-cyan-400">AI Knowledge Guides →</a>
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

  // 2. Units Directory
  if (cleanPath === '/units') {
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
              <span class="text-xs font-bold text-cyan-400">Unit ${i + 1} • ${u.difficulty}</span>
              <h2 class="text-2xl font-bold mt-1 mb-2"><a href="${u.canonicalPath}">${u.cleanTitle}</a></h2>
              <p class="text-slate-300 mb-4">${u.description}</p>
              <h3 class="text-sm font-bold uppercase mb-2">Lessons:</h3>
              <ul class="list-disc pl-6 space-y-1 text-sm text-slate-300">
                ${u.lessons.map(l => `
                  <li><a href="${l.canonicalPath}" class="text-cyan-400 font-medium">${l.cleanTitle}</a> — ${l.description}</li>
                `).join('')}
              </ul>
            </article>
          `).join('')}
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

  // 3. Unit Detail or Lesson Detail
  if (cleanPath.startsWith('/units/')) {
    const parts = cleanPath.split('/').filter(Boolean);
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
              <span class="text-xs font-bold text-cyan-400 uppercase">AI Learning Unit • ${unit.difficulty}</span>
              <h1 class="text-4xl font-black mt-2 mb-4">${unit.cleanTitle}</h1>
              <p class="text-lg text-slate-300">${unit.description}</p>
            </header>

            <section class="mb-12">
              <h2 class="text-2xl font-bold mb-6">Lessons in this Unit</h2>
              <div class="space-y-4">
                ${unit.lessons.map((l, idx) => `
                  <div class="p-4 border rounded-xl">
                    <span class="text-xs text-slate-400">Node ${idx + 1} • +${l.xpReward} XP</span>
                    <h3 class="text-xl font-bold text-white mt-1"><a href="${l.canonicalPath}">${l.cleanTitle}</a></h3>
                    <p class="text-sm text-slate-300 mt-1">${l.description}</p>
                  </div>
                `).join('')}
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
    } else if (parts.length === 4 && parts[2] === 'lessons') {
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
                ${lesson.keyTakeaways.map(t => `<li>${t}</li>`).join('')}
              </ul>
            </section>

            ${lesson.sampleQuestions.length > 0 ? `
              <section class="mb-10">
                <h2 class="text-2xl font-bold mb-4">Sample Questions & Concepts</h2>
                <div class="space-y-4">
                  ${lesson.sampleQuestions.map((q, qIdx) => `
                    <div class="p-4 border rounded-xl">
                      <p class="font-bold text-white mb-2">Q${qIdx + 1}: ${q.question}</p>
                      ${q.explanation ? `<p class="text-xs text-slate-300"><strong>Hint:</strong> ${q.explanation}</p>` : ''}
                    </div>
                  `).join('')}
                </div>
              </section>
            ` : ''}

            <div class="border-t pt-6">
              <a href="${unit.canonicalPath}" class="font-bold text-cyan-400">← Back to ${unit.cleanTitle}</a>
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

  // 4. Features Directory or Detail
  if (cleanPath === '/features') {
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
          ${SEO_FEATURES.map(f => `
            <article class="p-6 border rounded-2xl">
              <span class="text-xs font-bold text-cyan-400">${f.badge}</span>
              <h2 class="text-2xl font-bold mt-1 mb-2"><a href="${f.canonicalPath}">${f.name}</a></h2>
              <p class="text-sm text-slate-300 mb-4">${f.description}</p>
              <ul class="list-disc pl-6 space-y-1 text-xs text-slate-400">
                ${f.highlights.map(h => `<li>${h}</li>`).join('')}
              </ul>
            </article>
          `).join('')}
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

  if (cleanPath.startsWith('/features/')) {
    const featureSlug = cleanPath.split('/')[2];
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
              ${feature.highlights.map(h => `<li>${h}</li>`).join('')}
            </ul>
          </section>

          <section class="mb-10">
            <h2 class="text-2xl font-bold mb-4">How It Works</h2>
            <ol class="list-decimal pl-6 space-y-2 text-slate-300">
              ${feature.howItWorks.map(s => `<li>${s}</li>`).join('')}
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

  // 5. Learn Directory or Article Detail
  if (cleanPath === '/learn') {
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
          ${SEO_TOPICS.map(t => `
            <article class="p-6 border rounded-2xl">
              <span class="text-xs font-bold text-cyan-400">${t.category} • ${t.readingTime}</span>
              <h2 class="text-2xl font-bold mt-1 mb-2"><a href="${t.canonicalPath}">${t.title}</a></h2>
              <p class="text-sm text-slate-300 mb-4">${t.summary}</p>
              <a href="${t.canonicalPath}" class="text-xs font-bold text-cyan-400">Read Full Guide →</a>
            </article>
          `).join('')}
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

  if (cleanPath.startsWith('/learn/')) {
    const topicSlug = cleanPath.split('/')[2];
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
            <span class="text-xs font-bold text-cyan-400 uppercase">${article.category} • ${article.readingTime}</span>
            <h1 class="text-4xl font-black mt-2 mb-4">${article.title}</h1>
            <p class="text-lg text-slate-300">${article.summary}</p>
          </header>

          <section class="mb-10">
            <h2 class="text-2xl font-bold mb-4">Key Takeaways</h2>
            <ul class="list-disc pl-6 space-y-2 text-slate-300">
              ${article.keyTakeaways.map(k => `<li>${k}</li>`).join('')}
            </ul>
          </section>

          <section class="space-y-8 mb-12">
            ${article.sections.map(s => `
              <div>
                <h2 class="text-2xl font-bold mb-3">${s.heading}</h2>
                <p class="text-slate-300 leading-relaxed">${s.content}</p>
              </div>
            `).join('')}
          </section>

          ${article.faqs.length > 0 ? `
            <section class="mb-10">
              <h2 class="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
              <div class="space-y-4">
                ${article.faqs.map(f => `
                  <div class="p-4 border rounded-xl">
                    <h3 class="font-bold text-white mb-1">${f.question}</h3>
                    <p class="text-sm text-slate-300">${f.answer}</p>
                  </div>
                `).join('')}
              </div>
            </section>
          ` : ''}
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

  // Default Home App
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

export function injectSeoIntoHtml(htmlTemplate: string, seo: SeoRenderResult): string {
  let updated = htmlTemplate;

  // Replace title
  updated = updated.replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(seo.title)}</title>`);

  // Build meta tags block
  const robotsMeta = seo.noindex 
    ? `<meta name="robots" content="noindex, nofollow" />`
    : `<meta name="robots" content="index, follow" />`;

  const metaBlock = `
    ${robotsMeta}
    <meta name="description" content="${escapeHtml(seo.description)}" />
    <meta name="keywords" content="${escapeHtml(seo.keywords.join(', '))}" />
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

  // Inject into <head>
  if (updated.includes('</head>')) {
    updated = updated.replace('</head>', `${metaBlock}\n</head>`);
  } else {
    updated = `${metaBlock}\n${updated}`;
  }

  // Pre-render content inside #root if it's currently empty
  if (seo.prerenderedHtml && updated.includes('<div id="root"></div>')) {
    updated = updated.replace('<div id="root"></div>', `<div id="root">${seo.prerenderedHtml}</div>`);
  }

  return updated;
}

function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
