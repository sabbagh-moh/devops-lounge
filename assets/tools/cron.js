// Cron builder: explains a cron expression in plain words and lists the next run times, in the visitor's time zone.
(() => {
  const root = document.getElementById('cron-tool');
  if (!root) return;
  const input = root.querySelector('#cron-expr');
  const say = root.querySelector('#cron-say');
  const next = root.querySelector('#cron-next');
  const fields = [...root.querySelectorAll('.cron-field')];
  const tz = root.querySelector('#cron-tz');

  const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const SPEC = [
    { name: 'minute', min: 0, max: 59 }, { name: 'hour', min: 0, max: 23 }, { name: 'day of month', min: 1, max: 31 },
    { name: 'month', min: 1, max: 12, names: MONTHS }, { name: 'day of week', min: 0, max: 7, names: DAYS },
  ];
  const ALIASES = { '@yearly': '0 0 1 1 *', '@annually': '0 0 1 1 *', '@monthly': '0 0 1 * *', '@weekly': '0 0 * * 0', '@daily': '0 0 * * *', '@midnight': '0 0 * * *', '@hourly': '0 * * * *' };

  function parseField(raw, spec) {
    const values = new Set();
    for (const part of raw.split(',')) {
      const [range, stepRaw] = part.split('/');
      const step = stepRaw === undefined ? 1 : Number(stepRaw);
      if (!Number.isInteger(step) || step < 1) throw new Error(`Bad step in the ${spec.name} field`);
      let lo; let hi;
      const val = (v) => {
        const up = v.toUpperCase();
        const named = spec.names ? spec.names.indexOf(up) : -1;
        const n = named >= 0 ? named + (spec.name === 'month' ? 1 : 0) : Number(v);
        if (!Number.isInteger(n) || n < spec.min || n > spec.max) throw new Error(`"${v}" is not a valid ${spec.name}`);
        return n;
      };
      if (range === '*') { lo = spec.min; hi = spec.max; } else if (range.includes('-')) { [lo, hi] = range.split('-').map(val); } else { lo = val(range); hi = stepRaw === undefined ? lo : spec.max; }
      if (lo > hi) throw new Error(`The ${spec.name} range runs backwards`);
      for (let n = lo; n <= hi; n += step) values.add(spec.name === 'day of week' && n === 7 ? 0 : n);
    }
    return values;
  }

  function parse(expr) {
    const text = ALIASES[expr.trim().toLowerCase()] ?? expr.trim();
    const parts = text.split(/\s+/);
    if (parts.length !== 5) throw new Error('A cron expression has 5 fields: minute, hour, day of month, month, day of week.');
    const sets = parts.map((p, i) => parseField(p, SPEC[i]));
    return { parts, sets, domAny: parts[2] === '*', dowAny: parts[4] === '*' };
  }

  const pad = (n) => String(n).padStart(2, '0');
  const joinWords = (a) => (a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a.at(-1)}`);
  // 1,2,3,4,5 reads better as "Monday through Friday".
  const runs = (nums, name) => {
    const sorted = [...nums].sort((a, b) => a - b);
    const out = [];
    for (let i = 0; i < sorted.length;) {
      let j = i;
      while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j += 1;
      if (j - i >= 2) out.push(`${name(sorted[i])} through ${name(sorted[j])}`);
      else out.push(...sorted.slice(i, j + 1).map(name));
      i = j + 1;
    }
    return joinWords(out);
  };
  const ordinal = (n) => `${n}${['th', 'st', 'nd', 'rd'][(n % 100 > 10 && n % 100 < 14) ? 0 : n % 10 < 4 ? n % 10 : 0]}`;

  function describe(c) {
    const [mi, ho, dom, mo, dow] = c.parts;
    let time;
    const minutes = [...c.sets[0]];
    const hours = [...c.sets[1]];
    if (mi === '*' && ho === '*') time = 'Every minute';
    else if (/^\*\/\d+$/.test(mi) && ho === '*') time = `Every ${mi.slice(2)} minutes`;
    else if (ho === '*') time = `At minute ${joinWords(minutes.map(String))} of every hour`;
    else if (/^\*\/\d+$/.test(ho) && minutes.length === 1) time = `Every ${ho.slice(2)} hours at minute ${minutes[0]}`;
    else if (minutes.length === 1 && hours.length <= 6) time = `At ${joinWords(hours.map((h) => `${pad(h)}:${pad(minutes[0])}`))}`;
    else time = `At minute ${joinWords(minutes.map(String))} past hour ${joinWords(hours.map(String))}`;
    const bits = [time];
    if (!c.dowAny) bits.push(`on ${runs(c.sets[4], (d) => DAY_NAMES[d])}`);
    if (!c.domAny) bits.push(`${c.dowAny ? 'on' : 'or on'} the ${joinWords([...c.sets[2]].map(ordinal))} of the month`);
    if (mo !== '*') bits.push(`in ${runs(c.sets[3], (m) => MONTH_NAMES[m - 1])}`);
    return `${bits.join(' ')}.`;
  }

  function matches(c, d) {
    if (!c.sets[0].has(d.getMinutes()) || !c.sets[1].has(d.getHours()) || !c.sets[3].has(d.getMonth() + 1)) return false;
    const domOk = c.sets[2].has(d.getDate());
    const dowOk = c.sets[4].has(d.getDay());
    // Standard cron: when both day fields are set, either one may match.
    if (!c.domAny && !c.dowAny) return domOk || dowOk;
    return (c.domAny || domOk) && (c.dowAny || dowOk);
  }

  function upcoming(c, count = 5) {
    const runs = [];
    const d = new Date();
    d.setSeconds(0, 0);
    d.setMinutes(d.getMinutes() + 1);
    for (let i = 0; i < 60 * 24 * 366 * 2 && runs.length < count; i += 1) {
      if (matches(c, d)) runs.push(new Date(d));
      d.setMinutes(d.getMinutes() + 1);
    }
    return runs;
  }

  const fmt = new Intl.DateTimeFormat(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  // ---------- the same schedule for systemd, GitHub Actions and Kubernetes ----------
  const SYS_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const sysField = (raw, set, min, width) => {
    if (raw === '*') return '*';
    const step = raw.match(/^\*\/(\d+)$/);
    if (step) return `${String(min).padStart(width, '0')}/${step[1]}`;
    return [...set].sort((a, b) => a - b).map((n) => String(n).padStart(width, '0')).join(',');
  };
  function systemd(c) {
    const [mi, ho, dom, mo, dow] = c.parts;
    const days = c.dowAny ? '' : `${[...c.sets[4]].sort((a, b) => a - b).map((d) => SYS_DAYS[d]).join(',')} `;
    const onCalendar = `${days}*-${sysField(mo, c.sets[3], 1, 2)}-${sysField(dom, c.sets[2], 1, 2)} ${sysField(ho, c.sets[1], 0, 2)}:${sysField(mi, c.sets[0], 0, 2)}:00`;
    const warn = !c.domAny && !c.dowAny ? '\n# Note: cron runs when EITHER the day of month OR the weekday matches; systemd needs BOTH. Split it into two OnCalendar lines if you need the cron behavior.' : '';
    return `# /etc/systemd/system/my-job.timer\n[Unit]\nDescription=Run my-job on a schedule\n\n[Timer]\nOnCalendar=${onCalendar}\nPersistent=true\n\n[Install]\nWantedBy=timers.target${warn}\n\n# Check it with: systemd-analyze calendar "${onCalendar}"\n# Enable it with: sudo systemctl enable --now my-job.timer`;
  }
  // GitHub Actions always reads cron in UTC, so a local schedule has to be shifted.
  function github(c, expr) {
    const offset = -new Date().getTimezoneOffset();
    const [mi, ho, dom, mo, dow] = c.parts;
    const head = 'on:\n  schedule:\n';
    if (offset === 0) return `${head}    - cron: '${expr}'\n\n# Your time zone is UTC, so no change is needed. Runs can start a few minutes late when GitHub is busy.`;
    const minutes = [...c.sets[0]]; const hours = [...c.sets[1]];
    const simple = minutes.length === 1 && !/[*/]/.test(mi) && !/[*/]/.test(ho);
    if (!simple) return `${head}    - cron: '${expr}'\n\n# GitHub runs schedules in UTC and you are UTC${offset > 0 ? '+' : '-'}${Math.abs(offset / 60)}. This expression repeats through the day, so it may not need shifting; check that the hours still make sense in UTC.`;
    const shifted = hours.map((h) => h * 60 + minutes[0] - offset);
    const dayShift = Math.floor(shifted[0] / 1440);
    if (shifted.some((t) => Math.floor(t / 1440) !== dayShift) || (dayShift !== 0 && !c.domAny)) return `${head}    - cron: '${expr}'\n\n# GitHub runs schedules in UTC. This one crosses midnight when shifted from your time zone, so convert it by hand: subtract ${offset / 60} hours.`;
    const norm = shifted.map((t) => ((t % 1440) + 1440) % 1440);
    const newMin = norm[0] % 60; const newHours = [...new Set(norm.map((t) => Math.floor(t / 60)))].sort((a, b) => a - b);
    const newDow = c.dowAny || dayShift === 0 ? dow : [...c.sets[4]].map((d) => (d + dayShift + 7) % 7).sort((a, b) => a - b).join(',');
    const utc = `${newMin} ${newHours.join(',')} ${dom} ${mo} ${newDow}`;
    return `${head}    - cron: '${utc}'\n\n# Same moment as '${expr}' in your time zone (UTC${offset > 0 ? '+' : '-'}${Math.abs(offset / 60)}), written in UTC because GitHub always uses UTC.\n# Runs can start a few minutes late when GitHub is busy, and the shortest interval is every 5 minutes.`;
  }
  const k8s = (expr, zone) => `apiVersion: batch/v1\nkind: CronJob\nmetadata:\n  name: my-job\nspec:\n  schedule: "${expr}"\n  timeZone: "${zone}"\n  concurrencyPolicy: Forbid\n  successfulJobsHistoryLimit: 3\n  failedJobsHistoryLimit: 3\n  jobTemplate:\n    spec:\n      backoffLimit: 2\n      template:\n        spec:\n          restartPolicy: OnFailure\n          containers:\n            - name: my-job\n              image: your-image:tag\n              command: ["/bin/sh", "-c", "echo running"]`;
  const more = root.querySelector('#cron-more');
  function renderMore(c, expr) {
    if (!more) return;
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    more.innerHTML = [['systemd timer', systemd(c)], ['GitHub Actions (UTC)', github(c, expr)], ['Kubernetes CronJob', k8s(expr, zone)]]
      .map(([title, code], i) => `<div class="cron-alt"><div class="cron-alt-head"><b>${title}</b><button type="button" class="btn btn-quiet btn-sm" data-copy-from="cron-alt-${i}">Copy</button></div><pre class="out" id="cron-alt-${i}"></pre></div>`).join('');
    [systemd(c), github(c, expr), k8s(expr, zone)].forEach((code, i) => { more.querySelector(`#cron-alt-${i}`).textContent = code; });
  }

  function render(fromFields = false) {
    if (fromFields) input.value = fields.map((f) => f.value.trim() || '*').join(' ');
    else {
      const parts = (ALIASES[input.value.trim().toLowerCase()] ?? input.value.trim()).split(/\s+/);
      if (parts.length === 5) fields.forEach((f, i) => { f.value = parts[i]; });
    }
    try {
      const c = parse(input.value);
      say.textContent = describe(c);
      say.classList.remove('bad');
      const runs = upcoming(c);
      next.innerHTML = runs.length ? runs.map((r) => `<li>${fmt.format(r)}</li>`).join('') : '<li>No run in the next two years. Check the day and month fields.</li>';
      renderMore(c, (ALIASES[input.value.trim().toLowerCase()] ?? input.value.trim()).replace(/\s+/g, ' '));
    } catch (e) {
      say.textContent = e.message;
      say.classList.add('bad');
      next.innerHTML = '';
    }
  }

  tz.textContent = Intl.DateTimeFormat().resolvedOptions().timeZone;
  input.addEventListener('input', () => render(false));
  fields.forEach((f) => f.addEventListener('input', () => render(true)));
  root.querySelectorAll('[data-cron]').forEach((b) => b.addEventListener('click', () => { input.value = b.dataset.cron; render(false); }));
  render(false);
})();
