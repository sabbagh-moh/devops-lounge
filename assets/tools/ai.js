// AI tools: a token estimator and a tool (function-calling) schema builder. Everything runs in the browser.
(() => {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  // ---------- Token counter ----------
  if ($('tok-in')) {
    const input = $('tok-in'); const stats = $('tok-stats'); const fit = $('tok-fit'); const price = $('tok-price'); const cost = $('tok-cost');
    const WINDOWS = [['8K', 8192], ['32K', 32768], ['128K', 128000], ['200K', 200000], ['1M', 1000000]];
    // Tokenizers split common English words into one token and long or rare words into several.
    // Arabic, Cyrillic and CJK text costs more tokens per character. This mirrors that within about 15%.
    const estimate = (text) => {
      let tokens = 0;
      for (const m of text.matchAll(/[A-Za-z]+|\d+|[؀-ۿ]+|[Ѐ-ӿ]+|[぀-ヿ一-鿿]|[^\sA-Za-z\d]|\s+/g)) {
        const t = m[0];
        if (/^\s+$/.test(t)) tokens += t.includes('\n') ? (t.match(/\n/g).length > 1 ? 1 : 0) : 0;
        else if (/^[A-Za-z]+$/.test(t)) tokens += t.length <= 6 ? 1 : Math.ceil(t.length / 4);
        else if (/^\d+$/.test(t)) tokens += Math.ceil(t.length / 3);
        else if (/^[؀-ۿ]+$/.test(t)) tokens += Math.max(1, Math.ceil(t.length / 2.2));
        else if (/^[Ѐ-ӿ]+$/.test(t)) tokens += Math.max(1, Math.ceil(t.length / 3));
        else tokens += 1;
      }
      return tokens;
    };
    const fmt = (n) => n.toLocaleString();
    const run = () => {
      const text = input.value;
      const t = estimate(text);
      const words = (text.match(/\S+/g) || []).length;
      stats.innerHTML = [['Tokens (estimate)', `${fmt(Math.round(t * 0.9))} to ${fmt(Math.round(t * 1.1))}`], ['Characters', fmt(text.length)], ['Words', fmt(words)], ['Lines', fmt(text ? text.split('\n').length : 0)]]
        .map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('');
      fit.innerHTML = WINDOWS.map(([label, size]) => {
        const pct = Math.min(100, (t / size) * 100);
        return `<li><span>${label}</span><i style="--w:${pct.toFixed(2)}%" class="${pct >= 100 ? 'over' : pct > 75 ? 'warn' : ''}"></i><b>${pct >= 100 ? 'Too long' : `${pct < 0.1 && t ? '<0.1' : pct.toFixed(pct < 10 ? 1 : 0)}%`}</b></li>`;
      }).join('');
      const p = Number(price.value);
      cost.textContent = p > 0 ? `About ${(t / 1e6 * p).toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 4 })} to send this once.` : 'Enter your model\'s price per million input tokens to see the cost.';
    };
    [input, price].forEach((el) => el.addEventListener('input', run));
    run();
  }

  // ---------- Tool schema builder ----------
  if ($('ts-name')) {
    const name = $('ts-name'); const desc = $('ts-desc'); const rows = $('ts-rows'); const out = $('ts-out'); const tips = $('ts-tips');
    let target = 'openai';
    const TYPES = ['string', 'number', 'integer', 'boolean', 'string[]', 'number[]', 'object'];
    const addRow = (p = {}) => {
      const li = document.createElement('li');
      li.innerHTML = `<input class="p-name" placeholder="city" value="${esc(p.name ?? '')}" aria-label="Parameter name" spellcheck="false">
        <select class="p-type" aria-label="Type">${TYPES.map((t) => `<option${t === (p.type ?? 'string') ? ' selected' : ''}>${t}</option>`).join('')}</select>
        <input class="p-desc" placeholder="What it is and the format you expect" value="${esc(p.desc ?? '')}" aria-label="Description">
        <input class="p-enum" placeholder="Allowed values, comma separated (optional)" value="${esc(p.enum ?? '')}" aria-label="Allowed values">
        <label class="inline"><input type="checkbox" class="p-req"${p.required === false ? '' : ' checked'}> Required</label>
        <button type="button" class="btn btn-quiet btn-sm p-del" aria-label="Remove parameter">Remove</button>`;
      rows.append(li);
      run();
    };
    const schemaFor = (type, d, values) => {
      const s = type.endsWith('[]') ? { type: 'array', items: { type: type.slice(0, -2) } } : type === 'object' ? { type: 'object', additionalProperties: true } : { type };
      if (d) s.description = d;
      if (values.length) (s.items ?? s).enum = type.startsWith('number') || type === 'integer' ? values.map(Number) : values;
      return s;
    };
    const run = () => {
      const properties = {}; const required = []; const warn = [];
      for (const li of rows.children) {
        const n = li.querySelector('.p-name').value.trim();
        if (!n) continue;
        const d = li.querySelector('.p-desc').value.trim();
        const values = li.querySelector('.p-enum').value.split(',').map((v) => v.trim()).filter(Boolean);
        properties[n] = schemaFor(li.querySelector('.p-type').value, d, values);
        if (li.querySelector('.p-req').checked) required.push(n);
        if (!d) warn.push(`Describe "${n}". Models pick values from the description.`);
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(n)) warn.push(`"${n}" should use letters, numbers and underscores only.`);
      }
      const fn = name.value.trim() || 'my_tool';
      if (!/^[a-zA-Z0-9_-]{1,64}$/.test(fn)) warn.push('The tool name must be 1 to 64 letters, numbers, underscores or dashes.');
      if (desc.value.trim().length < 30) warn.push('Write a fuller description: what the tool does, when to use it, and what it returns.');
      const parameters = { type: 'object', properties, required, additionalProperties: false };
      const d = desc.value.trim();
      const shapes = {
        openai: { type: 'function', function: { name: fn, description: d, parameters, strict: required.length === Object.keys(properties).length } },
        anthropic: { name: fn, description: d, input_schema: { type: 'object', properties, required } },
        mcp: { name: fn, description: d, inputSchema: { type: 'object', properties, required } },
      };
      out.textContent = JSON.stringify(shapes[target], null, 2);
      tips.innerHTML = warn.length ? warn.map((w) => `<li>${esc(w)}</li>`).join('') : '<li class="ok">Looks good. Clear names and descriptions help the model call the tool correctly.</li>';
    };
    rows.addEventListener('input', run);
    rows.addEventListener('change', run);
    rows.addEventListener('click', (e) => { if (e.target.closest('.p-del')) { e.target.closest('li').remove(); run(); } });
    $('ts-add').addEventListener('click', () => addRow({ required: false }));
    [name, desc].forEach((el) => el.addEventListener('input', run));
    document.querySelectorAll('#schema-tool .seg button').forEach((b) => b.addEventListener('click', () => {
      target = b.dataset.target;
      document.querySelectorAll('#schema-tool .seg button').forEach((x) => x.setAttribute('aria-selected', x === b));
      run();
    }));
    addRow({ name: 'city', type: 'string', desc: 'City name, for example "Beirut" or "Lisbon"' });
    addRow({ name: 'unit', type: 'string', desc: 'Temperature unit', enum: 'celsius, fahrenheit', required: false });
  }
})();
