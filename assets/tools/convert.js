// Converters: JSON to TypeScript, Zod or JSON Schema, and cURL to fetch, axios or Python.
(() => {
  const $ = (id) => document.getElementById(id);

  // ---------- JSON to types ----------
  if ($('jt-in')) {
    const input = $('jt-in'); const out = $('jt-out'); const info = $('jt-info'); const rootName = $('jt-root');
    let target = 'ts';
    const pascal = (s) => (String(s).replace(/[^a-zA-Z0-9]+(.)?/g, (_, c) => (c ? c.toUpperCase() : '')).replace(/^./, (c) => c.toUpperCase()) || 'Item').replace(/^\d/, 'T$&');
    const singular = (s) => (/ies$/i.test(s) ? s.replace(/ies$/i, 'y') : /ses$/i.test(s) ? s.slice(0, -2) : /s$/i.test(s) && !/ss$/i.test(s) ? s.slice(0, -1) : `${s}Item`);
    const safeKey = (k) => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k));

    // A small type tree: merged across array items so optional fields and mixed types come out right.
    const infer = (v) => {
      if (v === null) return { kind: 'null' };
      if (Array.isArray(v)) return { kind: 'array', item: v.length ? v.map(infer).reduce(merge) : { kind: 'unknown' } };
      if (typeof v === 'object') return { kind: 'object', fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, { node: infer(x), optional: false }])) };
      if (typeof v === 'number') return { kind: Number.isInteger(v) ? 'integer' : 'number' };
      return { kind: typeof v };
    };
    const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    function merge(a, b) {
      if (same(a, b)) return a;
      if (a.kind === 'unknown') return b;
      if (b.kind === 'unknown') return a;
      if (['integer', 'number'].includes(a.kind) && ['integer', 'number'].includes(b.kind)) return { kind: 'number' };
      if (a.kind === 'object' && b.kind === 'object') {
        const fields = {};
        for (const k of new Set([...Object.keys(a.fields), ...Object.keys(b.fields)])) {
          const fa = a.fields[k]; const fb = b.fields[k];
          fields[k] = fa && fb ? { node: merge(fa.node, fb.node), optional: fa.optional || fb.optional } : { node: (fa ?? fb).node, optional: true };
        }
        return { kind: 'object', fields };
      }
      if (a.kind === 'array' && b.kind === 'array') return { kind: 'array', item: merge(a.item, b.item) };
      const options = [...(a.kind === 'union' ? a.options : [a]), ...(b.kind === 'union' ? b.options : [b])];
      const unique = options.filter((o, i) => options.findIndex((x) => same(x, o)) === i);
      return { kind: 'union', options: unique };
    }

    function toTs(node, name) {
      const decls = [];
      const seen = new Map();
      const type = (n, nm) => {
        switch (n.kind) {
          case 'string': case 'boolean': case 'null': return n.kind;
          case 'integer': case 'number': return 'number';
          case 'unknown': return 'unknown';
          case 'array': { const t = type(n.item, singular(nm)); return /[|&]/.test(t) ? `(${t})[]` : `${t}[]`; }
          case 'union': return n.options.map((o) => type(o, nm)).join(' | ');
          case 'object': {
            let iname = pascal(nm);
            while (seen.has(iname) && !same(seen.get(iname), n)) iname += '2';
            if (!seen.has(iname)) {
              seen.set(iname, n);
              const body = Object.entries(n.fields).map(([k, f]) => `  ${safeKey(k)}${f.optional ? '?' : ''}: ${type(f.node, k)};`).join('\n');
              decls.push(`export interface ${iname} {\n${body}\n}`);
            }
            return iname;
          }
          default: return 'unknown';
        }
      };
      const top = type(node, name);
      if (node.kind !== 'object') decls.push(`export type ${pascal(name)} = ${top};`);
      return decls.reverse().join('\n\n');
    }

    function toZod(node, depth = 0) {
      const pad = '  '.repeat(depth + 1);
      switch (node.kind) {
        case 'string': return 'z.string()';
        case 'integer': return 'z.number().int()';
        case 'number': return 'z.number()';
        case 'boolean': return 'z.boolean()';
        case 'null': return 'z.null()';
        case 'unknown': return 'z.unknown()';
        case 'array': return `z.array(${toZod(node.item, depth)})`;
        case 'union': return `z.union([${node.options.map((o) => toZod(o, depth)).join(', ')}])`;
        case 'object': return `z.object({\n${Object.entries(node.fields).map(([k, f]) => `${pad}${safeKey(k)}: ${toZod(f.node, depth + 1)}${f.optional ? '.optional()' : ''},`).join('\n')}\n${'  '.repeat(depth)}})`;
        default: return 'z.unknown()';
      }
    }

    function toSchema(node) {
      switch (node.kind) {
        case 'integer': case 'number': case 'string': case 'boolean': case 'null': return { type: node.kind };
        case 'array': return { type: 'array', items: toSchema(node.item) };
        case 'union': return { anyOf: node.options.map(toSchema) };
        case 'object': return { type: 'object', properties: Object.fromEntries(Object.entries(node.fields).map(([k, f]) => [k, toSchema(f.node)])), required: Object.entries(node.fields).filter(([, f]) => !f.optional).map(([k]) => k), additionalProperties: false };
        default: return {};
      }
    }

    const run = () => {
      const raw = input.value.trim();
      if (!raw) { out.textContent = ''; info.textContent = 'Paste a JSON example on the left.'; info.className = 'note'; return; }
      let data;
      try { data = JSON.parse(raw); } catch (e) { info.textContent = `That is not valid JSON: ${e.message}`; info.className = 'note bad'; return; }
      const node = infer(data);
      const nm = rootName.value.trim() || 'Root';
      if (target === 'ts') out.textContent = toTs(node, nm);
      else if (target === 'zod') out.textContent = `import { z } from 'zod';\n\nexport const ${pascal(nm)}Schema = ${toZod(node)};\n\nexport type ${pascal(nm)} = z.infer<typeof ${pascal(nm)}Schema>;`;
      else out.textContent = JSON.stringify({ $schema: 'https://json-schema.org/draft/2020-12/schema', title: pascal(nm), ...toSchema(node) }, null, 2);
      info.textContent = 'Fields missing from some array items are marked optional.';
      info.className = 'note';
    };
    document.querySelectorAll('#jt-tool .seg button').forEach((b) => b.addEventListener('click', () => {
      target = b.dataset.target;
      document.querySelectorAll('#jt-tool .seg button').forEach((x) => x.setAttribute('aria-selected', x === b));
      run();
    }));
    [input, rootName].forEach((el) => el.addEventListener('input', run));
    run();
  }

  // ---------- cURL to code ----------
  if ($('curl-in')) {
    const input = $('curl-in'); const out = $('curl-out'); const info = $('curl-info');
    let target = 'fetch';
    // Splits a shell command the way a POSIX shell would, for the quoting cURL commands use.
    const tokenize = (s) => {
      const tokens = []; let cur = ''; let quote = null; let has = false;
      s = s.replace(/\\\r?\n/g, ' ');
      for (let i = 0; i < s.length; i += 1) {
        const c = s[i];
        if (quote) {
          if (c === quote) quote = null;
          else if (c === '\\' && quote === '"' && i + 1 < s.length) cur += s[++i];
          else cur += c;
        } else if (c === "'" || c === '"') { quote = c; has = true; } else if (/\s/.test(c)) { if (has || cur) tokens.push(cur); cur = ''; has = false; } else if (c === '\\' && i + 1 < s.length) { cur += s[++i]; has = true; } else { cur += c; has = true; }
      }
      if (quote) throw new Error('A quote is not closed.');
      if (has || cur) tokens.push(cur);
      return tokens;
    };
    const parse = (cmd) => {
      const t = tokenize(cmd.trim());
      if (t[0] !== 'curl') throw new Error('Start with curl.');
      const req = { method: null, url: null, headers: {}, data: [], get: false, json: false };
      for (let i = 1; i < t.length; i += 1) {
        const a = t[i];
        const next = () => { if (i + 1 >= t.length) throw new Error(`${a} needs a value.`); return t[++i]; };
        if (a === '-X' || a === '--request') req.method = next().toUpperCase();
        else if (a === '-H' || a === '--header') { const h = next(); const at = h.indexOf(':'); if (at > 0) req.headers[h.slice(0, at).trim()] = h.slice(at + 1).trim(); }
        else if (['-d', '--data', '--data-raw', '--data-binary', '--data-ascii'].includes(a)) req.data.push(next());
        else if (a === '--data-urlencode') { const v = next(); const eq = v.indexOf('='); req.data.push(eq >= 0 ? `${v.slice(0, eq)}=${encodeURIComponent(v.slice(eq + 1))}` : encodeURIComponent(v)); }
        else if (a === '--json') { req.data.push(next()); req.json = true; }
        else if (a === '-u' || a === '--user') req.headers.Authorization = `Basic ${btoa(next())}`;
        else if (a === '-b' || a === '--cookie') req.headers.Cookie = next();
        else if (a === '-A' || a === '--user-agent') req.headers['User-Agent'] = next();
        else if (a === '-e' || a === '--referer') req.headers.Referer = next();
        else if (a === '-G' || a === '--get') req.get = true;
        else if (a === '--url') req.url = next();
        else if (/^-/.test(a)) { if (['-o', '--output', '-w', '--write-out', '-m', '--max-time', '--connect-timeout', '-x', '--proxy'].includes(a)) i += 1; }
        else if (!req.url) req.url = a;
      }
      if (!req.url) throw new Error('No URL found.');
      if (!/^https?:\/\//i.test(req.url)) req.url = `http://${req.url}`;
      let body = req.data.length ? req.data.join('&') : null;
      if (req.get && body) { req.url += (req.url.includes('?') ? '&' : '?') + body; body = null; }
      if (req.json) { req.headers['Content-Type'] ??= 'application/json'; req.headers.Accept ??= 'application/json'; }
      if (body && !Object.keys(req.headers).some((h) => h.toLowerCase() === 'content-type')) req.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      req.method ??= body ? 'POST' : 'GET';
      req.body = body;
      const ct = Object.entries(req.headers).find(([h]) => h.toLowerCase() === 'content-type')?.[1] ?? '';
      req.isJson = /json/.test(ct) && body !== null && (() => { try { req.parsed = JSON.parse(body); return true; } catch { return false; } })();
      return req;
    };
    const indent = (s, n) => s.split('\n').map((l, i) => (i ? ' '.repeat(n) + l : l)).join('\n');
    const js = (v) => JSON.stringify(v, null, 2);
    const py = (v) => js(v).replace(/\btrue\b/g, 'True').replace(/\bfalse\b/g, 'False').replace(/\bnull\b/g, 'None');
    const render = {
      fetch: (r) => {
        const opts = [`method: '${r.method}'`];
        if (Object.keys(r.headers).length) opts.push(`headers: ${indent(js(r.headers), 2)}`);
        if (r.body !== null) opts.push(r.isJson ? `body: JSON.stringify(${indent(js(r.parsed), 2)})` : `body: ${JSON.stringify(r.body)}`);
        return `const response = await fetch(${JSON.stringify(r.url)}, {\n  ${opts.join(',\n  ')},\n});\n\nif (!response.ok) throw new Error(\`Request failed: \${response.status}\`);\nconst data = await response.${r.headers.Accept?.includes('json') || r.isJson ? 'json' : 'text'}();`;
      },
      axios: (r) => {
        const cfg = [`method: '${r.method.toLowerCase()}'`, `url: ${JSON.stringify(r.url)}`];
        if (Object.keys(r.headers).length) cfg.push(`headers: ${indent(js(r.headers), 2)}`);
        if (r.body !== null) cfg.push(`data: ${r.isJson ? indent(js(r.parsed), 2) : JSON.stringify(r.body)}`);
        return `import axios from 'axios';\n\nconst { data } = await axios({\n  ${cfg.join(',\n  ')},\n});`;
      },
      python: (r) => {
        const args = [JSON.stringify(r.url)];
        const headers = { ...r.headers };
        if (r.isJson) delete headers['Content-Type'];
        if (Object.keys(headers).length) args.push(`headers=${indent(py(headers), 4)}`);
        if (r.body !== null) args.push(r.isJson ? `json=${indent(py(r.parsed), 4)}` : `data=${JSON.stringify(r.body)}`);
        args.push('timeout=30');
        return `import requests\n\nresponse = requests.${r.method.toLowerCase()}(\n    ${args.join(',\n    ')},\n)\nresponse.raise_for_status()\nprint(response.${r.isJson || r.headers.Accept?.includes('json') ? 'json()' : 'text'})`;
      },
    };
    const run = () => {
      try {
        const r = parse(input.value);
        if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].includes(r.method)) throw new Error(`Unknown method ${r.method}.`);
        out.textContent = render[target](r);
        info.textContent = `${r.method} ${r.url}`;
        info.className = 'note';
      } catch (e) { out.textContent = ''; info.textContent = e.message; info.className = 'note bad'; }
    };
    document.querySelectorAll('#curl-tool .seg button').forEach((b) => b.addEventListener('click', () => {
      target = b.dataset.target;
      document.querySelectorAll('#curl-tool .seg button').forEach((x) => x.setAttribute('aria-selected', x === b));
      run();
    }));
    input.addEventListener('input', run);
    run();
  }
})();
