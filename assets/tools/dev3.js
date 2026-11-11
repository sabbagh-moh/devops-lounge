// MCP config generator, llms.txt generator, Git command finder and CIDR calculator. All in the browser.
(() => {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  // ---------- MCP config generator ----------
  if ($('mcp-tool')) {
    const out = $('mcp-out'); const where = $('mcp-where'); const winBox = $('mcp-win'); const list = $('mcp-list');
    let client = 'claude-desktop';
    // Well-known servers. Values in <angle brackets> are filled from the inputs.
    const SERVERS = {
      filesystem: { label: 'Filesystem', command: 'npx', args: ['-y', '@modelcontextprotocol/server-filesystem'], extraArgs: 'folders', hint: 'Folders it may read and write, one per line' },
      git: { label: 'Git', command: 'uvx', args: ['mcp-server-git', '--repository'], extraArgs: 'repo', hint: 'Path to the repository' },
      github: { label: 'GitHub', command: 'docker', args: ['run', '-i', '--rm', '-e', 'GITHUB_PERSONAL_ACCESS_TOKEN', 'ghcr.io/github/github-mcp-server'], env: { GITHUB_PERSONAL_ACCESS_TOKEN: '<your GitHub token>' } },
      fetch: { label: 'Fetch (web pages)', command: 'uvx', args: ['mcp-server-fetch'] },
      memory: { label: 'Memory', command: 'npx', args: ['-y', '@modelcontextprotocol/server-memory'] },
      thinking: { label: 'Sequential thinking', command: 'npx', args: ['-y', '@modelcontextprotocol/server-sequential-thinking'] },
      playwright: { label: 'Playwright (browser)', command: 'npx', args: ['@playwright/mcp@latest'] },
      context7: { label: 'Context7 (library docs)', command: 'npx', args: ['-y', '@upstash/context7-mcp'] },
    };
    const CLIENTS = {
      'claude-desktop': { file: 'claude_desktop_config.json', where: 'macOS: ~/Library/Application Support/Claude/claude_desktop_config.json · Windows: %APPDATA%\\Claude\\claude_desktop_config.json. Restart Claude Desktop after saving.', key: 'mcpServers' },
      'claude-code': { file: '.mcp.json', where: 'Save as .mcp.json in your project root to share it with your team, or run the commands below to add them for yourself.', key: 'mcpServers', cli: true },
      cursor: { file: '.cursor/mcp.json', where: 'Project: .cursor/mcp.json · Everywhere: ~/.cursor/mcp.json', key: 'mcpServers' },
      vscode: { file: '.vscode/mcp.json', where: 'Save as .vscode/mcp.json in your workspace. VS Code shows a Start button above each server.', key: 'servers', typed: true },
      windsurf: { file: 'mcp_config.json', where: '~/.codeium/windsurf/mcp_config.json, then refresh the MCP list in Windsurf.', key: 'mcpServers' },
    };
    list.innerHTML = Object.entries(SERVERS).map(([id, s]) => `<li><label class="inline"><input type="checkbox" value="${id}"${['filesystem', 'memory'].includes(id) ? ' checked' : ''}> ${s.label}</label>${s.extraArgs ? `<textarea rows="2" data-for="${id}" placeholder="${esc(s.hint)}">${id === 'filesystem' ? '/Users/you/projects' : '/Users/you/projects/my-repo'}</textarea>` : ''}</li>`).join('');
    const quoteArg = (a) => (/[\s"']/.test(a) ? JSON.stringify(a) : a);
    const run = () => {
      const chosen = [...list.querySelectorAll('input:checked')].map((i) => i.value);
      const servers = {};
      for (const id of chosen) {
        const s = SERVERS[id];
        let args = [...s.args];
        if (s.extraArgs) args.push(...list.querySelector(`[data-for="${id}"]`).value.split('\n').map((v) => v.trim()).filter(Boolean));
        let command = s.command;
        // Claude Desktop and some editors on Windows cannot start npx directly.
        if (winBox.checked && command === 'npx') { args = ['/c', 'npx', ...args]; command = 'cmd'; }
        servers[id] = { ...(CLIENTS[client].typed ? { type: 'stdio' } : {}), command, args, ...(s.env ? { env: { ...s.env } } : {}) };
      }
      const custom = $('mcp-c-name').value.trim();
      if (custom && $('mcp-c-cmd').value.trim()) {
        const env = Object.fromEntries($('mcp-c-env').value.split('\n').map((l) => l.trim()).filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
        servers[custom] = { ...(CLIENTS[client].typed ? { type: 'stdio' } : {}), command: $('mcp-c-cmd').value.trim(), args: $('mcp-c-args').value.trim() ? $('mcp-c-args').value.trim().split(/\s+/) : [], ...(Object.keys(env).length ? { env } : {}) };
      }
      const c = CLIENTS[client];
      let text = JSON.stringify({ [c.key]: servers }, null, 2);
      if (c.cli) {
        const cmds = Object.entries(servers).map(([n, s]) => `claude mcp add ${n}${Object.entries(s.env ?? {}).map(([k, v]) => ` -e ${k}=${quoteArg(v)}`).join('')} -- ${s.command} ${s.args.map(quoteArg).join(' ')}`);
        text += `\n\n# Or add them from your terminal:\n${cmds.join('\n')}`;
      }
      out.textContent = text;
      where.textContent = `${c.file}: ${c.where}`;
    };
    $('mcp-tool').addEventListener('input', run);
    $('mcp-tool').addEventListener('change', run);
    document.querySelectorAll('#mcp-tool .seg button').forEach((b) => b.addEventListener('click', () => {
      client = b.dataset.client;
      document.querySelectorAll('#mcp-tool .seg button').forEach((x) => x.setAttribute('aria-selected', x === b));
      run();
    }));
    winBox.checked = /Win/.test(navigator.platform || navigator.userAgent);
    run();
  }

  // ---------- llms.txt generator ----------
  if ($('llms-tool')) {
    const urls = $('llms-urls'); const name = $('llms-name'); const summary = $('llms-summary'); const details = $('llms-details'); const out = $('llms-out'); const info = $('llms-info');
    const titleCase = (s) => s.replace(/[-_]+/g, ' ').replace(/\.(html?|php|aspx?)$/i, '').replace(/\s+/g, ' ').trim().replace(/\b\w/g, (c) => c.toUpperCase());
    // Accepts a sitemap.xml, a list of URLs, or Markdown links.
    const parse = (text) => {
      const found = [...text.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
      const plain = found.length ? found : [...text.matchAll(/https?:\/\/[^\s<>"')]+/g)].map((m) => m[0]);
      return [...new Set(plain)].map((u) => { try { return new URL(u); } catch { return null; } }).filter(Boolean);
    };
    const run = () => {
      const list = parse(urls.value);
      if (!list.length) { out.textContent = ''; info.textContent = 'Paste your sitemap.xml or a list of page URLs.'; info.className = 'note'; return; }
      const origin = list[0].origin;
      // Group pages by their first path segment; the home page stands alone.
      const groups = new Map();
      for (const u of list) {
        const parts = u.pathname.split('/').filter(Boolean);
        if (!parts.length) continue;
        const key = parts.length > 1 ? titleCase(parts[0]) : 'Pages';
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(u);
      }
      const optional = /^(Legal|Privacy|Terms|Tags?|Category|Categories|Author|Authors|Page|Archive)$/i;
      const sections = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
      const line = (u) => `- [${titleCase(u.pathname.split('/').filter(Boolean).pop() || 'Home')}](${u.href})`;
      const main = sections.filter(([k]) => !optional.test(k)).map(([k, us]) => `## ${k}\n${us.map(line).join('\n')}`).join('\n\n');
      const opt = sections.filter(([k]) => optional.test(k)).flatMap(([, us]) => us).map(line).join('\n');
      out.textContent = `# ${name.value.trim() || new URL(origin).hostname}\n\n> ${summary.value.trim() || 'One sentence on what this site is and who it is for.'}\n${details.value.trim() ? `\n${details.value.trim()}\n` : ''}\n${main}${opt ? `\n\n## Optional\n${opt}` : ''}\n`;
      info.textContent = `${list.length} pages in ${sections.length} section${sections.length === 1 ? '' : 's'}. Edit the link titles and add a short note after each one where it helps.`;
      info.className = 'note';
    };
    [urls, name, summary, details].forEach((el) => el.addEventListener('input', run));
    run();
  }

  // ---------- Git command finder ----------
  if ($('git-search')) {
    const input = $('git-search'); const items = [...document.querySelectorAll('.git-item')]; const count = $('git-count');
    const norm = (s) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ');
    const run = () => {
      const words = norm(input.value).split(/\s+/).filter((w) => w.length > 1 && !['i', 'my', 'a', 'the', 'to', 'git', 'how', 'do', 'in', 'of', 'and', 'want'].includes(w));
      let shown = 0;
      for (const it of items) {
        const hay = norm(it.dataset.search);
        const ok = !words.length || words.every((w) => hay.includes(w) || hay.includes(w.replace(/s$/, '')));
        it.hidden = !ok;
        if (ok) shown += 1;
      }
      count.textContent = words.length ? `${shown} match${shown === 1 ? '' : 'es'}` : `${items.length} situations`;
      if (words.length && shown === 1) items.find((i) => !i.hidden).open = true;
    };
    input.addEventListener('input', run);
    // Opening a situation from a link (#undo-last-commit-keep-changes) shows it straight away.
    const open = () => { const el = location.hash ? document.getElementById(location.hash.slice(1)) : null; if (el?.classList.contains('git-item')) { el.open = true; el.scrollIntoView({ block: 'center' }); } };
    addEventListener('hashchange', open);
    open();
    run();
  }

  // ---------- CIDR / subnet calculator ----------
  if ($('cidr-in')) {
    const input = $('cidr-in'); const out = $('cidr-out'); const info = $('cidr-info'); const splitTo = $('cidr-split'); const subnets = $('cidr-subnets'); const check = $('cidr-check'); const checkOut = $('cidr-check-out');
    const toInt = (ip) => {
      const parts = ip.trim().split('.');
      if (parts.length !== 4 || parts.some((p) => !/^\d{1,3}$/.test(p) || Number(p) > 255)) return null;
      return parts.reduce((n, p) => n * 256 + Number(p), 0);
    };
    const toIp = (n) => [24, 16, 8, 0].map((s) => Math.floor(n / 2 ** s) % 256).join('.');
    const parse = (text) => {
      const m = text.trim().match(/^(\d+\.\d+\.\d+\.\d+)(?:\/(\d{1,2}))?$/);
      if (!m) return null;
      const ip = toInt(m[1]); const prefix = m[2] === undefined ? 32 : Number(m[2]);
      if (ip === null || prefix > 32) return null;
      const size = 2 ** (32 - prefix);
      const network = Math.floor(ip / size) * size;
      return { ip, prefix, size, network, broadcast: network + size - 1 };
    };
    const kind = (n) => {
      const a = Math.floor(n / 2 ** 24); const b = Math.floor(n / 2 ** 16) % 256;
      if (a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) return 'Private (RFC 1918)';
      if (a === 127) return 'Loopback';
      if (a === 169 && b === 254) return 'Link-local';
      if (a === 100 && b >= 64 && b <= 127) return 'Carrier-grade NAT (RFC 6598)';
      if (a >= 224 && a <= 239) return 'Multicast';
      return 'Public';
    };
    const run = () => {
      const c = parse(input.value);
      if (!c) { out.innerHTML = ''; subnets.innerHTML = ''; info.textContent = 'Write an IPv4 range like 10.0.0.0/16 or 192.168.1.10/24.'; info.className = 'note bad'; return; }
      info.textContent = c.ip !== c.network ? `${toIp(c.ip)} is inside ${toIp(c.network)}/${c.prefix}.` : '';
      info.className = 'note';
      const mask = c.prefix === 0 ? 0 : (2 ** 32 - 2 ** (32 - c.prefix));
      const usable = c.prefix >= 31 ? c.size : c.size - 2;
      const rows = [
        ['Network', `${toIp(c.network)}/${c.prefix}`], ['Netmask', toIp(mask)], ['Wildcard', toIp(2 ** 32 - 1 - mask)],
        ['First usable', toIp(c.prefix >= 31 ? c.network : c.network + 1)], ['Last usable', toIp(c.prefix >= 31 ? c.broadcast : c.broadcast - 1)], ['Broadcast', c.prefix >= 31 ? 'none' : toIp(c.broadcast)],
        ['Addresses', c.size.toLocaleString()], ['Usable hosts', usable.toLocaleString()], ['Type', kind(c.network)],
        ['Binary mask', toIp(mask).split('.').map((o) => Number(o).toString(2).padStart(8, '0')).join('.')],
      ];
      out.innerHTML = rows.map(([k, v], i) => `<li><span>${k}</span><output id="cidr-v${i}">${v}</output><button type="button" class="btn btn-quiet btn-sm" data-copy-from="cidr-v${i}">Copy</button></li>`).join('');
      // Split into smaller subnets.
      const to = Number(splitTo.value);
      if (to > c.prefix && to <= 32) {
        const n = 2 ** (to - c.prefix); const step = 2 ** (32 - to);
        const shown = Math.min(n, 64);
        subnets.innerHTML = `<p class="note">${n.toLocaleString()} subnets of /${to} (${step.toLocaleString()} addresses each)${n > shown ? `, first ${shown} shown` : ''}.</p><ol>${Array.from({ length: shown }, (_, i) => `<li><code>${toIp(c.network + i * step)}/${to}</code></li>`).join('')}</ol>`;
      } else subnets.innerHTML = `<p class="note">Pick a prefix longer than /${c.prefix} to split this range.</p>`;
      const ip = toInt(check.value);
      checkOut.textContent = !check.value.trim() ? '' : ip === null ? 'That is not an IPv4 address.' : ip >= c.network && ip <= c.broadcast ? `Yes, ${check.value.trim()} is in this range.` : `No, ${check.value.trim()} is outside this range.`;
      checkOut.className = `note ${ip !== null && ip >= c.network && ip <= c.broadcast ? 'ok' : check.value.trim() ? 'bad' : ''}`;
    };
    [input, splitTo, check].forEach((el) => el.addEventListener('input', run));
    document.querySelectorAll('[data-cidr]').forEach((b) => b.addEventListener('click', () => { input.value = b.dataset.cidr; run(); }));
    run();
  }
})();
