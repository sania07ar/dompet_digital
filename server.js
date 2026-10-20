/**
 * PinkWallet - Local Web Server
 * Menjalankan server lokal agar web PinkWallet bisa diakses dari browser laptop dan HP dalam satu jaringan WiFi.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// Dapatkan alamat IP Lokal (WiFi / LAN) untuk dibuka di HP
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  const filePath = path.join(__dirname, reqPath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 File Not Found: ' + reqPath);
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Server Error: ' + err.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

const localIp = getLocalIpAddress();

server.listen(PORT, '0.0.0.0', () => {
  console.log('========================================================');
  console.log('🌸 NiaWallet Server Aktif Berjalan! 🌸');
  console.log('========================================================');
  console.log(`💻 Akses di Komputer ini : http://localhost:${PORT}`);
  console.log(`📱 Akses di Browser HP   : http://${localIp}:${PORT}`);
  console.log('========================================================');
  console.log('Catatan untuk HP: Pastikan HP dan laptop terhubung ke WiFi yang sama.');
  console.log('Tekan Ctrl + C di terminal untuk menghentikan server.');
});
