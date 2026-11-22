const http = require('http');
const fs = require('fs');
const path = require('path');
const bundle = require('./build');

const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // Проксирование /api запросов на порт 3001
  if (req.url.startsWith('/api/')) {
    const proxyReq = http.request({
      hostname: '127.0.0.1',
      port: 3001,
      path: req.url,
      method: req.method,
      headers: req.headers
    }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });
    proxyReq.on('error', () => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Backend API на порту 3001 недоступен' }));
    });
    req.pipe(proxyReq);
    return;
  }

  let reqPath = req.url.split('?')[0];

  // Отключаем favicon, чтобы браузер не показывал старые эмодзи из кэша
  if (reqPath === '/favicon.ico') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  const filePath = path.join(PUBLIC_DIR, reqPath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Access Denied');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // SPA Fallback: возвращаем index.html для любых несуществующих путей
      const indexPath = path.join(PUBLIC_DIR, 'index.html');
      fs.readFile(indexPath, (readErr, content) => {
        if (readErr) {
          res.writeHead(404);
          res.end('Not Found');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(content);
        }
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500);
        res.end('Server Error');
      } else {
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        });
        res.end(content);
      }
    });
  });
});

let isListening = false;

function startFrontend() {
  return new Promise((resolve, reject) => {
    if (isListening) return resolve(server);

    // Сначала собираем бандл
    try {
      bundle();
    } catch (e) {
      console.error('Ошибка сборки React бандла:', e.message);
    }

    server.listen(PORT, (err) => {
      if (err) return reject(err);
      isListening = true;
      resolve(server);
    });
  });
}

function stopFrontend() {
  return new Promise((resolve) => {
    if (!isListening) return resolve();
    server.close(() => {
      isListening = false;
      resolve();
    });
  });
}

if (require.main === module) {
  startFrontend().then(() => {
    console.log(`Frontend running on http://localhost:${PORT}`);
  });
}

module.exports = {
  server,
  startFrontend,
  stopFrontend
};
