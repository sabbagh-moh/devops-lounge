// Text diff and color contrast checker.
(() => {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // ---------- Diff ----------
  if ($('df-a')) {
    const a = $('df-a'); const b = $('df-b'); const out = $('df-out'); const info = $('df-info'); const ws = $('df-ws');
    // Longest common subsequence over lines: small, exact and good for the sizes people paste.
    const diff = (x, y, key) => {
      const n = x.length; const m = y.length;
      if (n * m > 9e6) return null;
      const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
      for (let i = n - 1; i >= 0; i -= 1) for (let j = m - 1; j >= 0; j -= 1) dp[i][j] = key(x[i]) === key(y[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
      const ops = []; let i = 0; let j = 0;
      while (i < n && j < m) {
        if (key(x[i]) === key(y[j])) { ops.push([' ', x[i], i + 1, j + 1]); i += 1; j += 1; } else if (dp[i + 1][j] >= dp[i][j + 1]) { ops.push(['-', x[i], i + 1, null]); i += 1; } else { ops.push(['+', y[j], null, j + 1]); j += 1; }
      }
      while (i < n) { ops.push(['-', x[i], i + 1, null]); i += 1; }
      while (j < m) { ops.push(['+', y[j], null, j + 1]); j += 1; }
      return ops;
    };
    const run = () => {
      const key = ws.checked ? (l) => l.replace(/\s+/g, ' ').trim() : (l) => l;
      const ops = diff(a.value.split('\n'), b.value.split('\n'), key);
      if (!ops) { out.innerHTML = ''; info.textContent = 'These texts are too long to compare here. Try a smaller part.'; info.className = 'note bad'; return; }
      const added = ops.filter((o) => o[0] === '+').length; const removed = ops.filter((o) => o[0] === '-').length;
      info.textContent = added || removed ? `${added} line${added === 1 ? '' : 's'} added, ${removed} removed` : 'The texts are the same.';
      info.className = added || removed ? 'note' : 'note ok';
      out.innerHTML = ops.map(([op, line, l1, l2]) => `<div class="dl ${op === '+' ? 'add' : op === '-' ? 'del' : ''}"><span class="ln">${l1 ?? ''}</span><span class="ln">${l2 ?? ''}</span><span class="op">${op}</span><code>${esc(line) || ' '}</code></div>`).join('');
    };
    [a, b, ws].forEach((el) => el.addEventListener('input', run));
    $('df-swap').addEventListener('click', () => { [a.value, b.value] = [b.value, a.value]; run(); });
    run();
  }

  // ---------- Color and contrast ----------
  if ($('cl-fg')) {
    const fg = $('cl-fg'); const bg = $('cl-bg'); const formats = $('cl-formats'); const ratioEl = $('cl-ratio'); const badges = $('cl-badges'); const preview = $('cl-preview'); const scale = $('cl-scale'); const info = $('cl-info');
    const probe = document.createElement('i');
    document.body.append(probe);
    // The browser itself parses the color, so names, hex, rgb(), hsl(), oklch() and more all work.
    const parse = (text) => {
      probe.style.color = '';
      probe.style.color = text.trim();
      if (!probe.style.color) return null;
      const ctx = parse.ctx ??= Object.assign(document.createElement('canvas'), { width: 1, height: 1 }).getContext('2d', { willReadFrequently: true });
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = getComputedStyle(probe).color;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
      return { r, g, b, a: a / 255 };
    };
    const hex = ({ r, g, b }) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
    const hsl = ({ r, g, b }) => {
      const [R, G, B] = [r, g, b].map((v) => v / 255); const max = Math.max(R, G, B); const min = Math.min(R, G, B); const l = (max + min) / 2; const d = max - min;
      let h = 0; const s = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
      if (d) h = max === R ? ((G - B) / d) % 6 : max === G ? (B - R) / d + 2 : (R - G) / d + 4;
      return `hsl(${Math.round((h * 60 + 360) % 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`;
    };
    const lin = (v) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
    const oklch = ({ r, g, b }) => {
      const [R, G, B] = [r, g, b].map(lin);
      const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B); const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B); const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
      const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s; const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s; const Bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
      const C = Math.hypot(A, Bb); const H = (Math.atan2(Bb, A) * 180 / Math.PI + 360) % 360;
      return `oklch(${(L * 100).toFixed(1)}% ${C.toFixed(3)} ${C < 0.002 ? 0 : H.toFixed(1)})`;
    };
    const luminance = ({ r, g, b }) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    const contrast = (x, y) => { const [a, b] = [luminance(x), luminance(y)].sort((p, q) => q - p); return (a + 0.05) / (b + 0.05); };
    const run = () => {
      const f = parse(fg.value); const k = parse(bg.value);
      if (!f || !k) { info.textContent = `Could not read ${!f ? 'the text color' : 'the background color'}. Try #1C1C1E, rgb(28 28 30) or a name like navy.`; info.className = 'note bad'; return; }
      info.textContent = ''; info.className = 'note';
      formats.innerHTML = [['HEX', hex(f)], ['RGB', `rgb(${f.r} ${f.g} ${f.b})`], ['HSL', hsl(f)], ['OKLCH', oklch(f)]]
        .map(([n, v], i) => `<li><span>${n}</span><output id="cl-v${i}">${v}</output><button type="button" class="btn btn-quiet btn-sm" data-copy-from="cl-v${i}">Copy</button></li>`).join('');
      const ratio = contrast(f, k);
      ratioEl.textContent = `${ratio.toFixed(2)}:1`;
      badges.innerHTML = [['AA text', 4.5], ['AA large text', 3], ['AAA text', 7], ['AAA large text', 4.5]].map(([l, need]) => `<li class="${ratio >= need ? 'ok' : 'bad'}">${ratio >= need ? 'Pass' : 'Fail'} · ${l}</li>`).join('');
      preview.style.color = hex(f); preview.style.background = hex(k);
      // Tints and shades of the text color, mixed toward white and black.
      scale.innerHTML = [0.85, 0.7, 0.5, 0.3, 0, -0.25, -0.45, -0.6, -0.75].map((t) => {
        const mix = (v) => Math.round(t >= 0 ? v + (255 - v) * t : v * (1 + t));
        const c = { r: mix(f.r), g: mix(f.g), b: mix(f.b) };
        return `<button type="button" style="background:${hex(c)}" title="${hex(c)}" data-hex="${hex(c)}"><span style="color:${luminance(c) > 0.4 ? '#000' : '#fff'}">${hex(c)}</span></button>`;
      }).join('');
    };
    scale.addEventListener('click', (e) => { const b = e.target.closest('[data-hex]'); if (b) { fg.value = b.dataset.hex; run(); } });
    [fg, bg].forEach((el) => el.addEventListener('input', run));
    $('cl-swap').addEventListener('click', () => { [fg.value, bg.value] = [bg.value, fg.value]; run(); });
    run();
  }
})();
