import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { apiRouter, handleDiscordCallback } from './api.ts';
import { db } from './db.ts';

export async function startServer() {
  // Ensure database initialization completes before the server starts accepting requests
  await db.init();

  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Support image uploads (up to 25mb base64 payload)
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));
  app.use(cookieParser());

  // Static uploads directory for images uploaded from device
  const uploadsDir = path.resolve(process.cwd(), 'data', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));

  // Mount OAuth Callback routes directly on root and api prefixes
  app.get(
    ['/auth/callback', '/auth/callback/', '/api/auth/callback', '/api/auth/callback/'],
    handleDiscordCallback
  );

  // Mount REST API routes
  app.use('/api', apiRouter);

  // Dev server vs Production static server
  const distPath = path.resolve(process.cwd(), 'dist');
  const hasDist = fs.existsSync(distPath);

  if (process.env.NODE_ENV === 'production' || hasDist) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`White Kingdom PvP Server running on http://0.0.0.0:${PORT}`);
  });
}

// Auto-start if invoked directly
const isDirectEntry = process.argv[1] && (
  process.argv[1].endsWith('serverApp.js') || process.argv[1].endsWith('server.js')
);
if (isDirectEntry) {
  startServer().catch(err => {
    console.error('Fatal server startup error:', err);
    process.exit(1);
  });
}
