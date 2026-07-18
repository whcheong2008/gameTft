// Dev-only static file server for the Shattered Veil HTML game.
// Zero dependencies. Serves the repo root with no-cache headers so the browser
// always sees the working tree's current files (file:// caching defeats verification).
// Usage: node scripts/serve.js [port]   (default 8123)
var http = require('http');
var fs = require('fs');
var path = require('path');

var ROOT = path.join(__dirname, '..');
var PORT = parseInt(process.argv[2], 10) || 8123;

var MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.mp3': 'audio/mpeg',
    '.ogg': 'audio/ogg',
    '.woff2': 'font/woff2'
};

http.createServer(function (req, res) {
    var urlPath = decodeURIComponent(req.url.split('?')[0]);
    if (urlPath === '/') urlPath = '/game-v2.html';
    var filePath = path.normalize(path.join(ROOT, urlPath));
    if (filePath.indexOf(ROOT) !== 0) { res.writeHead(403); res.end(); return; }
    fs.readFile(filePath, function (err, data) {
        if (err) { res.writeHead(404); res.end('Not found: ' + urlPath); return; }
        res.writeHead(200, {
            'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
            'Cache-Control': 'no-store'
        });
        res.end(data);
    });
}).listen(PORT, function () {
    console.log('Shattered Veil dev server: http://localhost:' + PORT + '/');
});
