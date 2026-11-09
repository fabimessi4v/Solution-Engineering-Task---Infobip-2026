/**
 * ============================================================================
 * LOCAL DEMO HTTP SERVER: BANCO IB & INFOBIP SOLUTIONS ENGINEERING
 * ============================================================================
 * Zero-dependency native Node.js static file server to launch the demo.
 * Usage: node demo/server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const BASE_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  let pathname = parsedUrl.pathname;
  if (pathname === '/') pathname = '/index.html';

  const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(BASE_DIR, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`404 Not Found: ${pathname}`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log('\n=============================================================');
  console.log(' 🚀 INFOBIP & BANCO IB INTERACTIVE SOLUTION SIMULATOR');
  console.log('=============================================================');
  console.log(`\n  Open your browser at: http://localhost:${PORT}`);
  console.log('  (Or double-click directly on demo/index.html)\n');
  console.log('  Active Modules:');
  console.log('   - demo/js/cpfValidator.js (Regex + Modulo 11 Algorithm)');
  console.log('   - demo/js/mockApi.js      (Beeceptor Core Banking Mock API)');
  console.log('   - demo/js/app.js          (Multi-Session & Customer 360 Controller)');
  console.log('\n  Press Ctrl + C to stop the server.');
  console.log('=============================================================\n');
});
