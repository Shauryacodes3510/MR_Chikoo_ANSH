/**
 * Benchmark Suite: 20+ Chikoo Wrong-Answer Explanations
 * Evaluates latency, TTFB, TTS time, Supabase upload time, DB write time, and E2E duration
 * across English, Hinglish, and Marathi.
 */

interface BenchmarkItem {
  id: string;
  topic: string;
  language: 'english' | 'hinglish' | 'marathi';
  text: string;
}

const BENCHMARK_DATASET: BenchmarkItem[] = [
  // English (1-7)
  {
    id: "bench_en_1",
    topic: "Planets & Space",
    language: "english",
    text: "Mars is called the Red Planet because iron minerals on its surface react with oxygen. This creates a reddish rust-like appearance all over the planet. That is why it looks distinctly orange and red in the night sky!"
  },
  {
    id: "bench_en_2",
    topic: "Photosynthesis",
    language: "english",
    text: "Plants make food through photosynthesis using sunlight, water, and carbon dioxide. The chlorophyll in their leaves absorbs the sunlight and turns it into energy. Oxygen is released as a natural byproduct for us to breathe!"
  },
  {
    id: "bench_en_3",
    topic: "Gravity & Physics",
    language: "english",
    text: "Gravity is an invisible pulling force that attracts objects toward each other. The more mass an object has, the stronger its gravitational pull. That is why the Earth keeps the Moon in orbit and keeps our feet on the ground!"
  },
  {
    id: "bench_en_4",
    topic: "Neural Networks & AI",
    language: "english",
    text: "Neural networks are AI computing systems inspired by the human brain. They contain interconnected layers of artificial neurons that detect patterns in data. Through many training cycles, they learn to recognize images and speech accurately!"
  },
  {
    id: "bench_en_5",
    topic: "Water Cycle",
    language: "english",
    text: "When water heats up from the Sun, it evaporates and rises as invisible vapor into the air. High above, it cools down and condenses to form fluffy clouds. When those droplets get too heavy, they fall back down as refreshing rain!"
  },
  {
    id: "bench_en_6",
    topic: "Computer Binary Code",
    language: "english",
    text: "Computers use binary code made of ones and zeros because their transistors act like light switches. A one means electricity is flowing, and a zero means it is blocked. By combining billions of these rapid switches, computers can run games and complex apps!"
  },
  {
    id: "bench_en_7",
    topic: "Renewable Energy",
    language: "english",
    text: "Solar panels convert light from the Sun directly into clean electrical energy. Inside each panel, photovoltaic cells excite electrons when sunlight hits them. This creates a continuous electric current without generating pollution or greenhouse gases!"
  },

  // Hinglish (8-14)
  {
    id: "bench_hi_8",
    topic: "Solar System (Hinglish)",
    language: "hinglish",
    text: "Mars ko Red Planet isliye kaha jata hai kyunki uski mitti mein iron oxygen ke saath react karta hai. Is wajah se wahan rust ban jata hai aur poora planet red dikhta hai. Isiliye telescope mein Mars ek glowing red star jaisa chamakta hai!"
  },
  {
    id: "bench_hi_9",
    topic: "Artificial Intelligence (Hinglish)",
    language: "hinglish",
    text: "AI koi jaadu nahi hai, balki patterns ko pehchanne ka ek smart tareeqa hai. Jab hum model ko bohot saare examples dikhate hain, toh wo unse seekh leta hai. Fir naye questions aane par wo sahi prediction de paata hai!"
  },
  {
    id: "bench_hi_10",
    topic: "Electricity & Circuits (Hinglish)",
    language: "hinglish",
    text: "Current tabhi flow karta hai jab circuit poora closed aur connected ho. Agar beech mein wire break ho jaye, toh electrons aage nahi badh paate. Isiliye switch on karte hi light jalti hai aur off karte hi band ho jaati hai!"
  },
  {
    id: "bench_hi_11",
    topic: "Sound Waves (Hinglish)",
    language: "hinglish",
    text: "Awaaz vibrations ke roop mein travel karti hai jise medium ki zaroorat hoti hai. Space mein bilkul vacuum hota hai jahan koi hawa nahi hoti. Isiliye space ke andar koi bhi sound travel nahi kar sakti chahe kitna bada dhamaka ho!"
  },
  {
    id: "bench_hi_12",
    topic: "Machine Learning (Hinglish)",
    language: "hinglish",
    text: "Supervised learning mein hum AI ko questions ke saath answers bhi provide karte hain. AI dono ke beech ka correlation dhoondta hai. Jab wo train ho jata hai, tab bina answer ke bhi accurate result nikaal sakta hai!"
  },
  {
    id: "bench_hi_13",
    topic: "Rainbow Science (Hinglish)",
    language: "hinglish",
    text: "Rainbow tab banta hai jab sooraj ki kiran paani ki boondo se takra kar bend hoti hai. Ye boondein ek tiny prism ki tarah act karti hain aur white light ko saat alag alag colours mein divide kar deti hain. Tab humein aasmaan mein pyara indradhanush dikhta hai!"
  },
  {
    id: "bench_hi_14",
    topic: "Internet & Networking (Hinglish)",
    language: "hinglish",
    text: "Internet par data chhote chhote data packets mein divide hokar travel karta hai. Routers in packets ko sabse fast raste se destination tak pahunchate hain. Wahan pahunch kar ye saare packets wapas jud kar video ya photo ban jaate hain!"
  },

  // Marathi (15-21)
  {
    id: "bench_mr_15",
    topic: "Sun & Day/Night (Marathi)",
    language: "marathi",
    text: "सूर्य एकाच जागी स्थिर असतो, पण आपली पृथ्वी स्वतःभोवती फिरत राहते. पृथ्वीचा जो भाग सूर्यासमोर येतो तिथे दिवस होतो आणि पाठीमागच्या भागावर अंधार पडून रात्र होते. या २४ तासांच्या फिरण्याला परिवलन म्हणतात!"
  },
  {
    id: "bench_mr_16",
    topic: "Photosynthesis (Marathi)",
    language: "marathi",
    text: "झाडे सूर्यप्रकाश, पाणी आणि हवेतील कार्बन डायऑक्साइड वापरून स्वतःचे अन्न तयार करतात. त्यांच्या पानात असलेले हरितद्रव्य सूर्यप्रकाश शोषून घेते. या प्रक्रियेमुळे आपल्याला श्वास घेण्यासाठी शुद्ध ऑक्सिजन मिळतो!"
  },
  {
    id: "bench_mr_17",
    topic: "Gravity (Marathi)",
    language: "marathi",
    text: "गुरुत्वाकर्षण ही एक अदृश्य शक्ती आहे जी प्रत्येक वस्तूला पृथ्वीच्या केंद्राकडे खेचून घेते. झाडावरून पडलेले फळ नेहमी खाली जमिनीवरच येते. याच शक्तीमुळे आपण सर्वजण जमिनीवर सुरक्षित चालू शकतो!"
  },
  {
    id: "bench_mr_18",
    topic: "Magnets (Marathi)",
    language: "marathi",
    text: "चुंबकाला उत्तर आणि दक्षिण असे दोन मुख्य ध्रुव असतात. विरुद्ध ध्रुव एकमेकांना आकर्षून घेतात, तर समान ध्रुव एकमेकांना दूर ढकलतात. चुंबक नेहमी लोखंड आणि निकेल सारख्या धातूंना आपल्याकडे वेगाने खेचून घेतो!"
  },
  {
    id: "bench_mr_19",
    topic: "Human Heart (Marathi)",
    language: "marathi",
    text: "आपले हृदय शरीरातील सर्वात शक्तिशाली स्नायू आहे जो दिवसरात्र सतत धडधडत राहतो. ते शुद्ध रक्त संपूर्ण शरीराकडे पोहोचवते आणि अशुद्ध रक्त फुफ्फुसांकडे स्वच्छ करण्यासाठी पाठवते. यामुळे आपल्या शरीरातील प्रत्येक पेशीला सतत ऊर्जा मिळते!"
  },
  {
    id: "bench_mr_20",
    topic: "Artificial Intelligence (Marathi)",
    language: "marathi",
    text: "कृत्रिम बुद्धिमत्ता म्हणजे मानवी मेंदूप्रमाणे विचार करणारी आणि निर्णय घेणारी संगणक प्रणाली. लाखो उदाहरणे पाहून AI नमुने ओळखायला शिकते. यामुळेच आज मोबाईल आपल्या आवाजाची भाषा सहज समजून घेतो!"
  },
  {
    id: "bench_mr_21",
    topic: "Rain Formation (Marathi)",
    language: "marathi",
    text: "उन्हामुळे नदी आणि समुद्राच्या पाण्याचे बाष्पीभवन होऊन वाफ आकाशात उंच जाते. थंड हवेमुळे या वाफेचे ढग तयार होतात. ढगांमधील पाण्याचे थेंब जड झाले की ते पावसाच्या रूपाने जमिनीवर आनंदाने कोसळतात!"
  }
];

interface RunMetric {
  id: string;
  topic: string;
  language: string;
  chars: number;
  ttfbMs: number;
  ttsDurationMs: number;
  audioSizeBytes: number;
  audioDurationSec: number;
  supabaseUploadMs: number;
  dbWriteMs: number;
  totalE2eMs: number;
  targetMet: boolean;
  status: 'SUCCESS' | 'FAILED';
  error?: string;
}

async function runBenchmark() {
  console.log("================================================================================");
  console.log("       CHIKOO AI EXPLANATION AUDIO GENERATION BENCHMARK SUITE");
  console.log(`       Target: <= 10.0s | Model: gemini-3.1-flash-tts-preview | Voice: Puck`);
  console.log(`       Total Test Explanations: ${BENCHMARK_DATASET.length} (7 EN, 7 Hinglish, 7 Marathi)`);
  console.log("================================================================================\n");

  const results: RunMetric[] = [];

  for (let i = 0; i < BENCHMARK_DATASET.length; i++) {
    const item = BENCHMARK_DATASET[i];
    const num = i + 1;
    process.stdout.write(`[${num}/${BENCHMARK_DATASET.length}] Testing ${item.id} (${item.language.toUpperCase()} - "${item.topic}")... `);

    const tStart = performance.now();
    try {
      const response = await fetch("http://localhost:3000/api/admin/generate-screen-narration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: "benchmark_evaluation_lesson",
          screenId: item.id,
          targetLanguage: item.language,
          approvedText: item.text,
          approvedTexts: { [item.language]: item.text },
          voiceName: "Puck",
          forceRegenerate: true
        })
      });

      const data = await response.json();
      const tEnd = performance.now();
      const totalWallMs = Math.round(tEnd - tStart);

      if (!response.ok || !data.success) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      const metrics = data.performanceMetrics?.[item.language] || {};
      const ttfb = metrics.ttfbMs || 0;
      const ttsMs = metrics.ttsDurationMs || 0;
      const uploadMs = metrics.supabaseUploadMs || 0;
      const dbMs = metrics.dbWriteMs || 0;
      const audioBytes = metrics.audioSizeBytes || 0;
      const audioDuration = metrics.audioDurationSec || 0;
      const e2e = data.totalReqMs || totalWallMs;
      const targetMet = e2e <= 10000;

      results.push({
        id: item.id,
        topic: item.topic,
        language: item.language,
        chars: item.text.length,
        ttfbMs: ttfb,
        ttsDurationMs: ttsMs,
        audioSizeBytes: audioBytes,
        audioDurationSec: audioDuration,
        supabaseUploadMs: uploadMs,
        dbWriteMs: dbMs,
        totalE2eMs: e2e,
        targetMet,
        status: 'SUCCESS'
      });

      console.log(`DONE in ${(e2e / 1000).toFixed(2)}s | TTFB: ${ttfb}ms | TTS: ${(ttsMs / 1000).toFixed(2)}s | Upload: ${(uploadMs / 1000).toFixed(2)}s | Audio: ${audioDuration}s | Met: ${targetMet ? 'YES' : 'NO'}`);
    } catch (err: any) {
      const tEnd = performance.now();
      results.push({
        id: item.id,
        topic: item.topic,
        language: item.language,
        chars: item.text.length,
        ttfbMs: 0,
        ttsDurationMs: 0,
        audioSizeBytes: 0,
        audioDurationSec: 0,
        supabaseUploadMs: 0,
        dbWriteMs: 0,
        totalE2eMs: Math.round(tEnd - tStart),
        targetMet: false,
        status: 'FAILED',
        error: err.message
      });
      console.log(`FAILED (${err.message})`);
    }

    // Small courteous pause to keep API flow steady
    await new Promise(r => setTimeout(r, 600));
  }

  // Statistical calculations
  const successfulRuns = results.filter(r => r.status === 'SUCCESS');
  const e2eTimes = successfulRuns.map(r => r.totalE2eMs).sort((a, b) => a - b);
  const ttsTimes = successfulRuns.map(r => r.ttsDurationMs).sort((a, b) => a - b);
  const ttfbTimes = successfulRuns.map(r => r.ttfbMs).sort((a, b) => a - b);
  const uploadTimes = successfulRuns.map(r => r.supabaseUploadMs).sort((a, b) => a - b);
  const dbTimes = successfulRuns.map(r => r.dbWriteMs).sort((a, b) => a - b);

  const getPercentile = (arr: number[], p: number) => {
    if (arr.length === 0) return 0;
    const idx = Math.min(arr.length - 1, Math.floor((p / 100) * arr.length));
    return arr[idx];
  };

  const median = (arr: number[]) => getPercentile(arr, 50);
  const p95 = (arr: number[]) => getPercentile(arr, 95);
  const mean = (arr: number[]) => arr.length ? Math.round(arr.reduce((s, x) => s + x, 0) / arr.length) : 0;

  console.log("\n================================================================================");
  console.log("                        DETAILED BENCHMARK RESULTS TABLE");
  console.log("================================================================================");
  console.log(" ID         | LANG    | CHARS | TTFB   | TTS DURATION | STORAGE UP | DB WRITE | TOTAL E2E  | TARGET <=10s");
  console.log("--------------------------------------------------------------------------------------------------------");
  results.forEach(r => {
    const id = r.id.padEnd(10);
    const lang = r.language.slice(0, 7).toUpperCase().padEnd(7);
    const chars = String(r.chars).padStart(5);
    const ttfb = `${r.ttfbMs}ms`.padStart(6);
    const tts = `${(r.ttsDurationMs / 1000).toFixed(2)}s`.padStart(12);
    const up = `${(r.supabaseUploadMs / 1000).toFixed(2)}s`.padStart(10);
    const db = `${r.dbWriteMs}ms`.padStart(8);
    const e2e = `${(r.totalE2eMs / 1000).toFixed(2)}s`.padStart(10);
    const target = (r.targetMet ? "PASS (<=10s)" : "FAIL (>10s)").padStart(12);
    console.log(` ${id} | ${lang} | ${chars} | ${ttfb} | ${tts} | ${up} | ${db} | ${e2e} | ${target}`);
  });
  console.log("--------------------------------------------------------------------------------------------------------");

  console.log("\n================================================================================");
  console.log("                         STATISTICAL SUMMARY REPORT");
  console.log("================================================================================");
  console.log(` Total Evaluated Requests    : ${results.length}`);
  console.log(` Successful Runs             : ${successfulRuns.length}/${results.length} (${((successfulRuns.length / results.length) * 100).toFixed(1)}%)`);
  console.log(` Target <=10.0s Met          : ${results.filter(r => r.targetMet).length}/${results.length} (${((results.filter(r => r.targetMet).length / results.length) * 100).toFixed(1)}%)`);
  console.log("--------------------------------------------------------------------------------");
  console.log(` End-to-End Latency (E2E)    : Median = ${(median(e2eTimes)/1000).toFixed(2)}s | Mean = ${(mean(e2eTimes)/1000).toFixed(2)}s | p95 = ${(p95(e2eTimes)/1000).toFixed(2)}s | Min = ${(e2eTimes[0]/1000).toFixed(2)}s | Max = ${(e2eTimes[e2eTimes.length-1]/1000).toFixed(2)}s`);
  console.log(` Time to First Chunk (TTFB)  : Median = ${median(ttfbTimes)}ms | Mean = ${mean(ttfbTimes)}ms | p95 = ${p95(ttfbTimes)}ms`);
  console.log(` TTS Audio Stream Generation : Median = ${(median(ttsTimes)/1000).toFixed(2)}s | Mean = ${(mean(ttsTimes)/1000).toFixed(2)}s | p95 = ${(p95(ttsTimes)/1000).toFixed(2)}s`);
  console.log(` Supabase Storage Upload     : Median = ${(median(uploadTimes)/1000).toFixed(2)}s | Mean = ${(mean(uploadTimes)/1000).toFixed(2)}s | p95 = ${(p95(uploadTimes)/1000).toFixed(2)}s`);
  console.log(` Database Metadata Upsert    : Median = ${median(dbTimes)}ms | Mean = ${mean(dbTimes)}ms | p95 = ${p95(dbTimes)}ms`);
  console.log("================================================================================\n");
}

runBenchmark();
