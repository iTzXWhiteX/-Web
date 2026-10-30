import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const bundledServer = path.resolve(__dirname, 'dist-server', 'server.js');

if (fs.existsSync(bundledServer)) {
  const mod = await import(pathToFileURL(bundledServer).href);
  if (mod.startServer) {
    await mod.startServer();
  }
} else {
  try {
    const esbuild = await import('esbuild');
    await esbuild.build({
      entryPoints: [path.resolve(__dirname, 'server', 'serverApp.ts')],
      bundle: true,
      platform: 'node',
      format: 'esm',
      outfile: bundledServer,
      packages: 'external',
    });
    const mod = await import(pathToFileURL(bundledServer).href);
    if (mod.startServer) {
      await mod.startServer();
    }
  } catch (err) {
    console.warn('Fallback loading serverApp.ts directly:', err);
    const { startServer } = await import('./server/serverApp.ts');
    await startServer();
  }
}
