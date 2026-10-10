document.documentElement.dataset.theme=localStorage.theme||"dark";
const getToken = () => localStorage.getItem('token');
async function api(url, opts = {}) {
  const h = { ...(opts.headers || {}) };
  if (getToken()) h.Authorization = 'Bearer ' + getToken();
  if (opts.body && !(opts.body instanceof FormData)) { h['Content-Type'] = 'application/json'; opts.body = JSON.stringify(opts.body); }
  const r = await fetch(url, { ...opts, headers: h });
  if (r.status === 401) { localStorage.clear(); location.href = '/'; return; }
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'Request failed');
  return d;
}
