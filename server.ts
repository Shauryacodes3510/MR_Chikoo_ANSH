import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distServerPath = path.resolve(__dirname, "dist-server/server.js");

const isRunningWithTsx = process.execArgv.some(arg => arg.includes("tsx")) || 
  process.env.npm_lifecycle_event === "dev";

async function main() {
  if (isRunningWithTsx) {
    // Development mode with tsx on-the-fly transpilation
    await import("./server.app.ts");
    return;
  }

  // Production or direct Node.js execution:
  // Node.js native ESM does not resolve extensionless TypeScript imports.
  // Ensure the bundled ESM server artifact exists before execution.
  if (!fs.existsSync(distServerPath)) {
    console.log("[Server Launcher] Pre-building server bundle with esbuild...");
    try {
      const { buildSync } = await import("esbuild");
      buildSync({
        entryPoints: [path.resolve(__dirname, "server.app.ts")],
        bundle: true,
        platform: "node",
        packages: "external",
        format: "esm",
        outfile: distServerPath,
        logLevel: "warning"
      });
      console.log("[Server Launcher] Server bundle created successfully.");
    } catch (buildErr) {
      console.error("[Server Launcher] Failed to bundle server.app.ts with esbuild:", buildErr);
      throw buildErr;
    }
  }

  // Load the self-contained production bundle
  // @ts-ignore - Generated at build/start time
  await import("./dist-server/server.js");
}

main().catch(err => {
  console.error("[Server Launcher] Fatal startup error:", err);
  process.exit(1);
});
