import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { apiRouter, handleDiscordCallback } from './api.ts';
import { db } from './db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITEMAP_XML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

  <!-- الصفحة الرئيسية | Home Page -->
  <url>
    <loc>https://white-kingdom-community.ethiodeploy.app/</loc>
    <lastmod>2026-11-06</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- السيرفر والمجتمع | Server & Community -->
  <url>
    <loc>https://white-kingdom-community.ethiodeploy.app/server</loc>
    <lastmod>2026-11-06</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>

  <!-- اختبار المستويات | Tier Test System -->
  <url>
    <loc>https://white-kingdom-community.ethiodeploy.app/tier-test</loc>
    <lastmod>2026-11-06</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>

  <!-- قائمة المتصدرين | Tier Rankings & Leaderboard -->
  <url>
    <loc>https://white-kingdom-community.ethiodeploy.app/leaderboard</loc>
    <lastmod>2026-11-06</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>

  <!-- عن المجتمع | About White Kingdom -->
  <url>
    <loc>https://white-kingdom-community.ethiodeploy.app/about</loc>
    <lastmod>2026-11-06</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>

  <!-- الأخبار والتحديثات | Community News & Updates -->
  <url>
    <loc>https://white-kingdom-community.ethiodeploy.app/news</loc>
    <lastmod>2026-11-06</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>

</urlset>`;

const ROBOTS_TXT = `# Robots.txt for White Kingdom Community
# https://white-kingdom-community.ethiodeploy.app/

User-agent: *
Allow: /
Allow: /server
Allow: /tier-test
Allow: /leaderboard
Allow: /about
Allow: /news

# Disallow private and administrative endpoints
Disallow: /admin
Disallow: /api/
Disallow: /auth/

# Sitemap location
Sitemap: https://white-kingdom-community.ethiodeploy.app/sitemap.xml
`;

function getSitemapXml(distPath: string, publicDir: string): string {
  const possiblePaths = [
    path.resolve(distPath, 'sitemap.xml'),
    path.resolve(publicDir, 'sitemap.xml'),
    path.resolve(__dirname, '..', 'dist', 'sitemap.xml'),
    path.resolve(__dirname, '..', 'public', 'sitemap.xml'),
    path.resolve(__dirname, 'dist', 'sitemap.xml'),
    path.resolve(__dirname, 'public', 'sitemap.xml'),
    path.resolve(process.cwd(), 'sitemap.xml'),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        const content = fs.readFileSync(p, 'utf-8');
        if (content && content.includes('<urlset')) {
          return content;
        }
      } catch {
        // Continue to next candidate
      }
    }
  }
  return SITEMAP_XML.trim();
}

function getRobotsTxt(distPath: string, publicDir: string): string {
  const possiblePaths = [
    path.resolve(distPath, 'robots.txt'),
    path.resolve(publicDir, 'robots.txt'),
    path.resolve(__dirname, '..', 'dist', 'robots.txt'),
    path.resolve(__dirname, '..', 'public', 'robots.txt'),
    path.resolve(__dirname, 'dist', 'robots.txt'),
    path.resolve(__dirname, 'public', 'robots.txt'),
    path.resolve(process.cwd(), 'robots.txt'),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        const content = fs.readFileSync(p, 'utf-8');
        if (content && content.includes('Sitemap:')) {
          return content;
        }
      } catch {
        // Continue to next candidate
      }
    }
  }
  return ROBOTS_TXT.trim();
}

export async function startServer() {
  // Ensure database initialization completes before the server starts accepting requests
  await db.init();

  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Base directory paths for static and build output
  const distPath = path.resolve(process.cwd(), 'dist');
  const publicDir = path.resolve(process.cwd(), 'public');
  const isProduction = process.env.NODE_ENV === 'production';

  // 1. TOP-PRIORITY SEO ENDPOINTS
  // Served immediately before ANY other middleware, static routes, or SPA fallbacks
  app.get(['/sitemap.xml', '/sitemap.xml/'], (_req, res) => {
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(200).send(getSitemapXml(distPath, publicDir));
  });

  app.get(['/robots.txt', '/robots.txt/'], (_req, res) => {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(200).send(getRobotsTxt(distPath, publicDir));
  });

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

  // Mount public directory
  if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));
  }

  // Mount REST API routes
  app.use('/api', apiRouter);

  // Dev server vs Production static server
  if (isProduction && fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      const cleanPath = req.path.toLowerCase().replace(/\/+$/, '');
      if (cleanPath === '/sitemap.xml') {
        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        return res.status(200).send(getSitemapXml(distPath, publicDir));
      }
      if (cleanPath === '/robots.txt') {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        return res.status(200).send(getRobotsTxt(distPath, publicDir));
      }
      if (req.path.startsWith('/api') || req.path.startsWith('/auth')) {
        return next();
      }
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    // In developer mode, use live Vite server with template transformation
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    app.use('*', async (req, res, next) => {
      const cleanUrl = req.originalUrl.split('?')[0].toLowerCase().replace(/\/+$/, '');
      if (cleanUrl === '/sitemap.xml') {
        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        return res.status(200).send(getSitemapXml(distPath, publicDir));
      }
      if (cleanUrl === '/robots.txt') {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        return res.status(200).send(getRobotsTxt(distPath, publicDir));
      }

      const url = req.originalUrl;
      try {
        const indexPath = path.resolve(process.cwd(), 'index.html');
        if (!fs.existsSync(indexPath)) {
          res.status(404).send('index.html not found');
          return;
        }
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        if (vite?.ssrFixStacktrace) {
          vite.ssrFixStacktrace(e);
        }
        next(e);
      }
    });
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
