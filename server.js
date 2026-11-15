'use strict';
// Servidor do Sistema Chai Menachem: página, login, banco de dados e sincronização.
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Pool } = require('pg');

const PORT = +process.env.PORT || 3000;
const SECRET = process.env.SESSION_SECRET || '';
const SETUP_CODE = (process.env.SETUP_CODE || '').trim();
if (!process.env.DATABASE_URL) { console.error('Falta a variável DATABASE_URL.'); process.exit(1); }
if (SECRET.length < 32) { console.error('SESSION_SECRET precisa ter pelo menos 32 caracteres.'); process.exit(1); }

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });

/* ---------- perfis ---------- */
const ROLES = { Administrador: { cfg: 1, fin: 1, com: 1, rel: 1 }, 'Secretária': { fin: 1, com: 1, rel: 1 }, Rabino: { fin: 1, com: 1, rel: 1, notas: 1 }, 'Voluntário': {} };
const COLLS = new Set(['fam', 'ppl', 'pay', 'don', 'prom', 'ev', 'yz', 'ct', 'disp', 'tpl', 'auto', 'seg', 'forms', 'life', 'camp', 'aulas', 'log', 'att', 'kv']);
const READ = { pay: 'fin', don: 'fin', prom: 'fin', camp: 'fin' };
const WRITE = { pay: 'fin', don: 'fin', prom: 'fin', camp: 'fin', disp: 'com', tpl: 'com', auto: 'com', forms: 'com', seg: 'com' };
const can = (u, k) => !k || !!(ROLES[u.papel] || {})[k];
const canRead = (u, c) => can(u, READ[c]);
const canWrite = (u, c, id) => c === 'kv' ? (id === 'tags' || can(u, 'cfg') || can(u, 'fin')) : can(u, WRITE[c]);
const cleanOut = (u, c, d) => { if (c === 'fam' && d && !can(u, 'notas') && 'notaRabino' in d) { d = Object.assign({}, d); delete d.notaRabino; } return d; };

/* ---------- banco ---------- */
async function initDb() {
  for (let i = 1; ; i++) {
    try {
      await pool.query(`
        create table if not exists users(id serial primary key, nome text not null, email text not null unique, papel text not null,
          hash text not null, ativo boolean not null default true, ver int not null default 1, criado timestamptz not null default now());
        create sequence if not exists rec_seq;
        create table if not exists records(coll text not null, id text not null, data jsonb, deleted boolean not null default false,
          seq bigint not null, por int, updated timestamptz not null default now(), primary key(coll, id));
        create index if not exists records_seq on records(seq);`);
      return;
    } catch (e) {
      if (i >= 15) throw e;
      console.log('Banco ainda não respondeu, tentando de novo…', e.message);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

/* ---------- senhas e sessão ---------- */
const SCRYPT = { N: 16384, r: 8, p: 1 };
const hashPw = pw => new Promise((res, rej) => { const salt = crypto.randomBytes(16); crypto.scrypt(pw, salt, 64, SCRYPT, (e, k) => e ? rej(e) : res('s1$' + salt.toString('hex') + '$' + k.toString('hex'))); });
const checkPw = (pw, h) => new Promise(res => {
  const [v, s, k] = String(h || '').split('$');
  if (v !== 's1' || !s || !k) return res(false);
  crypto.scrypt(String(pw), Buffer.from(s, 'hex'), 64, SCRYPT, (e, d) => res(!e && d.length === Buffer.from(k, 'hex').length && crypto.timingSafeEqual(d, Buffer.from(k, 'hex'))));
});
const sign = s => crypto.createHmac('sha256', SECRET).update(s).digest('base64url');
const DAY = 864e5, SESSION_DAYS = 30;
const mkToken = u => { const p = Buffer.from(JSON.stringify({ u: u.id, v: u.ver, e: Date.now() + SESSION_DAYS * DAY })).toString('base64url'); return p + '.' + sign(p); };
function readToken(req) {
  const m = /(?:^|;\s*)cm=([^;]+)/.exec(req.headers.cookie || '');
  if (!m) return null;
  const [p, s] = m[1].split('.');
  if (!p || !s) return null;
  const a = Buffer.from(s), b = Buffer.from(sign(p));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try { const t = JSON.parse(Buffer.from(p, 'base64url').toString()); return t.e > Date.now() ? t : null; } catch (e) { return null; }
}
const isHttps = req => (req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https';
const setCookie = (req, res, tok) => res.setHeader('set-cookie', `cm=${tok}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${tok ? SESSION_DAYS * 86400 : 0}${isHttps(req) ? '; Secure' : ''}`);
async function currentUser(req) {
  const t = readToken(req);
  if (!t) return null;
  const { rows } = await pool.query('select id, nome, email, papel, ativo, ver from users where id = $1', [t.u]);
  const u = rows[0];
  return u && u.ativo && u.ver === t.v ? u : null;
}
const pubUser = u => ({ id: u.id, nome: u.nome, email: u.email, papel: u.papel, ativo: u.ativo });

/* ---------- limite de tentativas de login ---------- */
const tries = new Map();
function tooMany(ip) {
  const now = Date.now(), t = tries.get(ip);
  if (!t || now - t.t > 15 * 60e3) { tries.set(ip, { n: 1, t: now }); return false; }
  t.n++;
  return t.n > 10;
}
setInterval(() => { const now = Date.now(); for (const [k, t] of tries) if (now - t.t > 15 * 60e3) tries.delete(k); }, 60e3).unref();

/* ---------- utilidades http ---------- */
const PAGES = {};
function loadPages() {
  for (const [k, f] of [['app', 'app.html'], ['previa', 'previa.html']]) {
    try { PAGES[k] = fs.readFileSync(path.join(__dirname, 'public', f)); } catch (e) { PAGES[k] = Buffer.from('Página não encontrada. Rode npm run build.'); }
  }
}
const SEC_HEADERS = { 'x-content-type-options': 'nosniff', 'x-frame-options': 'DENY', 'referrer-policy': 'same-origin', 'x-robots-tag': 'noindex, nofollow' };
function send(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, Object.assign({ 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }, SEC_HEADERS));
  res.end(body);
}
function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > limit) { reject(Object.assign(new Error('Dados grandes demais.'), { status: 413 })); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); } catch (e) { reject(Object.assign(new Error('Dados inválidos.'), { status: 400 })); } });
    req.on('error', reject);
  });
}
const clientIp = req => (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || '';
const validEmail = e => typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 200;
const validPw = p => typeof p === 'string' && p.length >= 8 && p.length <= 200;
const str = (v, max) => typeof v === 'string' ? v.trim().slice(0, max) : '';

/* ---------- rotas da API ---------- */
async function api(req, res, url) {
  const method = req.method;
  if (method !== 'GET' && req.headers['x-requested-with'] !== 'cm') return send(res, 403, { erro: 'Pedido recusado.' });
  const route = method + ' ' + url.pathname;

  if (route === 'GET /api/me') {
    const u = await currentUser(req);
    if (u) return send(res, 200, { user: pubUser(u) });
    const { rows } = await pool.query('select count(*)::int n from users');
    return send(res, 401, { erro: 'Entre com o seu e-mail e senha.', setup: rows[0].n === 0 });
  }

  if (route === 'POST /api/setup') {
    const b = await readBody(req, 1e4);
    if (tooMany(clientIp(req))) return send(res, 429, { erro: 'Muitas tentativas. Espere 15 minutos.' });
    const { rows } = await pool.query('select count(*)::int n from users');
    if (rows[0].n > 0) return send(res, 409, { erro: 'O administrador já foi criado. Entre com e-mail e senha.' });
    if (!SETUP_CODE) return send(res, 403, { erro: 'A configuração inicial não está liberada.' });
    const a = Buffer.from(str(b.code, 100)), c = Buffer.from(SETUP_CODE);
    if (a.length !== c.length || !crypto.timingSafeEqual(a, c)) return send(res, 403, { erro: 'Código de configuração incorreto.' });
    const nome = str(b.nome, 120), email = str(b.email, 200).toLowerCase();
    if (!nome) return send(res, 400, { erro: 'Informe o seu nome.' });
    if (!validEmail(email)) return send(res, 400, { erro: 'Informe um e-mail válido.' });
    if (!validPw(b.senha)) return send(res, 400, { erro: 'A senha precisa ter pelo menos 8 caracteres.' });
    const r = await pool.query('insert into users(nome, email, papel, hash) values($1, $2, $3, $4) returning id, nome, email, papel, ativo, ver', [nome, email, 'Administrador', await hashPw(b.senha)]);
    setCookie(req, res, mkToken(r.rows[0]));
    return send(res, 200, { user: pubUser(r.rows[0]) });
  }

  if (route === 'POST /api/login') {
    const b = await readBody(req, 1e4);
    if (tooMany(clientIp(req))) return send(res, 429, { erro: 'Muitas tentativas. Espere 15 minutos e tente de novo.' });
    const email = str(b.email, 200).toLowerCase();
    const { rows } = await pool.query('select * from users where email = $1', [email]);
    const u = rows[0];
    const ok = await checkPw(String(b.senha || ''), u ? u.hash : 's1$00$00');
    if (!u || !ok) return send(res, 401, { erro: 'E-mail ou senha incorretos.' });
    if (!u.ativo) return send(res, 403, { erro: 'Este acesso foi desativado. Fale com a administração.' });
    tries.delete(clientIp(req));
    setCookie(req, res, mkToken(u));
    return send(res, 200, { user: pubUser(u) });
  }

  if (route === 'POST /api/logout') { setCookie(req, res, ''); return send(res, 200, { ok: true }); }

  const u = await currentUser(req);
  if (!u) return send(res, 401, { erro: 'Sua sessão terminou. Entre de novo.' });

  if (route === 'POST /api/senha') {
    const b = await readBody(req, 1e4);
    const { rows } = await pool.query('select hash from users where id = $1', [u.id]);
    if (!(await checkPw(String(b.atual || ''), rows[0].hash))) return send(res, 400, { erro: 'A senha atual está incorreta.' });
    if (!validPw(b.nova)) return send(res, 400, { erro: 'A nova senha precisa ter pelo menos 8 caracteres.' });
    const r = await pool.query('update users set hash = $1, ver = ver + 1 where id = $2 returning id, ver', [await hashPw(b.nova), u.id]);
    setCookie(req, res, mkToken(r.rows[0]));
    return send(res, 200, { ok: true });
  }

  if (route === 'GET /api/users') {
    const { rows } = await pool.query('select id, nome, email, papel, ativo from users order by nome');
    return send(res, 200, { users: rows.map(x => can(u, 'cfg') || x.id === u.id ? x : { id: x.id, nome: x.nome, papel: x.papel, ativo: x.ativo }) });
  }

  if (route === 'POST /api/users') {
    if (!can(u, 'cfg')) return send(res, 403, { erro: 'Só o administrador cria usuários.' });
    const b = await readBody(req, 1e4);
    const nome = str(b.nome, 120), email = str(b.email, 200).toLowerCase(), papel = str(b.papel, 40);
    if (!nome) return send(res, 400, { erro: 'Informe o nome.' });
    if (!validEmail(email)) return send(res, 400, { erro: 'Informe um e-mail válido.' });
    if (!ROLES[papel]) return send(res, 400, { erro: 'Perfil inválido.' });
    if (!validPw(b.senha)) return send(res, 400, { erro: 'A senha temporária precisa ter pelo menos 8 caracteres.' });
    try {
      const r = await pool.query('insert into users(nome, email, papel, hash) values($1, $2, $3, $4) returning id, nome, email, papel, ativo', [nome, email, papel, await hashPw(b.senha)]);
      return send(res, 200, { user: r.rows[0] });
    } catch (e) {
      if (e.code === '23505') return send(res, 409, { erro: 'Já existe um usuário com este e-mail.' });
      throw e;
    }
  }

  const um = /^\/api\/users\/(\d+)$/.exec(url.pathname);
  if (method === 'PATCH' && um) {
    if (!can(u, 'cfg')) return send(res, 403, { erro: 'Só o administrador altera usuários.' });
    const id = +um[1], b = await readBody(req, 1e4);
    const { rows } = await pool.query('select * from users where id = $1', [id]);
    const t = rows[0];
    if (!t) return send(res, 404, { erro: 'Usuário não encontrado.' });
    const papel = b.papel != null ? str(b.papel, 40) : t.papel, ativo = b.ativo != null ? !!b.ativo : t.ativo, nome = b.nome != null ? str(b.nome, 120) || t.nome : t.nome;
    if (!ROLES[papel]) return send(res, 400, { erro: 'Perfil inválido.' });
    if (b.senha != null && b.senha !== '' && !validPw(b.senha)) return send(res, 400, { erro: 'A nova senha precisa ter pelo menos 8 caracteres.' });
    if (t.papel === 'Administrador' && (papel !== 'Administrador' || !ativo)) {
      const c = await pool.query("select count(*)::int n from users where papel = 'Administrador' and ativo and id <> $1", [id]);
      if (c.rows[0].n === 0) return send(res, 400, { erro: 'É preciso ter pelo menos um administrador ativo.' });
    }
    const newHash = b.senha ? await hashPw(b.senha) : t.hash, bump = (b.senha ? 1 : 0) || (!ativo && t.ativo) || papel !== t.papel ? 1 : 0;
    const r = await pool.query('update users set nome = $1, papel = $2, ativo = $3, hash = $4, ver = ver + $5 where id = $6 returning id, nome, email, papel, ativo, ver', [nome, papel, ativo, newHash, bump, id]);
    if (id === u.id && bump) setCookie(req, res, mkToken(r.rows[0]));
    return send(res, 200, { user: pubUser(r.rows[0]) });
  }

  if (route === 'GET /api/data') {
    const s = await pool.query("select coalesce(max(seq), 0)::bigint seq from records");
    const { rows } = await pool.query('select coll, id, data from records where not deleted');
    const recs = [];
    for (const r of rows) if (canRead(u, r.coll)) recs.push({ c: r.coll, id: r.id, d: cleanOut(u, r.coll, r.data) });
    return send(res, 200, { seq: String(s.rows[0].seq), records: recs });
  }

  if (route === 'GET /api/changes') {
    const since = String(url.searchParams.get('since') || '0').replace(/\D/g, '') || '0';
    const { rows } = await pool.query('select coll, id, data, deleted, seq from records where seq > $1 order by seq', [since]);
    let seq = since;
    const recs = [];
    for (const r of rows) {
      seq = String(r.seq);
      if (canRead(u, r.coll)) recs.push({ c: r.coll, id: r.id, d: r.deleted ? null : cleanOut(u, r.coll, r.data), del: r.deleted });
    }
    return send(res, 200, { seq, records: recs });
  }

  if (route === 'POST /api/sync') {
    const b = await readBody(req, 25e6);
    const ups = new Map(), dels = new Map();
    let rejected = 0;
    for (const x of Array.isArray(b.up) ? b.up : []) {
      if (!x || !COLLS.has(x.c) || typeof x.id !== 'string' || !x.id || x.id.length > 200 || !x.d || typeof x.d !== 'object') { rejected++; continue; }
      if (!canWrite(u, x.c, x.id)) { rejected++; continue; }
      ups.set(x.c + '|' + x.id, x);
    }
    for (const x of Array.isArray(b.del) ? b.del : []) {
      if (!x || !COLLS.has(x.c) || typeof x.id !== 'string' || !x.id || !canWrite(u, x.c, x.id)) { rejected++; continue; }
      const k = x.c + '|' + x.id;
      ups.delete(k);
      dels.set(k, x);
    }
    const famIds = [...ups.values()].filter(x => x.c === 'fam').map(x => x.id);
    if (famIds.length && !can(u, 'notas')) {
      const { rows } = await pool.query("select id, data->'notaRabino' nota from records where coll = 'fam' and id = any($1)", [famIds]);
      const notes = new Map(rows.map(r => [r.id, r.nota]));
      for (const x of ups.values()) if (x.c === 'fam') { x.d = Object.assign({}, x.d); delete x.d.notaRabino; if (notes.get(x.id) != null) x.d.notaRabino = notes.get(x.id); }
    }
    const client = await pool.connect();
    try {
      await client.query('begin');
      const list = [...ups.values()];
      for (let i = 0; i < list.length; i += 1000) {
        const batch = list.slice(i, i + 1000).map(x => ({ c: x.c, id: x.id, d: x.d }));
        await client.query(`insert into records(coll, id, data, deleted, seq, por, updated)
          select x.c, x.id, x.d, false, nextval('rec_seq'), $2, now() from jsonb_to_recordset($1::jsonb) as x(c text, id text, d jsonb)
          on conflict (coll, id) do update set data = excluded.data, deleted = false, seq = excluded.seq, por = excluded.por, updated = now()`, [JSON.stringify(batch), u.id]);
      }
      for (const x of dels.values()) {
        await client.query("update records set deleted = true, data = null, seq = nextval('rec_seq'), por = $3, updated = now() where coll = $1 and id = $2 and not deleted", [x.c, x.id, u.id]);
      }
      await client.query('commit');
    } catch (e) { await client.query('rollback').catch(() => {}); throw e; } finally { client.release(); }
    return send(res, 200, { ok: true, salvos: ups.size + dels.size, recusados: rejected });
  }

  return send(res, 404, { erro: 'Endereço não encontrado.' });
}

/* ---------- servidor ---------- */
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  try {
    if (url.pathname === '/health') { res.writeHead(200, { 'content-type': 'text/plain' }); return res.end('ok'); }
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { erro: 'Método não permitido.' });
    const page = url.pathname === '/previa' || url.pathname === '/previa/' ? PAGES.previa : PAGES.app;
    res.writeHead(200, Object.assign({ 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' }, SEC_HEADERS));
    res.end(req.method === 'HEAD' ? undefined : page);
  } catch (e) {
    if (e.status) return send(res, e.status, { erro: e.message });
    console.error(e);
    if (!res.headersSent) send(res, 500, { erro: 'Algo deu errado no servidor. Tente de novo.' });
  }
});

loadPages();
initDb().then(() => server.listen(PORT, () => console.log('Sistema Chai Menachem no ar, porta ' + PORT))).catch(e => { console.error('Não foi possível preparar o banco:', e); process.exit(1); });
