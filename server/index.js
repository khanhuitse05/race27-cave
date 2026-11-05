import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';

// In development, Vite occupies PORT so server runs on 8787 to match proxy in vite.config.js.
const PORT = process.argv.includes('--dev') ? 8787 : Number(process.env.PORT) || 8787;
const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const TICK_MS = 66; // ~15 ticks/second
const ARENA_RADIUS = 22;
const STRIKE_RANGE = 2.6;
const STRIKE_COOLDOWN_MS = 650;
const CHAT_COOLDOWN_MS = 600;
const CHAT_HISTORY = 35;
const MAX_HP = 5;
const GHOST_MS = 30000; // Ghost / recovery state duration: 30 seconds

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
};

/** @type {Map<number, any>} */
const players = new Map();
const chatLog = [];
let nextId = 1;

function json(res, code, body) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

function serveStatic(req, res) {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = path.join(DIST, urlPath);
  if (!file.startsWith(DIST)) return json(res, 403, { error: 'forbidden' });
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, 'index.html');
  if (!fs.existsSync(file)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Chưa build client. Chạy "npm run build" hoặc dùng "npm run dev".');
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/stats')) return json(res, 200, { online: players.size });
  serveStatic(req, res);
});

const wss = new WebSocketServer({ server, path: '/ws' });

function send(ws, msg) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
}

function broadcast(msg, exceptId) {
  const data = JSON.stringify(msg);
  for (const p of players.values()) {
    if (p.id !== exceptId && p.ws.readyState === p.ws.OPEN) p.ws.send(data);
  }
}

function pushChat(entry) {
  chatLog.push(entry);
  if (chatLog.length > CHAT_HISTORY) chatLog.shift();
  broadcast({ t: 'chat', ...entry });
}

function cleanName(raw) {
  const name = String(raw ?? '').replace(/\s+/g, ' ').trim().slice(0, 30);
  return name || 'Cơ thủ Ẩn danh';
}

function cleanNumber(raw) {
  const n = Number.parseInt(raw, 10);
  return n >= 0 && n <= 15 ? n : 8;
}

function publicInfo(p) {
  return {
    id: p.id,
    name: p.name,
    number: p.number,
    cueStyle: p.cueStyle,
    x: p.x,
    z: p.z,
    ry: p.ry,
    a: p.a,
    hp: p.hp,
    ghostLeft: ghostLeft(p),
  };
}

function ghostLeft(p) {
  return p.ghostUntil ? Math.max(0, p.ghostUntil - Date.now()) : 0;
}

function spawnPoint() {
  const angle = Math.random() * Math.PI * 2;
  const r = 8.5 + Math.random() * 4;
  return { x: Math.cos(angle) * r, z: Math.sin(angle) * r };
}

wss.on('connection', (ws) => {
  let me = null;

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    if (!me) {
      if (msg.t !== 'join') return;
      const spawn = spawnPoint();
      me = {
        id: nextId++,
        ws,
        name: cleanName(msg.name),
        number: cleanNumber(msg.number),
        cueStyle: String(msg.cueStyle || 'ngocmy'),
        x: spawn.x,
        z: spawn.z,
        ry: 0,
        a: 0,
        hp: MAX_HP,
        ghostUntil: 0,
        lastStrike: 0,
        lastChat: 0,
      };
      players.set(me.id, me);

      send(ws, {
        t: 'welcome',
        id: me.id,
        players: [...players.values()].map(publicInfo),
        chat: chatLog,
      });

      broadcast({ t: 'join', p: publicInfo(me) }, me.id);
      pushChat({ sys: true, text: `🎱 Cơ thủ ${me.name} vừa bước vào đấu trường Race 27 Gia Đình!` });
      return;
    }

    const now = Date.now();
    switch (msg.t) {
      case 'move': {
        const x = Number(msg.x);
        const z = Number(msg.z);
        if (!Number.isFinite(x) || !Number.isFinite(z)) return;
        const r = Math.hypot(x, z);
        const k = r > ARENA_RADIUS ? ARENA_RADIUS / r : 1;
        me.x = x * k;
        me.z = z * k;
        me.ry = Number(msg.ry) || 0;
        me.a = msg.a | 0;
        break;
      }
      case 'chat': {
        const text = String(msg.text ?? '').trim().slice(0, 200);
        if (!text || now - me.lastChat < CHAT_COOLDOWN_MS) return;
        me.lastChat = now;
        pushChat({ id: me.id, from: me.name, text });
        break;
      }
      case 'emote': {
        const emote = String(msg.emote || '🎱').slice(0, 4);
        broadcast({ t: 'emote', id: me.id, emote });
        break;
      }
      case 'table_break': {
        broadcast({ t: 'table_break', by: me.id, power: msg.power || 19 }, me.id);
        pushChat({ sys: true, text: `💥 ${me.name} vừa thực hiện cú phá bi dũng mãnh!` });
        break;
      }
      case 'table_reset': {
        broadcast({ t: 'table_reset', by: me.id }, me.id);
        pushChat({ sys: true, text: `🔄 ${me.name} đã xếp lại cụm bi 9-ball.` });
        break;
      }
      case 'punch': {
        const target = players.get(msg.target);
        if (!target || target === me || now - me.lastStrike < STRIKE_COOLDOWN_MS) return;
        if (me.ghostUntil || target.ghostUntil) return;
        if (Math.hypot(target.x - me.x, target.z - me.z) > STRIKE_RANGE) return;

        me.lastStrike = now;
        target.hp -= 1;
        if (target.hp <= 0) {
          target.hp = 0;
          target.ghostUntil = now + GHOST_MS;
        }

        broadcast({ t: 'punch', by: me.id, target: target.id, hp: target.hp, ghostLeft: ghostLeft(target) });
        pushChat({ sys: true, text: `🎯 ${me.name} đã thách đấu đường cơ với ${target.name}` });
        if (target.ghostUntil) pushChat({ sys: true, text: `👻 ${target.name} đã hết máu và tạm chuyển sang trạng thái Thần cơ!` });
        break;
      }
      case 'celebrate':
        broadcast({ t: 'celebrate', id: me.id });
        break;
    }
  });

  ws.on('close', () => {
    if (!me) return;
    players.delete(me.id);
    broadcast({ t: 'leave', id: me.id });
  });
});

setInterval(() => {
  if (players.size === 0) return;
  const now = Date.now();
  for (const p of players.values()) {
    if (p.ghostUntil && now >= p.ghostUntil) {
      p.ghostUntil = 0;
      p.hp = MAX_HP;
      broadcast({ t: 'revive', id: p.id, hp: p.hp });
      pushChat({ sys: true, text: `✨ Cơ thủ ${p.name} đã hồi phục đầy đủ phong độ!` });
    }
  }
  const ps = [...players.values()].map((p) => [p.id, +p.x.toFixed(2), +p.z.toFixed(2), +p.ry.toFixed(2), p.a]);
  broadcast({ t: 'state', ps });
}, TICK_MS);

server.listen(PORT, () => {
  console.log(`Rasson Billiards server is running at: http://localhost:${PORT}  (WebSocket: /ws)`);
});
