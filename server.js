const http = require('http');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const root = __dirname;
const db = new DatabaseSync(path.join(root, 'fund-history.sqlite'));
db.exec('CREATE TABLE IF NOT EXISTS fund_snapshots (id INTEGER PRIMARY KEY, saved_at TEXT NOT NULL, payload TEXT NOT NULL)');

const send = (res, status, body, type = 'application/json; charset=utf-8') => { res.writeHead(status, { 'Content-Type': type }); res.end(body); };
http.createServer((req, res) => {
  const snapshotMatch = req.url.match(/^\/api\/snapshots\/(\d+)$/);
  if (snapshotMatch && req.method === 'PUT') {
    let raw = ''; req.on('data', chunk => raw += chunk); req.on('end', () => {
      try { JSON.parse(raw); const result = db.prepare('UPDATE fund_snapshots SET payload = ? WHERE id = ?').run(raw, Number(snapshotMatch[1])); send(res, result.changes ? 200 : 404, JSON.stringify({ ok: !!result.changes })); }
      catch { send(res, 400, '{"ok":false}'); }
    }); return;
  }
  if (snapshotMatch && req.method === 'DELETE') {
    const result = db.prepare('DELETE FROM fund_snapshots WHERE id = ?').run(Number(snapshotMatch[1]));
    return send(res, result.changes ? 200 : 404, JSON.stringify({ ok: !!result.changes }));
  }
  if (req.url === '/api/latest' && req.method === 'GET') {
    const row = db.prepare('SELECT payload, saved_at FROM fund_snapshots ORDER BY id DESC LIMIT 1').get();
    return send(res, 200, JSON.stringify(row ? { ...JSON.parse(row.payload), savedAt: row.saved_at } : null));
  }
  if (req.url === '/api/history' && req.method === 'GET') {
    const rows = db.prepare('SELECT id, saved_at, payload FROM fund_snapshots ORDER BY id DESC').all().map(r => ({ id: r.id, savedAt: r.saved_at, ...JSON.parse(r.payload) }));
    return send(res, 200, JSON.stringify(rows));
  }
  if (req.url === '/api/snapshots' && req.method === 'POST') {
    let raw = ''; req.on('data', chunk => raw += chunk); req.on('end', () => {
      try { db.prepare('INSERT INTO fund_snapshots (saved_at, payload) VALUES (?, ?)').run(new Date().toISOString(), raw); send(res, 201, '{"ok":true}'); }
      catch { send(res, 400, '{"ok":false}'); }
    }); return;
  }
  const safe = path.join(root, req.url === '/' ? 'admin.html' : decodeURIComponent(req.url));
  if (!safe.startsWith(root)) return send(res, 403, 'Forbidden', 'text/plain');
  fs.readFile(safe, (err, file) => { if (err) return send(res, 404, 'Not found', 'text/plain'); const ext = path.extname(safe); send(res, 200, file, ext === '.js' ? 'text/javascript' : ext === '.css' ? 'text/css' : 'text/html'); });
}).listen(4173, () => console.log('Local dashboard: http://localhost:4173/admin.html'));
