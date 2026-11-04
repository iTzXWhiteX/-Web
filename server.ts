import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const bundledServer = path.resolve(__dirname, 'dist-server', 'server.js');
const isProduction = process.env.NODE_ENV === 'production';

async function ensureFreshBundle(): Promise<void> {
  try {
    const serverAppTs = path.resolve(__dirname, 'server', 'serverApp.ts');
    const dbTs = path.resolve(__dirname, 'server', 'db.ts');
    let needsBuild = !fs.existsSync(bundledServer);

    if (!needsBuild && fs.existsSync(bundledServer)) {
      const bundleMtime = fs.statSync(bundledServer).mtimeMs;
      if (fs.existsSync(serverAppTs) && fs.statSync(serverAppTs).mtimeMs > bundleMtime) {
        needsBuild = true;
      }
      if (fs.existsSync(dbTs) && fs.statSync(dbTs).mtimeMs > bundleMtime) {
        needsBuild = true;
      }
    }

    if (needsBuild) {
      console.log('[Server] Building fresh server bundle from serverApp.ts...');
      const esbuild = await import('esbuild');
      await esbuild.build({
        entryPoints: [serverAppTs],
        bundle: true,
        platform: 'node',
        format: 'esm',
        outfile: bundledServer,
        packages: 'external',
      });
      console.log('[Server] Fresh dist-server/server.js bundle created.');
    }
  } catch (err) {
    console.warn('[Server] Could not bundle with esbuild:', err);
  }
}

// Only run bundled server in production; in development mode always run serverApp.ts directly for live Vite
if (isProduction) {
  await ensureFreshBundle();
  if (fs.existsSync(bundledServer)) {
    const mod = await import(pathToFileURL(bundledServer).href);
    if (mod.startServer) {
      await mod.startServer();
    }
  } else {
    console.log('[Server] Starting serverApp.ts directly in production');
    const { startServer } = await import('./server/serverApp.ts');
    await startServer();
  }
} else {
  // In development, load serverApp.ts directly for live Vite middlewares and instant compilation
  console.log('[Server] Starting in development mode with live Vite server');
  const { startServer } = await import('./server/serverApp.ts');
  await startServer();
}

