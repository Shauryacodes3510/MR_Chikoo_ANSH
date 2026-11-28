// Vercel serverless entry. Bundled by `npm run build:api` into api/index.js
// (bundling avoids Node-ESM "extensionless import" errors on Vercel).
import { appReady } from "./server.app";

export default async function handler(req: any, res: any) {
  const app = await appReady;
  return app(req, res);
}
