// Small developer tools. Each block only runs on the page that has its markup. Nothing is sent anywhere.
(() => {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Copy buttons: <button data-copy-from="id">
  document.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-copy-from]');
    if (!b) return;
    const src = $(b.dataset.copyFrom);
    const text = 'value' in src && src.tagName !== 'OUTPUT' ? src.value : src.textContent;
    const label = b.textContent;
    try { await navigator.clipboard.writeText(text); b.textContent = 'Copied'; } catch { b.textContent = 'Select and copy'; }
    setTimeout(() => { b.textContent = label; }, 1500);
  });

  // ---------- Regex tester ----------
  if ($('rx-pattern')) {
    const pattern = $('rx-pattern'); const flags = $('rx-flags'); const text = $('rx-text'); const view = $('rx-view'); const info = $('rx-info'); const groups = $('rx-groups');
    const run = () => {
      let re;
      try { re = new RegExp(pattern.value, flags.value.includes('g') ? flags.value : `${flags.value}g`); } catch (e) { info.textContent = e.message; info.className = 'note bad'; view.textContent = text.value; groups.innerHTML = ''; return; }
      const found = pattern.value ? [...text.value.matchAll(re)].filter((m) => m[0] !== '' || pattern.value) : [];
      let html = ''; let last = 0;
      for (const m of found) { if (m[0] === '') continue; html += esc(text.value.slice(last, m.index)) + `<mark>${esc(m[0])}</mark>`; last = m.index + m[0].length; }
      view.innerHTML = html + esc(text.value.slice(last));
      info.textContent = `${found.filter((m) => m[0] !== '').length} match${found.length === 1 ? '' : 'es'}`;
      info.className = 'note';
      groups.innerHTML = found.slice(0, 20).filter((m) => m.length > 1 || m.groups).map((m, i) => `<li><b>Match ${i + 1}</b> ${m.slice(1).map((g, j) => `<span>$${j + 1} = ${g === undefined ? '<i>none</i>' : esc(g)}</span>`).join('')}</li>`).join('');
    };
    [pattern, flags, text].forEach((el) => el.addEventListener('input', run));
    document.querySelectorAll('[data-rx]').forEach((b) => b.addEventListener('click', () => { pattern.value = b.dataset.rx; run(); }));
    run();
  }

  // ---------- JSON formatter ----------
  if ($('js-in')) {
    const input = $('js-in'); const out = $('js-out'); const info = $('js-info'); const indent = $('js-indent'); const sort = $('js-sort');
    const sortKeys = (v) => (Array.isArray(v) ? v.map(sortKeys) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])])) : v);
    const run = (minify = false) => {
      const raw = input.value.trim();
      if (!raw) { out.textContent = ''; info.textContent = 'Paste JSON on the left.'; info.className = 'note'; return; }
      try {
        let data = JSON.parse(raw);
        if (sort.checked) data = sortKeys(data);
        out.textContent = minify ? JSON.stringify(data) : JSON.stringify(data, null, indent.value === 'tab' ? '\t' : Number(indent.value));
        info.textContent = `Valid JSON · ${new Blob([out.textContent]).size.toLocaleString()} bytes`;
        info.className = 'note ok';
      } catch (e) {
        // Newer browsers drop the position from the message, so find it: the shortest prefix that fails for a
        // reason other than "ended too early" ends right at the mistake.
        const broken = (n) => {
          try { JSON.parse(raw.slice(0, n)); return false; } catch (x) {
            if (/end of (JSON )?input|Unterminated/i.test(x.message)) return false;
            const at = x.message.match(/position (\d+)/);
            return !at || Number(at[1]) < n;
          }
        };
        let pos = Number((e.message.match(/position (\d+)/) || [])[1]);
        if (!Number.isFinite(pos) && broken(raw.length)) {
          let lo = 1; let hi = raw.length;
          while (lo < hi) { const mid = (lo + hi) >> 1; if (broken(mid)) hi = mid; else lo = mid + 1; }
          pos = lo - 1;
        }
        let where = '';
        if (Number.isFinite(pos)) { const before = raw.slice(0, pos); where = ` (line ${before.split('\n').length}, column ${pos - before.lastIndexOf('\n')})`; }
        info.textContent = `Not valid JSON${where}: ${e.message.replace(/^JSON\.parse: /, '')}`;
        info.className = 'note bad';
      }
    };
    input.addEventListener('input', () => run());
    indent.addEventListener('change', () => run());
    sort.addEventListener('change', () => run());
    $('js-format').addEventListener('click', () => run(false));
    $('js-min').addEventListener('click', () => run(true));
    run();
  }

  // ---------- JWT decoder ----------
  if ($('jwt-in')) {
    const input = $('jwt-in'); const head = $('jwt-head'); const body = $('jwt-body'); const info = $('jwt-info'); const times = $('jwt-times');
    const decode = (part) => JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=')), (c) => c.charCodeAt(0))));
    const run = () => {
      const parts = input.value.trim().split('.');
      times.innerHTML = '';
      if (parts.length < 2 || !parts[1]) { head.textContent = ''; body.textContent = ''; info.textContent = 'Paste a JWT: three parts separated by dots.'; info.className = 'note'; return; }
      try {
        const h = decode(parts[0]); const b = decode(parts[1]);
        head.textContent = JSON.stringify(h, null, 2); body.textContent = JSON.stringify(b, null, 2);
        const now = Date.now() / 1000;
        const rows = [['iat', 'Issued'], ['nbf', 'Valid from'], ['exp', 'Expires']].filter(([k]) => typeof b[k] === 'number')
          .map(([k, label]) => `<li><b>${label}</b> ${new Date(b[k] * 1000).toLocaleString()}${k === 'exp' ? (b[k] < now ? ' · <span class="bad">expired</span>' : ' · <span class="ok">still valid</span>') : ''}</li>`);
        times.innerHTML = rows.join('');
        info.textContent = `Algorithm ${h.alg ?? 'not set'}. The signature is not checked here; that needs the secret or public key, which should never be pasted into a website.`;
        info.className = 'note';
      } catch { info.textContent = 'This does not decode as a JWT.'; info.className = 'note bad'; head.textContent = ''; body.textContent = ''; }
    };
    input.addEventListener('input', run);
    run();
  }

  // ---------- Timestamp converter ----------
  if ($('ts-in')) {
    const input = $('ts-in'); const out = $('ts-out'); const now = $('ts-now');
    const rel = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
    const ago = (ms) => {
      const s = Math.round((ms - Date.now()) / 1000);
      for (const [unit, size] of [['year', 31536000], ['month', 2592000], ['day', 86400], ['hour', 3600], ['minute', 60]]) if (Math.abs(s) >= size) return rel.format(Math.round(s / size), unit);
      return rel.format(s, 'second');
    };
    const tick = () => { now.textContent = Math.floor(Date.now() / 1000); };
    const run = () => {
      const raw = input.value.trim();
      let ms;
      if (!raw) ms = Date.now();
      else if (/^-?\d+(\.\d+)?$/.test(raw)) ms = Number(raw) * (raw.replace('-', '').split('.')[0].length > 11 ? 1 : 1000);
      else ms = Date.parse(raw);
      if (!Number.isFinite(ms)) { out.innerHTML = '<li class="bad">Could not read that. Try a Unix timestamp or a date like 2026-11-11 14:30.</li>'; return; }
      const d = new Date(ms);
      out.innerHTML = [
        ['Unix seconds', Math.floor(ms / 1000)], ['Unix milliseconds', Math.floor(ms)], ['ISO 8601 (UTC)', d.toISOString()],
        ['Your time', d.toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'long' })], ['Relative', ago(ms)],
      ].map(([k, v], i) => `<li><span>${k}</span><output id="ts-v${i}">${esc(v)}</output><button type="button" class="btn btn-quiet btn-sm" data-copy-from="ts-v${i}">Copy</button></li>`).join('');
    };
    input.addEventListener('input', run);
    $('ts-use-now').addEventListener('click', () => { input.value = String(Math.floor(Date.now() / 1000)); run(); });
    setInterval(tick, 1000); tick(); run();
  }

  // ---------- Base64 and URL encoding ----------
  if ($('b64-in')) {
    const input = $('b64-in'); const out = $('b64-out'); const info = $('b64-info');
    let op = 'b64e';
    const ops = {
      b64e: (s) => btoa(String.fromCharCode(...new TextEncoder().encode(s))),
      b64d: (s) => new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(atob(s.trim().replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0))),
      urle: (s) => encodeURIComponent(s),
      urld: (s) => decodeURIComponent(s.replace(/\+/g, ' ')),
    };
    const run = () => {
      try { out.value = input.value ? ops[op](input.value) : ''; info.textContent = ''; info.className = 'note'; } catch { out.value = ''; info.textContent = op.endsWith('d') ? 'That is not valid encoded text.' : 'Could not encode that.'; info.className = 'note bad'; }
    };
    document.querySelectorAll('#b64-tool .seg button').forEach((b) => b.addEventListener('click', () => {
      op = b.dataset.op;
      document.querySelectorAll('#b64-tool .seg button').forEach((x) => x.setAttribute('aria-selected', x === b));
      run();
    }));
    $('b64-swap').addEventListener('click', () => { input.value = out.value; const pair = { b64e: 'b64d', b64d: 'b64e', urle: 'urld', urld: 'urle' }[op]; document.querySelector(`#b64-tool .seg button[data-op="${pair}"]`).click(); });
    input.addEventListener('input', run);
    run();
  }

  // ---------- Passwords and UUIDs ----------
  if ($('pw-out')) {
    const len = $('pw-len'); const lenOut = $('pw-len-out'); const out = $('pw-out'); const bits = $('pw-bits');
    const sets = { lower: 'abcdefghijkmnopqrstuvwxyz', upper: 'ABCDEFGHJKLMNPQRSTUVWXYZ', digits: '23456789', symbols: '!@#$%^&*()-_=+[]{};:,.?' };
    const pick = (n) => { const a = new Uint32Array(1); const limit = 2 ** 32 - (2 ** 32 % n); do crypto.getRandomValues(a); while (a[0] >= limit); return a[0] % n; };
    const gen = () => {
      const chosen = Object.keys(sets).filter((k) => $(`pw-${k}`).checked);
      if (!chosen.length) { out.textContent = 'Pick at least one kind of character.'; bits.textContent = ''; return; }
      const pool = chosen.map((k) => sets[k]).join('');
      const n = Number(len.value);
      // One from each chosen set, then the rest from the whole pool, then shuffle.
      const chars = chosen.map((k) => sets[k][pick(sets[k].length)]);
      while (chars.length < n) chars.push(pool[pick(pool.length)]);
      for (let i = chars.length - 1; i > 0; i -= 1) { const j = pick(i + 1); [chars[i], chars[j]] = [chars[j], chars[i]]; }
      out.textContent = chars.join('');
      lenOut.textContent = n;
      const entropy = Math.round(n * Math.log2(pool.length));
      bits.textContent = `About ${entropy} bits of entropy · ${entropy >= 100 ? 'very strong' : entropy >= 70 ? 'strong' : entropy >= 50 ? 'fair' : 'weak'}`;
    };
    [len, ...Object.keys(sets).map((k) => $(`pw-${k}`))].forEach((el) => el.addEventListener('input', gen));
    $('pw-new').addEventListener('click', gen);
    gen();
    const uuidOut = $('uuid-out'); const count = $('uuid-count');
    const uuids = () => { uuidOut.value = Array.from({ length: Math.min(100, Math.max(1, Number(count.value) || 1)) }, () => crypto.randomUUID()).join('\n'); };
    $('uuid-new').addEventListener('click', uuids);
    count.addEventListener('input', uuids);
    uuids();
  }

  // ---------- chmod calculator ----------
  if ($('chmod-num')) {
    const num = $('chmod-num'); const sym = $('chmod-sym'); const cmd = $('chmod-cmd'); const file = $('chmod-file');
    const boxes = [...document.querySelectorAll('#chmod-tool input[type=checkbox]')];
    const fromBoxes = () => {
      const digits = ['u', 'g', 'o'].map((who) => ['r', 'w', 'x'].reduce((sum, p, i) => sum + ($(`c-${who}${p}`).checked ? [4, 2, 1][i] : 0), 0));
      num.value = digits.join('');
      paint();
    };
    const fromNum = () => {
      if (!/^[0-7]{3}$/.test(num.value)) return;
      [...num.value].forEach((d, i) => ['r', 'w', 'x'].forEach((p, j) => { $(`c-${'ugo'[i]}${p}`).checked = Boolean(Number(d) & [4, 2, 1][j]); }));
      paint();
    };
    const paint = () => {
      sym.textContent = `-${['u', 'g', 'o'].map((w) => ['r', 'w', 'x'].map((p) => ($(`c-${w}${p}`).checked ? p : '-')).join('')).join('')}`;
      cmd.textContent = `chmod ${num.value} ${file.value || 'file'}`;
    };
    boxes.forEach((b) => b.addEventListener('change', fromBoxes));
    num.addEventListener('input', fromNum);
    file.addEventListener('input', paint);
    document.querySelectorAll('[data-chmod]').forEach((b) => b.addEventListener('click', () => { num.value = b.dataset.chmod; fromNum(); }));
    fromNum();
  }
})();
