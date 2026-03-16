import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // In-memory store for allowed domains (optional, but good for security if needed)
  const allowedDomains = new Set<string>([
    'generativelanguage.googleapis.com',
    'api.openai.com',
    'api.anthropic.com',
    'api.mistral.ai',
    'api.groq.com',
    'api.together.xyz',
    'api.perplexity.ai',
    'openrouter.ai',
    'picsum.photos'
  ]);

  // API Routes
  app.post('/api/proxy/register-domains', (req, res) => {
    const { domains } = req.body;
    if (Array.isArray(domains)) {
      domains.forEach(d => allowedDomains.add(d.toLowerCase()));
      console.log('Registered domains:', Array.from(allowedDomains));
      res.json({ success: true, count: allowedDomains.size });
    } else {
      res.status(400).json({ error: 'Invalid domains format' });
    }
  });

  app.post('/api/proxy', async (req, res) => {
    const { targetUrl, method = 'GET', headers = {}, body } = req.body;

    if (!targetUrl) {
      return res.status(400).json({ error: 'Missing targetUrl' });
    }

    try {
      const url = new URL(targetUrl);
      // Optional: Check if domain is allowed
      // if (!allowedDomains.has(url.hostname.toLowerCase())) {
      //   return res.status(403).json({ error: `Domain ${url.hostname} not allowed` });
      // }

      console.log(`Proxying ${method} request to: ${targetUrl}`);

      const proxyHeaders: Record<string, string> = {};
      Object.entries(headers).forEach(([key, value]) => {
        proxyHeaders[key] = String(value);
      });

      const fetchOptions: RequestInit = {
        method,
        headers: {
          ...proxyHeaders,
          'host': url.host,
        }
      };

      if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
        const hasContentType = Object.keys(proxyHeaders).some(k => k.toLowerCase() === 'content-type');
        if (!hasContentType && typeof body !== 'string') {
          (fetchOptions.headers as any)['Content-Type'] = 'application/json';
        }
      }

      const response = await fetch(targetUrl, fetchOptions);
      
      // Copy headers from target response to our response
      response.headers.forEach((value, key) => {
        // Skip some headers that might cause issues
        if (['content-encoding', 'transfer-encoding', 'content-length'].includes(key.toLowerCase())) return;
        res.setHeader(key, value);
      });

      res.status(response.status);

      // Handle different content types
      const contentType = response.headers.get('content-type');
      if (contentType && (contentType.includes('image/') || contentType.includes('video/') || contentType.includes('audio/'))) {
        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));
      } else {
        const text = await response.text();
        res.send(text);
      }
    } catch (error: any) {
      console.error('Proxy error:', error);
      res.status(500).json({ error: 'Proxy request failed', details: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
