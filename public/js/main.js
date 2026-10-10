const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const WHATSAPP = '972537155953';
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const TOUCH = matchMedia('(hover:none)').matches, lock = on => document.body.classList.toggle('noscroll', on);
const go = sel => $(sel)?.scrollIntoView({ behavior: 'smooth' });

/* ---------- i18n ---------- */
const T = { en: {
  creds:'Verified Company', cno:'Company No.', cls:'Registered Contractor', brand:'Yitzhak & Avi Levi Ltd.',
  n_services:'Services', n_projects:'Projects', n_reviews:'Reviews', n_faq:'FAQ', n_map:'Service Area', n_about:'About', n_contact:'Contact', login:'Sign in',
  h1a:'Building trust.', h1b:'From foundation to finish.', hp:'Residential construction, commercial infrastructure and renovations – with full transparency at every step.',
  cta1:'Get a quote', cta2:'See our projects', svcsub:'Choose a field', t_res:'Residential', t_com:'Commercial Infrastructure', t_ren:'Renovations', t_oth:'Other',
  r1:'Villas & private homes', r1d:'End-to-end planning and execution.', r2:'Apartment buildings', r2d:'Urban renewal and multi-unit projects.',
  c1:'Offices & industrial', c1d:'Commercial and industrial buildings.', c2:'Roads & infrastructure', c2d:'Development, drainage and utilities.',
  n1:'Apartment renovation', n1d:'Full or partial renovation.', n2:'Extensions', n2d:'Additions, safe rooms and new rooms.',
  psub:'Click a project for details', all:'All', rsub:'What our clients say', fsub:'Quick answers to common questions', msub:'Across the country',
  bsub:'Regulations, trends and tips', csub:'We will get back to you shortly', ph_name:'Full name', ph_phone:'Phone', ph_msg:'Tell us about your project',
  ph_other:'Please describe your project type', ph_search:'Search…', send:'Send request', home:'Home', nores:'No results', call:'Call', asub:'Who we are',
  ap1:'Yitzhak & Avi Levi Ltd. is a construction and infrastructure company working in three fields: residential construction, commercial infrastructure and renovations. We accompany every project from first planning to handing over the keys – with professional work, compliance with standards and clear schedules.',
  ap2:'We believe building starts with trust. That is why every client gets a personal area on this site where they can follow project progress, receive updates and keep contracts, plans and permits in one place.',
  v1t:'Full transparency', v1d:'Progress updates and documents are available to you at any hour in your personal area.',
  v2t:'Professional work', v2d:'Registered contractor, organized planning and execution according to standards and permits.',
  v3t:'Every type of project', v3d:'From a private home to commercial infrastructure – the same team and the same level of service.' } };
T.he = { home: 'ראשי', nores: 'לא נמצאו תוצאות' };
$$('[data-i18n]').forEach(e => T.he[e.dataset.i18n] ||= e.textContent);
$$('[data-i18n-ph]').forEach(e => T.he[e.dataset.i18nPh] ||= e.placeholder);
const MSG = { name: ['נא להזין שם (2 תווים לפחות)', 'Enter a name (2+ characters)'], phone: ['מספר נייד לא תקין (למשל 053-7155953)', 'Invalid mobile (e.g. 053-7155953)'],
  email: ['כתובת אימייל לא תקינה', 'Invalid email'], other: ['נא לפרט את סוג הפרויקט', 'Please describe the project type'], password: ['לפחות 8 תווים', 'At least 8 characters'] };
let lang = localStorage.lang || 'he';
const loc = v => v && typeof v === 'object' ? v[lang] : v;

/* ---------- placeholder content: EDIT / REPLACE with real data ---------- */
const FAQ = { he: [
  ['כמה זמן לוקח פרויקט בנייה?', 'משך הפרויקט תלוי בהיקף, בהיתרים ובמורכבות. לאחר פגישת היכרות נגדיר לוח זמנים מפורט.'],
  ['איך אפשר לקבל הצעת מחיר?', 'מלאו את טופס יצירת הקשר או שלחו הודעה בוואטסאפ, ונחזור אליכם בהקדם ללא התחייבות.'],
  ['איך אעקוב אחר התקדמות הפרויקט שלי?', 'לכל לקוח יש אזור אישי באתר עם אחוזי התקדמות, עדכונים ומסמכים (חוזים, תוכניות והיתרים).'],
  ['באילו אזורים אתם פועלים?', 'ראו את המפה באתר – אנחנו פועלים במרכז, בדרום ובצפון הארץ.'],
  ['האם אתם מבצעים גם שיפוצים קטנים?', 'כן, אנחנו מבצעים פרויקטים בכל קנה מידה, משיפוץ דירה ועד תשתיות מסחריות.'] ],
  en: [
  ['How long does a construction project take?', 'It depends on scope, permits and complexity. After an intro meeting we will define a detailed schedule.'],
  ['How can I get a quote?', 'Fill in the contact form or message us on WhatsApp and we will get back to you with no obligation.'],
  ['How do I track my project?', 'Every client has a personal portal with progress, updates and documents (contracts, plans and permits).'],
  ['Which areas do you serve?', 'See the map on this page – we work in the center, south and north of the country.'],
  ['Do you handle small renovations too?', 'Yes – projects of every size, from an apartment renovation to commercial infrastructure.'] ] };
const TM = [ // sample testimonials – replace with real client quotes
  { he: 'עבודה מקצועית, שקיפות מלאה ועמידה בלוח הזמנים.', en: 'Professional work, full transparency and on-schedule delivery.', a: { he: 'לקוח פרטי · דוגמה', en: 'Private client · sample' } },
  { he: 'האזור האישי איפשר לנו לעקוב אחרי כל שלב בבנייה.', en: 'The client portal let us follow every stage of the build.', a: { he: 'בעלי וילה · דוגמה', en: 'Villa owner · sample' } },
  { he: 'שיפוץ מושלם, צוות אדיב ונקי בעבודה.', en: 'A flawless renovation with a courteous, tidy crew.', a: { he: 'לקוחות שיפוץ · דוגמה', en: 'Renovation clients · sample' } } ];
const CITIES = [['אשדוד / Ashdod', 31.804, 34.655], ['תל אביב / Tel Aviv', 32.085, 34.782], ['ירושלים / Jerusalem', 31.768, 35.214], ['חיפה / Haifa', 32.794, 34.99],
  ['באר שבע / Beer Sheva', 31.253, 34.791], ['נתניה / Netanya', 32.332, 34.856], ['ראשון לציון / Rishon LeZion', 31.973, 34.789], ['אשקלון / Ashkelon', 31.669, 34.574]];

/* ---------- photo library: real photos from public/img/<res|com|ren>/ (+ illustrated fallbacks) ---------- */
let LIB = { res: [], com: [], ren: [], pairs: [] };
const PAL = [['#16233a', '#c9a44c', '#e8c76a'], ['#10303a', '#d9822b', '#f0b429'], ['#26202e', '#4fa3a5', '#8ed1c8'], ['#2d1b2e', '#c97b84', '#f2b5a0']];
const svgURI = s => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
function art(cat, v = 0, stage = 'after') {
  const [bg, a, b] = PAL[v % PAL.length], H = cat === 'ren' ? 400 : 400 + (v % 3) * 100; let g = '';
  if (cat === 'res') g = `<polygon points="170,190 400,70 630,190" fill="${a}"/><rect x="200" y="190" width="400" height="150" fill="#f4efe4"/><rect x="250" y="225" width="70" height="70" fill="${bg}"/><rect x="480" y="225" width="70" height="70" fill="${bg}"/><rect x="365" y="250" width="70" height="90" fill="${b}"/><circle cx="690" cy="90" r="34" fill="${b}"/><rect x="90" y="270" width="14" height="70" fill="#5a3b22"/><circle cx="97" cy="255" r="40" fill="#3f7d4e"/><rect y="340" width="800" height="60" fill="#2f5d3a"/>`;
  else if (cat === 'com') g = [[80, 120, 220], [220, 90, 150], [330, 150, 270], [500, 110, 180], [630, 100, 130]].map(([x, w, h]) => {
    let win = ''; for (let r = 0; r < h / 30 - 1; r++) for (let c = 0; c < w / 28 - .5; c++) win += `<rect x="${x + 10 + c * 28}" y="${340 - h + 14 + r * 30}" width="14" height="16" fill="${(r + c + v) % 3 ? b : '#ffffff66'}"/>`;
    return `<rect x="${x}" y="${340 - h}" width="${w}" height="${h}" fill="${a}" opacity=".9"/>${win}`; }).join('') + `<rect y="340" width="800" height="60" fill="#222"/><rect y="366" width="800" height="4" fill="#ddd" opacity=".5"/>`;
  else {
    const bef = stage === 'before';
    g = `<rect width="800" height="300" fill="${bef ? '#7b7466' : '#efe7d6'}"/><rect y="300" width="800" height="100" fill="${bef ? '#3d3830' : '#a67c52'}"/>` + (bef
      ? `<polygon points="120,40 220,60 190,150 100,120" fill="#8d8575"/><polygon points="560,120 680,100 700,210 600,230" fill="#6a6356"/><line x1="400" y1="0" x2="400" y2="90" stroke="#222" stroke-width="3"/><circle cx="400" cy="100" r="12" fill="#ffe9a8"/><rect x="560" y="250" width="40" height="50" fill="#b04a3a"/><path d="M80 300 L110 120 M130 300 L160 120 M95 200 H145 M105 160 H155 M90 250 H140" stroke="#c9a44c" stroke-width="6" fill="none"/>`
      : `<rect x="470" y="60" width="240" height="160" fill="#bfe3f5" stroke="${a}" stroke-width="8"/><line x1="590" y1="60" x2="590" y2="220" stroke="${a}" stroke-width="6"/><rect x="90" y="220" width="280" height="90" rx="18" fill="${a}"/><rect x="90" y="190" width="280" height="50" rx="14" fill="${b}"/><rect x="120" y="70" width="110" height="80" fill="${bg}" stroke="${b}" stroke-width="6"/><rect x="420" y="250" width="14" height="70" fill="#444"/><circle cx="427" cy="240" r="26" fill="#ffe9a8"/><rect x="640" y="250" width="40" height="60" fill="#b5651d"/><circle cx="660" cy="235" r="34" fill="#3f7d4e"/>`);
  }
  const sky = cat === 'ren' ? '' : '<rect width="800" height="400" fill="url(#s)"/>';
  return svgURI(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 ${H}"><defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg}"/><stop offset="1" stop-color="${a}" stop-opacity=".55"/></linearGradient></defs><rect width="800" height="${H}" fill="${bg}"/><g transform="translate(0,${H - 400})">${sky}${g}</g></svg>`);
}
const photo = (cat, i) => LIB[cat].length ? LIB[cat][i % LIB[cat].length] : art(cat, i);
const skel = i => {
  if (i.complete && i.naturalWidth) { i.classList.remove('sk'); return; }
  i.classList.add('sk'); i.onload = () => i.classList.remove('sk');
  i.onerror = () => { i.onerror = null; i.classList.remove('sk'); i.src = art(i.dataset.cat || 'res', +i.dataset.n || 0); };
};
const setImg = (el, src) => { el.src = src; skel(el); };
const anim = (els, cls = 'in-a') => els.forEach((d, i) => { d.style.setProperty('--i', i); d.classList.remove('out-a', 'in-a'); void d.offsetWidth; d.classList.add(cls); });
function showTab(t, first) {
  const cur = $('.svc.show'), apply = () => {
    $$('[data-tab]').forEach(x => x.classList.toggle('active', x.dataset.tab === t));
    $$('.svc').forEach(s => s.classList.toggle('show', s.id === t));
    const st = $('#strip'); st.classList.remove('out-a'); st.innerHTML = [0, 1, 2, 3].map(() => '<img alt="">').join('');
    $$('#strip img').forEach((e, i) => { e.dataset.cat = t; e.dataset.n = i + 2; setImg(e, photo(t, i + 2)); });
    anim($$('.svc.show>div')); anim($$('#strip img'));
  };
  if (cur && !first && cur.id !== t) { $$('.svc.show>div').forEach(d => d.classList.add('out-a')); $('#strip').classList.add('out-a'); setTimeout(apply, 280); } else apply();
}
$$('[data-tab]').forEach(b => b.onclick = () => showTab(b.dataset.tab));

/* ---------- projects gallery ---------- */
const TTL = { res: [['וילה פרטית', 'Private villa'], ['בניין מגורים', 'Residential building']], com: [['בניין משרדים', 'Office building'], ['עבודות תשתית', 'Infrastructure works']] };
function buildSamples() {
  const out = [], mk = (id, type, he, en, imgs, k) => ({ id, sample: true, type, title: { he, en }, location: 'Ashdod', duration: { he: `${k * 2 + 4} חודשים`, en: `${k * 2 + 4} months` },
    scope: { he: 'פרויקט לדוגמה – העלו תמונות ופרויקטים אמיתיים מלוח הניהול.', en: 'Sample project – upload real photos and projects from the admin panel.' },
    testimonial: { text: { he: 'עבודה מצוינת!', en: 'Excellent work!' }, author: 'Client' }, images: imgs });
  ['res', 'com'].forEach((cat, ci) => TTL[cat].forEach(([he, en], j) => out.push(mk('s' + (ci * 2 + j), cat, he, en, [0, 1, 2].map(n => photo(cat, j * 3 + n)), ci * 2 + j))));
  const pairs = LIB.pairs.length ? LIB.pairs : [0, 1].map(v => ({ before: art('ren', v, 'before'), after: art('ren', v, 'after') }));
  pairs.forEach((pr, i) => { const nm = pr.name || null, p = mk('sr' + i, 'ren', nm || (i % 2 ? 'שיפוץ מטבח' : 'שיפוץ סלון'), nm || (i % 2 ? 'Kitchen renovation' : 'Living room renovation'), [pr.after, ...[1, 2].map(n => photo('ren', i * 3 + n))], i + 4);
    p.before = pr.before; p.after = pr.after; out.push(p); });
  return out;
}
let projects = [], posts = [], filter = 'all', loading = true;
function renderGallery() {
  $('#gallery').innerHTML = loading ? [220, 300, 250, 320, 240, 280].map(h => `<div class="skc sk" style="height:${h}px"></div>`).join('') :
    projects.filter(p => filter === 'all' || p.type === filter).map(p =>
      `<div class="pcard" tabindex="0" data-id="${p.id}">${p.before && p.after ? `<span class="badge">⇆ ${lang === 'he' ? 'לפני / אחרי' : 'Before / After'}</span>` : ''}<img data-cat="${p.type}" loading="lazy" src="${esc(p.images[0] || p.after || '')}" alt=""><div class="cap"><small>${T[lang]['t_' + p.type] || ''}</small><h3>${esc(loc(p.title))}</h3></div></div>`).join('');
  $$('#gallery img').forEach(skel); anim($$('.pcard'));
  $$('.pcard').forEach(c => { c.onclick = () => openProject(c.dataset.id); c.onkeydown = e => e.key === 'Enter' && openProject(c.dataset.id); });
}
function swapGallery() {
  const cs = $$('.pcard'); if (!cs.length || loading) return renderGallery();
  cs.forEach(c => c.classList.add('out-a')); setTimeout(renderGallery, 300);
}
$$('[data-f]').forEach(b => b.onclick = () => { if (filter === b.dataset.f) return; filter = b.dataset.f; $$('[data-f]').forEach(x => x.classList.toggle('active', x === b)); swapGallery(); });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const getJSON = async u => { try { const r = await fetch(u); return r.ok ? await r.json() : null; } catch { return null; } };  // never trust an error reply
async function loadAll() {
  try {
    const lib = await getJSON('/api/library');
    if (lib && Array.isArray(lib.res)) LIB = { res: lib.res || [], com: lib.com || [], ren: lib.ren || [], pairs: lib.pairs || [] };
    $$('img[data-cat]').forEach(e => setImg(e, photo(e.dataset.cat, +e.dataset.n))); showTab('res', true);
    const pj = await getJSON('/api/projects'); projects = Array.isArray(pj) ? pj : [];
    await sleep(400); if (!projects.length) projects = buildSamples();
  } catch (e) { console.error(e); try { projects = buildSamples(); } catch { projects = []; } }
  loading = false; renderGallery(); renderBaFeature();
}
function closeModal() { const m = $('#modal'); if (!m.classList.contains('open')) return; m.classList.add('closing'); setTimeout(() => m.classList.remove('open', 'closing'), 250); lock(false); }
function sweep(box, set, delay = 600) { // intro animation that shows how the slider works
  let t0 = null, stop = false; const k = [50, 8, 92, 50]; box.addEventListener('pointerdown', () => stop = true, { once: true });
  const step = ts => { if (stop) return; t0 ??= ts; const e = (ts - t0) / 2200; if (e >= 1) return set(50); const x = e * 3, i = Math.floor(x), f = x - i, s = f * f * (3 - 2 * f); set(k[i] + (k[i + 1] - k[i]) * s); requestAnimationFrame(step); };
  setTimeout(() => requestAnimationFrame(step), delay);
}
const baMarkup = (p, id, he) => `<div class="ba" id="${id}"><img class="aft" src="${esc(p.after)}" alt=""><img class="bef" src="${esc(p.before)}" alt=""><span class="tag b">${he ? 'לפני' : 'Before'}</span><span class="tag a">${he ? 'אחרי' : 'After'}</span><div class="line"><i>⇆</i></div><input type="range" min="0" max="100" value="50" aria-label="Before and after"></div>`;
function bindBA(bx, auto = true) {
  const r = $('input', bx), set = v => { bx.style.setProperty('--p', v + '%'); r.value = v; };
  r.oninput = () => set(r.value); if (auto) sweep(bx, set); return set;
}
function renderBaFeature() { // featured before/after slider, shown right inside the Projects section
  const box = $('#baFeat'), p = projects.find(x => x.before && x.after), he = lang === 'he';
  if (!p) { box.hidden = true; return; }
  box.hidden = false;
  box.innerHTML = `<div><h3>${he ? 'הטרנספורמציה – לפני / אחרי' : 'The transformation – Before / After'}</h3><p>${esc(loc(p.title))} · ${he ? 'גררו את הקו כדי לראות את השינוי' : 'drag the line to see the change'}</p></div>${baMarkup(p, 'baF', he)}`;
  const bx = $('#baF'), set = bindBA(bx, false);
  new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { o.disconnect(); sweep(bx, set, 300); } }, { threshold: .5 }).observe(bx);
}
function openProject(id) {
  const p = projects.find(x => x.id === id); if (!p) return;
  const imgs = p.images.length ? p.images : [p.after], n = imgs.length, he = lang === 'he'; let k = 0; const mb = $('#mBody');
  const ba = p.before && p.after ? `<h3 style="color:var(--gold);margin-top:18px">${he ? 'לפני / אחרי – גררו את הסליידר' : 'Before / After – drag the slider'}</h3>${baMarkup(p, 'ba', he)}` : '';
  mb.innerHTML = `<h2>${esc(loc(p.title))}</h2><div class="car" style="margin-top:14px"><img id="cImg" alt="">${n > 1 ? `<button class="cb p" aria-label="Previous"><span class="ar">❮</span></button><button class="cb n" aria-label="Next"><span class="ar">❯</span></button><div class="dots">${imgs.map(() => '<i></i>').join('')}</div>` : ''}</div>${ba}
    <div class="facts"><span><b>📍</b> ${esc(p.location)}</span><span><b>⏱</b> ${esc(loc(p.duration))}</span></div><p>${esc(loc(p.scope))}</p>
    ${p.testimonial?.text ? `<blockquote>“${esc(loc(p.testimonial.text))}”<br>— ${esc(p.testimonial.author)}</blockquote>` : ''}`;
  const show = i => { k = (i + n) % n; const im = $('#cImg'); im.dataset.cat = p.type; im.classList.remove('f'); void im.offsetWidth; im.classList.add('f'); setImg(im, imgs[k]); $$('.dots i', mb).forEach((d, j) => d.classList.toggle('on', j === k)); };
  show(0); if (n > 1) { $('.cb.n', mb).onclick = () => show(k + 1); $('.cb.p', mb).onclick = () => show(k - 1); $$('.dots i', mb).forEach((d, j) => d.onclick = () => show(j)); }
  const bx = $('#ba'); if (bx) bindBA(bx);
  $('#modal').classList.remove('closing'); $('#modal').classList.add('open'); lock(true);
}
$('#mClose').onclick = closeModal; $('#modal').onclick = e => e.target.id === 'modal' && closeModal();
addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); $('#authModal').classList.remove('open'); lock(false); $('#sug').hidden = true; } });

/* ---------- testimonials carousel ---------- */
let ti = 0, tt;
function renderTm(i = ti) {
  ti = (i + TM.length) % TM.length; const t = TM[ti];
  $('#tm').innerHTML = `<button class="cb p" aria-label="Previous"><span class="ar">❮</span></button><div class="q">“${esc(t[lang])}”</div><div class="a">— ${esc(t.a[lang])}</div>
    <button class="cb n" aria-label="Next"><span class="ar">❯</span></button><div class="dots st">${TM.map((_, j) => `<i class="${j === ti ? 'on' : ''}"></i>`).join('')}</div>`;
  $('#tm .n').onclick = () => { renderTm(ti + 1); auto(); }; $('#tm .p').onclick = () => { renderTm(ti - 1); auto(); };
  $$('#tm .dots i').forEach((d, j) => d.onclick = () => { renderTm(j); auto(); });
}
const auto = () => { clearInterval(tt); tt = setInterval(() => renderTm(ti + 1), 6000); };

/* ---------- FAQ accordion ---------- */
function renderFaq() {
  $('#faqBox').innerHTML = FAQ[lang].map(([q, a]) => `<details><summary>${esc(q)}</summary><div class="ans"><p>${esc(a)}</p></div></details>`).join('');
  $$('#faqBox details').forEach(d => d.ontoggle = () => d.open && $$('#faqBox details').forEach(o => o !== d && (o.open = false)));
}

/* ---------- map (CARTO tiles; OSM blocks requests without a referrer) ---------- */
let map, tiles, pi = 0, errs = 0;
const PROV = [['https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap contributors' }],
  ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Tiles © Esri' }]];
function setTiles() { // OSM needs a referrer (set in server + here); falls back to Esri if tiles fail
  if (!map) return; tiles && map.removeLayer(tiles); errs = 0;
  const [u, o] = PROV[pi]; tiles = L.tileLayer(u, { ...o, referrerPolicy: 'origin' }).addTo(map);
  tiles.on('tileerror', () => { if (++errs >= 4 && pi < PROV.length - 1) { pi++; setTiles(); } });
  $('#mapEl').classList.toggle('dark-map', document.documentElement.dataset.theme === 'dark');
}
try {
  map = L.map('mapEl', { scrollWheelZoom: false, dragging: !L.Browser.mobile }).setView([31.9, 34.9], 8);
  CITIES.forEach(([n, a, b]) => { L.circle([a, b], { radius: 9000, color: '#c9a44c', fillOpacity: .25 }).addTo(map); L.marker([a, b]).addTo(map).bindPopup(n); });
  new IntersectionObserver(es => es[0].isIntersecting && setTimeout(() => map.invalidateSize(), 1100)).observe($('#mapEl'));
  addEventListener('load', () => map.invalidateSize()); addEventListener('resize', () => map.invalidateSize());
} catch { $('#mapEl').innerHTML = '<p class="sub" style="padding:20px">Map unavailable – check your internet connection.</p>'; }

/* ---------- inline validation ---------- */
function bindValidate(form, rules) {
  const chk = (el, force) => {
    const f = el.closest('.fld'); if (!f || f.hidden) return true;
    const v = el.value, ok = !!rules[el.name](v, form), show = force || v !== '';
    f.classList.toggle('ok', show && ok && v !== ''); f.classList.toggle('bad', show && !ok);
    let h = f.querySelector('.hint'); if (!h) { h = document.createElement('small'); h.className = 'hint'; f.append(h); }
    h.textContent = show && !ok ? MSG[el.name][lang === 'he' ? 0 : 1] : ''; return ok;
  };
  form.addEventListener('input', e => rules[e.target.name] && chk(e.target));
  return () => Object.keys(rules).map(n => chk(form.elements[n], true)).every(Boolean);
}
const EMAIL = v => /^\S+@\S+\.\S+$/.test(v);
const lf = $('#leadForm');
const validLead = bindValidate(lf, { name: v => v.trim().length >= 2, phone: v => /^(\+972|0)5\d{8}$/.test(v.replace(/[\s-]/g, '')), email: v => !v || EMAIL(v),
  other: (v, f) => f.elements.type.value !== 'oth' || v.trim().length > 1 });
$('#typeSel').onchange = e => { $('#otherFld').hidden = e.target.value !== 'oth'; if (e.target.value === 'oth') lf.elements.other.focus(); };
lf.onsubmit = async e => {
  e.preventDefault(); if (!validLead()) return;
  try { await api('/api/leads', { method: 'POST', body: Object.fromEntries(new FormData(lf)) }); lf.reset(); $('#otherFld').hidden = true; $$('.fld', lf).forEach(f => f.classList.remove('ok', 'bad'));
    $('#leadMsg').textContent = lang === 'he' ? 'תודה! נחזור אליכם בקרוב.' : 'Thank you! We will contact you soon.'; }
  catch (er) { $('#leadMsg').textContent = er.message; }
};

/* ---------- auto-suggest search ---------- */
const sections = () => [['#about', 'n_about'], ['#services', 'n_services'], ['#projects', 'n_projects'], ['#reviews', 'n_reviews'], ['#faq', 'n_faq'], ['#map', 'n_map'], ['#contact', 'n_contact']];
function searchIndex() {
  const o = [];
  $$('.svc h3').forEach(h => o.push({ i: '🛠', l: h.textContent, f: () => { showTab(h.closest('.svc').id); go('#services'); } }));
  projects.forEach(p => o.push({ i: '🏗', l: loc(p.title), f: () => { go('#projects'); openProject(p.id); } }));
  FAQ[lang].forEach(([q], i) => o.push({ i: '❓', l: q, f: () => { go('#faq'); $$('#faqBox details')[i].open = true; } }));
  sections().forEach(([s, k]) => o.push({ i: '📍', l: T[lang][k], f: () => go(s) }));
  return o;
}
let hits = [], act = -1; const sug = $('#sug');
const drawSug = () => { sug.innerHTML = hits.length ? hits.map((h, i) => { const q = $('#q').value.trim().toLowerCase(), p = h.l.toLowerCase().indexOf(q);
  return `<li data-i="${i}" class="${i === act ? 'on' : ''}">${h.i} ${esc(h.l.slice(0, p))}<mark>${esc(h.l.slice(p, p + q.length))}</mark>${esc(h.l.slice(p + q.length))}</li>`; }).join('') : `<li>${T[lang].nores}</li>`; };
const pick = i => { const h = hits[i]; if (!h) return; sug.hidden = true; closeMenu(); $('#q').value = ''; h.f(); };
$('#q').oninput = e => { const q = e.target.value.trim().toLowerCase(); act = -1; if (!q) { sug.hidden = true; return; }
  hits = searchIndex().filter(x => x.l.toLowerCase().includes(q)).slice(0, 7); sug.hidden = false; drawSug(); };
$('#q').onkeydown = e => { if (sug.hidden) return;
  if (e.key === 'ArrowDown') { act = Math.min(act + 1, hits.length - 1); drawSug(); e.preventDefault(); }
  if (e.key === 'ArrowUp') { act = Math.max(act - 1, 0); drawSug(); e.preventDefault(); }
  if (e.key === 'Enter') pick(act < 0 ? 0 : act); };
sug.onmousedown = e => { const li = e.target.closest('li[data-i]'); li && pick(+li.dataset.i); };
document.addEventListener('click', e => { if (!e.target.closest('.search')) sug.hidden = true; });

/* ---------- breadcrumbs, scroll effects ---------- */
let cur = null;
const crumb = () => { $('#crumbs').innerHTML = `<a href="#top">${T[lang].home}</a>` + (cur ? `<span class="sep">›</span><a href="${cur[0]}">${T[lang][cur[1]]}</a>` : ''); };
const setHH = () => document.documentElement.style.setProperty('--hh', $('header').offsetHeight + 'px');
addEventListener('resize', setHH);
addEventListener('scroll', () => {
  if (!TOUCH) $('#heroBg').style.transform = `translateY(${scrollY * .35}px)`; $('#topBtn').classList.toggle('show', scrollY > 600);
  const mid = innerHeight * .4; let f = null;
  sections().forEach(s => { const r = $(s[0]).getBoundingClientRect(); if (r.top <= mid && r.bottom > mid) f = s; });
  if (f?.[0] !== cur?.[0]) { cur = f; crumb(); }
}, { passive: true });
$('#topBtn').onclick = () => scrollTo({ top: 0, behavior: 'smooth' });
const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && e.target.classList.add('in')), { threshold: .12 });
$$('.reveal').forEach(e => io.observe(e));
window.addEventListener('load', () => { setTimeout(() => $('#loader').classList.add('done'), 900); setHH(); });

/* ---------- micro-interactions: ripple + spin ---------- */
document.addEventListener('pointerdown', e => {
  const b = e.target.closest('.btn,.cb,.top-btn,.wa'); if (!b) return;
  const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height), s = document.createElement('span');
  s.className = 'rip'; s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
  b.append(s); setTimeout(() => s.remove(), 600);
});
const spin = el => { el.classList.remove('spin'); void el.offsetWidth; el.classList.add('spin'); };

/* ---------- theme + language ---------- */
function setTheme(t) { document.documentElement.dataset.theme = t; localStorage.theme = t; $('#themeBtn').textContent = t === 'dark' ? '☀' : '🌙'; setTiles(); }
$('#themeBtn').onclick = () => { spin($('#themeBtn')); setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'); };
function setLang(l) {
  lang = l; localStorage.lang = l; document.documentElement.lang = l; document.documentElement.dir = l === 'he' ? 'rtl' : 'ltr';
  $$('[data-i18n]').forEach(e => e.textContent = T[l][e.dataset.i18n] ?? e.textContent);
  $$('[data-i18n-ph]').forEach(e => e.placeholder = T[l][e.dataset.i18nPh] ?? e.placeholder);
  $('#langBtn').textContent = l === 'he' ? 'EN' : 'עב';
  $('#wa').href = $('#mwa').href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(l === 'he' ? 'שלום, אשמח לקבל הצעת מחיר' : 'Hello, I would like a quote')}`;
  renderGallery(); renderBaFeature(); renderTm(); auto(); renderFaq(); crumb(); updAuth();
}
$('#langBtn').onclick = () => { spin($('#langBtn')); setLang(lang === 'he' ? 'en' : 'he'); };

/* ---------- auth modal (with password strength) ---------- */
function updAuth() {
  const b = $('#authBtn'), t = localStorage.token;
  b.textContent = t ? (lang === 'he' ? 'האזור שלי' : 'My Portal') : (lang === 'he' ? 'כניסה' : 'Sign in');
  b.onclick = () => { closeMenu(); t ? (location.href = localStorage.role === 'admin' ? '/admin.html' : '/portal.html') : showAuth(); };
}
const strength = p => Math.min(4, (p.length >= 8) + (p.length >= 12) + (/[A-Z]/.test(p) && /[a-z]/.test(p)) + /\d/.test(p) + /[^\w\s]/.test(p));
function showAuth() {
  const he = lang === 'he'; let mode = 'login'; const m = $('#authModal'); m.classList.add('open'); lock(true);
  const draw = () => {
    const su = mode === 'signup';
    m.innerHTML = `<div class="mbox" style="max-width:400px"><button class="x" id="aX">×</button><h2>${su ? (he ? 'הרשמה' : 'Sign up') : (he ? 'כניסה' : 'Sign in')}</h2><br>
    <form id="aF" novalidate style="display:grid;gap:10px">${su ? `<div class="fld"><input name="name" placeholder="${he ? 'שם מלא' : 'Full name'}"></div>` : ''}
    <div class="fld"><input name="email" type="email" placeholder="Email"></div><div class="fld"><input name="password" type="password" placeholder="${he ? 'סיסמה (8+ תווים)' : 'Password (8+ chars)'}"></div>
    ${su ? '<div class="meter"><i></i></div><small id="pwT"></small>' : ''}<button class="btn solid">${he ? 'שלח' : 'Submit'}</button><p class="msg" id="aM"></p>
    <a href="#" id="aS" style="color:var(--gold)">${su ? (he ? 'יש חשבון? כניסה' : 'Have an account? Sign in') : (he ? 'אין חשבון? הרשמה' : 'No account? Sign up')}</a></form></div>`;
    $('#aX').onclick = () => { m.classList.remove('open'); lock(false); }; $('#aS').onclick = e => { e.preventDefault(); mode = su ? 'login' : 'signup'; draw(); };
    const valid = bindValidate($('#aF'), { email: EMAIL, password: v => su ? v.length >= 8 : v.length > 0, ...(su ? { name: v => v.trim().length >= 2 } : {}) });
    if (su) $('#aF').password.addEventListener('input', e => { const s = strength(e.target.value), L = he ? ['חלשה מאוד', 'חלשה', 'סבירה', 'טובה', 'חזקה'] : ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'];
      const i = $('.meter i'); i.style.width = e.target.value ? (s + 1) * 20 + '%' : '0'; i.style.background = ['#e74c3c', '#e67e22', '#f1c40f', '#9acd32', '#2ecc71'][s]; $('#pwT').textContent = e.target.value ? L[s] : ''; });
    $('#aF').onsubmit = async e => {
      e.preventDefault(); if (!valid()) return;
      try { const d = await api('/api/auth/' + mode, { method: 'POST', body: Object.fromEntries(new FormData(e.target)) });
        localStorage.token = d.token; localStorage.role = d.role; localStorage.uname = d.name; location.href = d.role === 'admin' ? '/admin.html' : '/portal.html'; }
      catch (er) { $('#aM').textContent = er.message; }
    };
  }; draw();
}

/* ---------- hero: slider / video background (media from public/img/hero/, else photo + animated crane scene) ---------- */
async function initHero() {
  const box = $('#slides'), dots = $('#hdots'), reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, save = navigator.connection?.saveData;
  let media = await getJSON('/api/hero'); media = Array.isArray(media) ? media.filter(x => !(x.type === 'video' && (reduce || save))) : [];
  const items = media.length ? media : [{ type: 'image', url: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1800' }, { type: 'scene' }];
  box.innerHTML = items.map(x => x.type === 'video' ? `<div class="slide"><video muted loop playsinline preload="metadata" src="${esc(x.url)}"></video></div>` :
    x.type === 'image' ? `<div class="slide"><img alt="" src="${esc(x.url)}"></div>` : '<div class="slide"></div>').join('');
  const sl = $$('.slide', box); dots.innerHTML = items.map(() => '<i></i>').join(''); dots.hidden = items.length < 2; let k = 0, t;
  const show = i => { k = (i + items.length) % items.length;
    sl.forEach((s, j) => { s.classList.toggle('on', j === k); const v = $('video', s); if (v) j === k ? v.play().catch(() => { }) : v.pause(); });
    $$('i', dots).forEach((d, j) => d.classList.toggle('on', j === k)); };
  const run = () => { clearInterval(t); if (items.length > 1 && !reduce) t = setInterval(() => show(k + 1), 7000); };
  $$('i', dots).forEach((d, j) => d.onclick = () => { show(j); run(); });
  document.addEventListener('visibilitychange', () => document.hidden ? clearInterval(t) : run());
  show(0); run();
}
addEventListener('scroll', () => { $('#prog').style.transform = `scaleX(${Math.min(1, scrollY / Math.max(1, document.body.scrollHeight - innerHeight))})`; }, { passive: true });

/* ---------- mobile menu ---------- */
function closeMenu() { $('#mainNav').classList.remove('open'); $('#menuBtn').setAttribute('aria-expanded', 'false'); $('#menuBtn').textContent = '☰'; }
$('#menuBtn').onclick = () => { const o = $('#mainNav').classList.toggle('open'); $('#menuBtn').setAttribute('aria-expanded', o); $('#menuBtn').textContent = o ? '✕' : '☰'; };
$('#mainNav').addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
initHero(); showTab('res'); setTheme(document.documentElement.dataset.theme || 'dark'); renderGallery(); loadAll(); setLang(lang);
