require('dotenv').config();
const express = require('express'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const bcrypt = require('bcryptjs'), jwt = require('jsonwebtoken'), multer = require('multer');
const helmet = require('helmet'), rateLimit = require('express-rate-limit'), nodemailer = require('nodemailer');
const { PORT = 3000, JWT_SECRET, SITE_URL = 'http://localhost:3000', MONGODB_URI } = process.env, ON_VERCEL = !!process.env.VERCEL;
const uid = () => crypto.randomUUID();
const fresh = () => ({ users: [], projects: [], clientProjects: [], documents: [], posts: [], leads: [], files: {}, library: [] });

/* ================= storage =================
   Local dev  -> data/db.json + uploads/        (no setup)
   Vercel     -> MongoDB Atlas (data + GridFS files), because Vercel's disk is read-only */
function localStore() {
  const DB = path.join(__dirname, 'data', 'db.json'), UP = path.join(__dirname, 'uploads');
  if (!ON_VERCEL) { fs.mkdirSync(path.dirname(DB), { recursive: true }); fs.mkdirSync(UP, { recursive: true }); }
  return {
    async load() { return fs.existsSync(DB) ? JSON.parse(fs.readFileSync(DB)) : null; },
    async save(d) { fs.writeFileSync(DB, JSON.stringify(d, null, 2)); },
    async put(id, buf) { fs.writeFileSync(path.join(UP, id), buf); },
    async get(id) { const p = path.join(UP, id); return fs.existsSync(p) ? fs.createReadStream(p) : null; }
  };
}
function mongoStore() {
  const { MongoClient, GridFSBucket } = require('mongodb'); let p;
  const conn = () => p ||= MongoClient.connect(MONGODB_URI, { serverSelectionTimeoutMS: 8000 }).then(c => c.db(process.env.MONGODB_DB || 'levi'));
  return {
    async load() { const r = await (await conn()).collection('kv').findOne({ _id: 'db' }); return r && r.data; },
    async save(d) { await (await conn()).collection('kv').replaceOne({ _id: 'db' }, { _id: 'db', data: d }, { upsert: true }); },
    async put(id, buf) { const b = new GridFSBucket(await conn()); await new Promise((ok, no) => b.openUploadStream(id).on('finish', ok).on('error', no).end(buf)); },
    async get(id) { return new GridFSBucket(await conn()).openDownloadStreamByName(id); }
  };
}
const store = MONGODB_URI ? mongoStore() : localStore();

let db = fresh(), dirty = false;
const save = () => { dirty = true; };            // handlers call save(); it is persisted right before the response is sent
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
async function loadDb(req, res, next) {
  const missing = [!JWT_SECRET && 'JWT_SECRET', ON_VERCEL && !MONGODB_URI && 'MONGODB_URI'].filter(Boolean);
  if (missing.length) return res.status(500).json({ error: 'Server not configured. Add these Environment Variables in Vercel: ' + missing.join(', ') });
  try {
    db = { ...fresh(), ...(await store.load() || {}) };
    if (!db.users.some(u => u.role === 'admin') && process.env.ADMIN_EMAIL) {
      db.users.push({ id: uid(), name: 'Admin', email: process.env.ADMIN_EMAIL.toLowerCase(),
        hash: bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'ChangeMe123!', 12), role: 'admin', createdAt: Date.now() });
      await store.save(db);
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Database connection failed - check MONGODB_URI and that Atlas Network Access allows 0.0.0.0/0 (' + String(e.message).slice(0, 120) + ')' });
  }
  dirty = false; next();
}

/* ================= middleware ================= */
const app = express();
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false, referrerPolicy: { policy: 'strict-origin-when-cross-origin' } }));
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));          // static files never touch the database
app.use(['/api', '/blog', '/sitemap.xml', '/files'], wrap(loadDb));
app.use((req, res, next) => {                                      // persist changes before replying (serverless may freeze right after)
  const json = res.json.bind(res);
  res.json = async b => { try { if (dirty) { dirty = false; await store.save(db); } } catch (e) { console.error(e); return json({ error: 'Could not save data' }); } return json(b); };
  next();
});
const auth = roles => (req, res, next) => {
  try {
    req.user = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), JWT_SECRET);
    if (roles && !roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  } catch { res.status(401).json({ error: 'Unauthorized' }); }
};
const admin = auth(['admin']), anyUser = auth();
// Vercel request bodies are limited to ~4.5MB, so files are capped at 4MB (admin page shrinks photos automatically)
const LIMITS = { fileSize: 4 * 1024 * 1024 }, memory = multer.memoryStorage();
const imgOnly = (r, f, cb) => cb(null, /^image\/(jpeg|png|webp|gif|avif)$/.test(f.mimetype));
const pubUpload = multer({ storage: memory, limits: LIMITS, fileFilter: imgOnly }), privUpload = multer({ storage: memory, limits: LIMITS });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 }), leadLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10 });
async function saveFile(f, priv) {
  const id = uid() + path.extname(f.originalname).toLowerCase();
  await store.put(id, f.buffer); db.files[id] = { name: f.originalname, type: f.mimetype, priv: !!priv }; save(); return id;
}
const okUrl = u => typeof u === 'string' && /^\/(files|img)\//.test(u);

/* ================= files ================= */
app.get('/files/:id', wrap(async (req, res) => {
  const m = db.files[req.params.id]; if (!m || m.priv) return res.sendStatus(404);
  const s = await store.get(req.params.id); if (!s) return res.sendStatus(404);
  res.set({ 'Content-Type': m.type, 'Cache-Control': 'public, max-age=31536000, immutable' });
  s.on('error', () => res.end()); s.pipe(res);
}));
app.post('/api/admin/upload', admin, pubUpload.single('file'), wrap(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Image file required (jpg, png, webp)' });
  res.json({ url: '/files/' + await saveFile(req.file) });
}));

/* ================= auth ================= */
const sign = u => jwt.sign({ id: u.id, role: u.role, name: u.name }, JWT_SECRET, { expiresIn: '7d' });
app.post('/api/auth/signup', authLimiter, wrap(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !/^\S+@\S+\.\S+$/.test(email || '') || (password || '').length < 8) return res.status(400).json({ error: 'Valid name, email and 8+ char password required' });
  if (db.users.some(u => u.email === email.toLowerCase())) return res.status(409).json({ error: 'Email already registered' });
  const u = { id: uid(), name: name.trim(), email: email.toLowerCase(), hash: await bcrypt.hash(password, 12), role: 'client', createdAt: Date.now() };
  db.users.push(u); save(); res.json({ token: sign(u), role: u.role, name: u.name });
}));
app.post('/api/auth/login', authLimiter, wrap(async (req, res) => {
  const u = db.users.find(x => x.email === (req.body.email || '').toLowerCase());
  if (!u || !(await bcrypt.compare(req.body.password || '', u.hash))) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ token: sign(u), role: u.role, name: u.name });
}));

/* ================= public gallery ================= */
app.get('/api/projects', (req, res) => res.json(db.projects));
app.post('/api/projects', admin, (req, res) => {
  const b = req.body; if (!b.title) return res.status(400).json({ error: 'Title required' });
  const p = { id: uid(), title: b.title, type: ['res', 'com', 'ren'].includes(b.type) ? b.type : 'res', location: b.location, duration: b.duration, scope: b.scope,
    testimonial: { text: b.testimonialText || '', author: b.testimonialAuthor || '' }, images: (b.images || []).filter(okUrl),
    before: okUrl(b.before) ? b.before : null, after: okUrl(b.after) ? b.after : null, createdAt: Date.now() };
  db.projects.unshift(p); save(); res.json(p);
});
app.delete('/api/projects/:id', admin, (req, res) => { db.projects = db.projects.filter(p => p.id !== req.params.id); save(); res.json({ ok: true }); });

/* ================= photo library (public/img/<res|com|ren>/ in the repo + admin uploads) ================= */
const LIB_DIR = path.join(__dirname, 'public', 'img'), CATS = ['res', 'com', 'ren'], IMG_RE = /\.(jpe?g|png|webp|avif)$/i;
function diskLib() {
  const e = [];
  CATS.forEach(c => { const d = path.join(LIB_DIR, c); if (!fs.existsSync(d)) return;
    fs.readdirSync(d).filter(f => IMG_RE.test(f)).sort().forEach(f => { const m = f.replace(IMG_RE, '').match(/^(.*)-(before|after)$/i);
      e.push({ cat: c, kind: m ? m[2].toLowerCase() : 'photo', name: m ? m[1].replace(/[-_]+/g, ' ') : '', url: encodeURI(`/img/${c}/${f}`) }); }); });
  return e;
}
app.get('/api/library', (req, res) => {
  const out = { res: [], com: [], ren: [], pairs: [] }, pairs = {};
  [...diskLib(), ...db.library.map(l => ({ cat: l.cat, kind: l.kind, name: l.pair, url: l.url }))].forEach(e => {
    if (e.kind === 'photo') out[e.cat].push(e.url); else (pairs[e.name] ||= {})[e.kind] = e.url; });
  Object.entries(pairs).forEach(([name, p]) => p.before && p.after && out.pairs.push({ name, ...p }));
  res.json(out);
});
app.get('/api/hero', (req, res) => {   // hero background media: put images/videos in public/img/hero/
  const d = path.join(LIB_DIR, 'hero'); let out = [];
  if (fs.existsSync(d)) out = fs.readdirSync(d).sort().map(f => /\.(mp4|webm)$/i.test(f) ? ['video', f] : IMG_RE.test(f) ? ['image', f] : null).filter(Boolean).map(([type, f]) => ({ type, url: encodeURI('/img/hero/' + f) }));
  res.json(out);
});
app.post('/api/admin/library', admin, pubUpload.single('file'), wrap(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Image file required' });
  const { cat, kind } = req.body; if (!CATS.includes(cat)) return res.status(400).json({ error: 'Bad category' });
  const k = ['before', 'after'].includes(kind) ? kind : 'photo', url = '/files/' + await saveFile(req.file);
  db.library.push({ id: uid(), cat, kind: k, pair: String(req.body.pair || 'pair').trim().slice(0, 60), url }); save(); res.json({ ok: true, url });
}));

/* ================= admin: users + client projects + document vault ================= */
app.get('/api/admin/users', admin, (req, res) => res.json(db.users.map(({ hash, ...u }) => u)));
app.delete('/api/admin/users/:id', admin, (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
  db.users = db.users.filter(u => u.id !== req.params.id); save(); res.json({ ok: true });
});
app.post('/api/admin/client-projects', admin, (req, res) => {
  const { userId, name, status, progress, update } = req.body;
  const cp = { id: uid(), userId, name, status: status || 'In progress', progress: +progress || 0, updates: update ? [{ text: update, date: Date.now() }] : [] };
  db.clientProjects.push(cp); save(); res.json(cp);
});
app.patch('/api/admin/client-projects/:id', admin, (req, res) => {
  const cp = db.clientProjects.find(x => x.id === req.params.id); if (!cp) return res.sendStatus(404);
  if (req.body.progress != null) cp.progress = Math.min(100, +req.body.progress);
  if (req.body.status) cp.status = req.body.status;
  if (req.body.update) cp.updates.unshift({ text: req.body.update, date: Date.now() });
  save(); res.json(cp);
});
app.get('/api/admin/client-projects', admin, (req, res) => res.json(db.clientProjects));
app.post('/api/admin/documents', admin, privUpload.single('file'), wrap(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'File required' });
  const d = { id: uid(), userId: req.body.userId, title: req.body.title || req.file.originalname, category: req.body.category || 'contract',
    file: await saveFile(req.file, true), original: req.file.originalname, date: Date.now() };
  db.documents.push(d); save(); res.json(d);
}));

/* ================= client portal (each client sees only their own data) ================= */
app.get('/api/portal/projects', anyUser, (req, res) => res.json(db.clientProjects.filter(c => c.userId === req.user.id)));
app.get('/api/portal/documents', anyUser, (req, res) => res.json(db.documents.filter(d => d.userId === req.user.id).map(({ file, ...d }) => d)));
app.get('/api/portal/documents/:id/download', anyUser, wrap(async (req, res) => {
  const d = db.documents.find(x => x.id === req.params.id);
  if (!d || (d.userId !== req.user.id && req.user.role !== 'admin')) return res.sendStatus(404);
  const s = await store.get(d.file); if (!s) return res.sendStatus(404);
  res.set({ 'Content-Type': db.files[d.file]?.type || 'application/octet-stream', 'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(d.original)}` });
  s.on('error', () => res.end()); s.pipe(res);
}));

/* ================= blog (SEO: server-rendered pages + sitemap) ================= */
const esc = s => String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const slugify = s => s.toLowerCase().trim().replace(/[^\w\u0590-\u05ff]+/g, '-').replace(/^-|-$/g, '') || uid().slice(0, 8);
app.get('/api/posts', (req, res) => res.json(db.posts.map(({ body, ...p }) => p)));
app.post('/api/posts', admin, (req, res) => {
  const { title, excerpt, body, lang } = req.body;
  if (!title || !body) return res.status(400).json({ error: 'title and body required' });
  const p = { id: uid(), slug: slugify(title), title, excerpt: excerpt || body.slice(0, 150), body, lang: lang || 'he', date: Date.now() };
  db.posts.unshift(p); save(); res.json(p);
});
app.get('/blog/:slug', (req, res) => {
  const p = db.posts.find(x => x.slug === req.params.slug); if (!p) return res.status(404).send('Not found');
  const ld = { '@context': 'https://schema.org', '@type': 'Article', headline: p.title, datePublished: new Date(p.date).toISOString(), publisher: { '@type': 'Organization', name: 'Yitzhak and Avi Levi Ltd.' } };
  res.send(`<!doctype html><html lang="${p.lang}" dir="${p.lang === 'he' ? 'rtl' : 'ltr'}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.excerpt)}"><link rel="canonical" href="${SITE_URL}/blog/${p.slug}">
<meta property="og:title" content="${esc(p.title)}"><meta property="og:type" content="article">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script><link rel="stylesheet" href="/css/style.css"><script>document.documentElement.dataset.theme=localStorage.theme||"dark"</script></head>
<body><nav class="crumbs"><a href="/">Home</a><span class="sep">›</span><a href="/#blog">Blog</a><span class="sep">›</span><span>${esc(p.title)}</span></nav><main class="article"><h1>${esc(p.title)}</h1>
<time>${new Date(p.date).toLocaleDateString()}</time><p>${esc(p.body).replace(/\n/g, '<br>')}</p></main></body></html>`);
});
app.get('/sitemap.xml', (req, res) => {
  res.type('xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${SITE_URL}/</loc></url>` +
    db.posts.map(p => `<url><loc>${SITE_URL}/blog/${p.slug}</loc></url>`).join('') + '</urlset>');
});
app.get('/robots.txt', (req, res) => res.type('text').send(`User-agent: *\nAllow: /\nDisallow: /admin.html\nDisallow: /portal.html\nSitemap: ${SITE_URL}/sitemap.xml`));

/* ================= lead generation: email + SMS ================= */
async function notify(l) {
  const text = `New quote request\nName: ${l.name}\nPhone: ${l.phone}\nEmail: ${l.email}\nType: ${l.type}${l.other ? ' - ' + l.other : ''}\n${l.message}`, E = process.env;
  if (E.SMTP_HOST) await nodemailer.createTransport({ host: E.SMTP_HOST, port: +E.SMTP_PORT || 587, auth: { user: E.SMTP_USER, pass: E.SMTP_PASS } })
    .sendMail({ from: E.SMTP_USER, to: E.OWNER_EMAIL, subject: `New lead: ${l.name}`, text });
  if (E.TWILIO_SID) await fetch(`https://api.twilio.com/2010-04-01/Accounts/${E.TWILIO_SID}/Messages.json`, { method: 'POST',
    headers: { Authorization: 'Basic ' + Buffer.from(`${E.TWILIO_SID}:${E.TWILIO_TOKEN}`).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ To: E.OWNER_PHONE, From: E.TWILIO_FROM, Body: text.slice(0, 300) }) });
}
app.post('/api/leads', leadLimiter, wrap(async (req, res) => {
  const { name, phone, email = '', type = '', message = '', other = '' } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'Name and phone required' });
  const l = { id: uid(), name, phone, email, type, other: String(other).slice(0, 200), message, date: Date.now() };
  db.leads.push(l); save();
  try { await notify(l); } catch (e) { console.error('Notify failed:', e.message); }   // awaited: serverless can freeze after the response
  res.json({ ok: true });
}));
app.get('/api/admin/leads', admin, (req, res) => res.json(db.leads));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 500).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 4MB)' : 'Server error' });
});

module.exports = app;                                              // Vercel imports the app
if (!ON_VERCEL) app.listen(PORT, () => console.log(`Site running on http://localhost:${PORT}`));
