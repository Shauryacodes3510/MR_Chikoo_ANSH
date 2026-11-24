import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Missing GEMINI_API_KEY");
  process.exit(1);
}

const ai = new GoogleGenAI({
  apiKey,
  httpOptions: { headers: { "User-Agent": "aistudio-build" } },
});

const testText = "Mars is called the Red Planet because iron minerals on its surface react with oxygen. This creates a reddish rust-like appearance all over the planet. That is why it looks distinctly orange and red in the night sky!";

async function testUnary(model: string) {
  console.log(`\n--- Testing Unary with model: ${model} ---`);
  const t0 = performance.now();
  try {
    const res = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: testText }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Puck" },
          },
        },
      },
    });
    const t1 = performance.now();
    const data = res.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    const bytes = data?.data ? Buffer.from(data.data, "base64").length : 0;
    console.log(`Unary Total: ${(t1 - t0).toFixed(0)}ms | Bytes: ${bytes} | mimeType: ${data?.mimeType}`);
  } catch (err: any) {
    console.error(`Unary Error:`, err.message);
  }
}

async function testStreaming(model: string) {
  console.log(`\n--- Testing Streaming with model: ${model} ---`);
  const t0 = performance.now();
  try {
    const responseStream = await ai.models.generateContentStream({
      model,
      contents: [{ parts: [{ text: testText }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Puck" },
          },
        },
      },
    });
    let tFirstChunk: number | null = null;
    const pcmChunks: Buffer[] = [];
    let chunkCount = 0;

    for await (const chunk of responseStream) {
      if (tFirstChunk === null) {
        tFirstChunk = performance.now();
        console.log(`Streaming TTFB (first chunk): ${(tFirstChunk - t0).toFixed(0)}ms`);
      }
      const data = chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (data) {
        chunkCount++;
        pcmChunks.push(Buffer.from(data, "base64"));
      }
    }
    const tEnd = performance.now();
    const totalPcm = Buffer.concat(pcmChunks);
    console.log(`Streaming Total: ${(tEnd - t0).toFixed(0)}ms | Chunks: ${chunkCount} | PCM Bytes: ${totalPcm.length}`);
  } catch (err: any) {
    console.error(`Streaming Error:`, err.message);
  }
}

async function run() {
  await testUnary("gemini-3.1-flash-tts-preview");
  await testStreaming("gemini-3.1-flash-tts-preview");
  await testUnary("gemini-3.8-flash-tts");
  await testStreaming("gemini-3.8-flash-tts");
  // Also check gemini-3.8-flash-lite-tts if supported
  try {
    await testStreaming("gemini-3.8-flash-lite-tts");
  } catch (e: any) {
    console.log("3.8-flash-lite-tts test:", e.message);
  }
}

run();
