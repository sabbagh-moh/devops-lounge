// Prompt Builder: turns a rough idea into a structured prompt. No AI and no network: it reads the idea for
// languages, frameworks, error messages and visual words, then assembles a prompt from proven parts.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const LANGS = [
    ['TypeScript', /\b(typescript|\.tsx?\b|ts\b)/i], ['JavaScript', /(\bjavascript\b|(^|[\s(])js\b|\bnode(\.js)?\b)/i], ['Python', /\b(python|\.py\b|pip|django|flask|fastapi|pandas)\b/i],
    ['Go', /\b(golang|go\s+(module|func|routine)|goroutine)\b/i], ['Rust', /\b(rust|cargo|\.rs\b)\b/i], ['Java', /\b(java(?!script)|spring|maven|gradle)\b/i],
    ['Kotlin', /\bkotlin\b/i], ['Swift', /\b(swift|swiftui|ios app)\b/i], ['C#', /(c#|\.net|dotnet|asp\.net)/i], ['C++', /(c\+\+|cpp)/i], ['PHP', /\b(php|laravel|wordpress)\b/i],
    ['Ruby', /\b(ruby|rails)\b/i], ['Dart', /\b(dart|flutter)\b/i], ['SQL', /\b(sql|postgres|mysql|sqlite|query)\b/i], ['Bash', /\b(bash|shell script|zsh|\.sh\b)\b/i],
  ];
  const TECH = [
    'React', 'Next.js', 'Vue', 'Nuxt', 'Angular', 'Svelte', 'Express', 'NestJS', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'Laravel', 'Rails', 'Flutter', 'React Native',
    'Tailwind', 'GraphQL', 'Prisma', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'Terraform', 'AWS', 'GCP', 'Azure', 'GitHub Actions', 'Nginx', 'Firebase', 'Supabase', 'Stripe',
  ];
  const techRe = (t) => new RegExp(`\\b${t.replace(/[.+]/g, (c) => `\\${c}`).replace(/\s/g, '[\\s-]?')}\\b`, 'i');
  const VISUAL = {
    style: [['Photo', /\b(photo|photograph|realistic|real)\b/i], ['Cinematic', /\b(cinematic|film|movie)\b/i], ['3D render', /\b(3d|render|blender|octane)\b/i], ['Illustration', /\b(illustration|drawing|vector)\b/i], ['Anime', /\b(anime|manga)\b/i], ['Pixel art', /\bpixel\b/i], ['Watercolor', /\bwatercolou?r\b/i], ['Flat logo', /\b(logo|icon|flat)\b/i]],
    light: [['Golden hour', /\b(sunset|sunrise|golden)\b/i], ['Neon night', /\b(neon|night|cyberpunk)\b/i], ['Studio softbox', /\b(studio|product shot)\b/i], ['Overcast', /\b(cloudy|overcast|rain)\b/i], ['Dramatic rim light', /\b(dramatic|moody|dark)\b/i]],
  };

  const MODES = {
    image: { label: 'Image', placeholder: 'A barista pouring latte art in a small Beirut café, morning light', },
    code: { label: 'Write code', placeholder: 'A React hook that debounces a search input and cancels old fetch requests', },
    debug: { label: 'Fix a bug', placeholder: 'My Express API returns 500 when the body is empty. Paste the error below if you have it.', },
    refactor: { label: 'Refactor', placeholder: 'Clean up a 200-line Python function that parses CSV files and sends emails', },
    security: { label: 'Security review', placeholder: 'Review the login and password reset flow of my Next.js app with Prisma', },
    explain: { label: 'Explain', placeholder: 'How does a Kubernetes Service route traffic to Pods?', },
  };

  const OPTIONS = {
    image: [
      ['Model', 'model', ['Midjourney', 'ChatGPT / DALL·E', 'Stable Diffusion', 'Flux'], 'single'],
      ['Style', 'style', VISUAL.style.map((s) => s[0]), 'single'],
      ['Light', 'light', VISUAL.light.map((s) => s[0]), 'single'],
      ['Camera', 'camera', ['35mm street', '85mm portrait', '24mm wide', 'Macro close-up', 'Drone aerial', 'Low angle'], 'single'],
      ['Aspect', 'aspect', ['1:1', '16:9', '9:16', '4:5', '3:2'], 'single'],
    ],
    code: [
      ['Output', 'output', ['Complete file', 'One function', 'Step by step'], 'single'],
      ['Also', 'extras', ['Include tests', 'Handle errors', 'Add types', 'No new libraries', 'Explain trade-offs', 'Comment the tricky parts'], 'multi'],
    ],
    debug: [
      ['Also', 'extras', ['Explain the root cause', 'Smallest possible fix', 'Show how to verify', 'Suggest a test that catches it'], 'multi'],
    ],
    refactor: [
      ['Goals', 'goals', ['Readability', 'Smaller functions', 'Remove duplication', 'Better names', 'Stronger types', 'Performance'], 'multi'],
      ['Show', 'output', ['Full new version', 'A diff', 'A plan first'], 'single'],
    ],
    security: [
      ['Focus', 'focus', ['OWASP Top 10', 'Injection', 'Auth and sessions', 'Access control', 'Secrets', 'Input validation', 'XSS', 'SSRF', 'Dependencies'], 'multi'],
      ['Exposure', 'exposure', ['Public internet', 'Internal tool', 'Handles payments or personal data'], 'single'],
    ],
    explain: [
      ['Level', 'level', ['New to this', 'Some experience', 'Expert'], 'single'],
      ['Format', 'format', ['Step by step', 'Analogy first', 'With a diagram', 'With a small example'], 'multi'],
    ],
  };
  const DEFAULTS = {
    image: { model: 'Midjourney', aspect: '16:9' }, code: { output: 'Complete file', extras: ['Handle errors'] }, debug: { extras: ['Explain the root cause', 'Smallest possible fix', 'Show how to verify'] },
    refactor: { goals: ['Readability', 'Smaller functions'], output: 'A diff' }, security: { focus: ['OWASP Top 10'], exposure: 'Public internet' }, explain: { level: 'Some experience', format: ['Step by step', 'With a small example'] },
  };

  const root = $('#prompt-tool');
  if (!root) return;
  const idea = $('#pb-idea', root);
  const err = $('#pb-error', root);
  const errWrap = $('#pb-error-wrap', root);
  const out = $('#pb-out', root);
  const optsBox = $('#pb-options', root);
  const detected = $('#pb-detected', root);
  const checks = $('#pb-checks', root);
  const scoreEl = $('#pb-score', root);
  const ring = $('#pb-ring', root);
  let mode = 'code';
  let picks = structuredClone(DEFAULTS);

  function renderOptions() {
    optsBox.innerHTML = OPTIONS[mode].map(([label, key, values, kind]) => `
      <div class="pb-row"><span class="pb-label">${label}</span><div class="pills" data-key="${key}" data-kind="${kind}">
      ${values.map((v) => `<button type="button" class="pill${[].concat(picks[mode][key] ?? []).includes(v) ? ' on' : ''}" aria-pressed="${[].concat(picks[mode][key] ?? []).includes(v)}">${v}</button>`).join('')}
      </div></div>`).join('');
  }

  optsBox.addEventListener('click', (e) => {
    const b = e.target.closest('.pill');
    if (!b) return;
    const group = b.parentElement;
    const { key, kind } = group.dataset;
    const v = b.textContent;
    if (picks[mode]._auto) delete picks[mode]._auto[key];
    if (kind === 'single') picks[mode][key] = picks[mode][key] === v ? undefined : v;
    else {
      const list = new Set(picks[mode][key] ?? []);
      list.has(v) ? list.delete(v) : list.add(v);
      picks[mode][key] = [...list];
    }
    renderOptions();
    build();
  });

  $$('.seg button', root).forEach((b) => b.addEventListener('click', () => {
    mode = b.dataset.mode;
    $$('.seg button', root).forEach((x) => x.setAttribute('aria-selected', x === b));
    idea.placeholder = MODES[mode].placeholder;
    errWrap.hidden = mode !== 'debug';
    renderOptions();
    build();
  }));

  function detect(text) {
    const langs = LANGS.filter(([, re]) => re.test(text)).map(([n]) => n);
    // JavaScript is implied by TypeScript; keep the more specific one.
    if (langs.includes('TypeScript')) langs.splice(langs.indexOf('JavaScript'), langs.includes('JavaScript') ? 1 : 0);
    const tech = TECH.filter((t) => techRe(t).test(text));
    const errorLine = (text.match(/^.*(Error|Exception|Traceback|panic:|FATAL|undefined is not|cannot read propert).*$/im) || [])[0];
    return { langs, tech, errorLine };
  }

  const clean = (s) => s.trim().replace(/\s+/g, ' ').replace(/[.\s]+$/, '');
  const list = (items) => items.map((i) => `- ${i}`).join('\n');
  const stack = (d) => [...d.langs, ...d.tech].join(', ');

  function imagePrompt(text, p) {
    const subject = clean(text) || 'your subject';
    const parts = [subject];
    // Options the builder picked from the user's own words are already in the subject, so they are not repeated.
    const auto = p._auto ?? {};
    if (p.style && !auto.style) parts.push({ Photo: 'photorealistic photograph', Cinematic: 'cinematic film still', '3D render': 'detailed 3D render', Illustration: 'clean editorial illustration', Anime: 'anime style', 'Pixel art': '16-bit pixel art', Watercolor: 'loose watercolor painting', 'Flat logo': 'flat vector logo, simple shapes, solid colors' }[p.style]);
    if (p.light && !auto.light) parts.push({ 'Golden hour': 'warm golden hour light, long soft shadows', 'Neon night': 'neon-lit night, reflections on wet streets', 'Studio softbox': 'soft studio lighting, clean background', Overcast: 'soft overcast daylight', 'Dramatic rim light': 'dramatic rim lighting, deep shadows' }[p.light]);
    if (p.camera) parts.push({ '35mm street': 'shot on a 35mm lens at eye level', '85mm portrait': '85mm portrait lens, shallow depth of field', '24mm wide': '24mm wide angle, sense of space', 'Macro close-up': 'macro close-up, fine texture detail', 'Drone aerial': 'aerial drone view', 'Low angle': 'low camera angle looking up' }[p.camera]);
    if (p.style !== 'Flat logo') parts.push('natural color, sharp focus on the subject, thoughtful composition');
    const body = parts.join(', ');
    const negative = 'blurry, low resolution, extra fingers, distorted faces, watermark, text, logo';
    switch (p.model) {
      case 'Midjourney': return `${body} --ar ${p.aspect ?? '1:1'}${p.style === 'Photo' || p.style === 'Cinematic' ? ' --style raw' : ''} --no text, watermark`;
      case 'Stable Diffusion': return `${body}, highly detailed\n\nNegative prompt: ${negative}\nAspect ratio: ${p.aspect ?? '1:1'}`;
      case 'Flux': return `${body}. Aspect ratio ${p.aspect ?? '1:1'}. No text or watermark in the image.`;
      default: return `Create an image of ${subject}.\n\nStyle: ${parts.slice(1).join('; ') || 'your choice, but keep it natural'}.\nFormat: ${p.aspect ?? '1:1'}.\nAvoid: text in the image, watermarks, distorted hands or faces.`;
    }
  }

  function codePrompt(text, p, d) {
    const lang = d.langs[0];
    const role = `You are a senior ${lang ?? 'software'} engineer${d.tech.length ? ` who works with ${d.tech.join(', ')}` : ''}.`;
    const output = { 'Complete file': 'Return one complete, runnable file.', 'One function': 'Return only the function and its imports.', 'Step by step': 'Explain the approach in a few steps, then give the code.' }[p.output] ?? 'Return the code, then a short explanation.';
    const extras = { 'Include tests': 'Include unit tests for the main paths and one edge case.', 'Handle errors': 'Handle errors and invalid input explicitly.', 'Add types': 'Use precise types; avoid any/unknown escapes.', 'No new libraries': 'Do not add new dependencies.', 'Explain trade-offs': 'Note the main trade-off you made and one alternative.', 'Comment the tricky parts': 'Comment only the non-obvious parts.' };
    return `${role}

## Task
${clean(text) || 'Describe what the code should do.'}

## Context
- Stack: ${stack(d) || 'not stated (ask me if it matters)'}
- Follow the conventions already common in this stack.

## Requirements
${list([...(p.extras ?? []).map((e) => extras[e]), 'Keep it simple and readable; no clever tricks.'])}

## Output
${output}
If anything is ambiguous, list your assumptions before the code.`;
  }

  function debugPrompt(text, p, d) {
    const error = err.value.trim() || d.errorLine;
    const extras = { 'Explain the root cause': 'Explain the root cause in one or two sentences before any code.', 'Smallest possible fix': 'Propose the smallest fix that solves it; do not rewrite unrelated code.', 'Show how to verify': 'Tell me exactly how to confirm the fix works.', 'Suggest a test that catches it': 'Suggest a test that would have caught this bug.' };
    return `You are an experienced ${d.langs[0] ?? ''} debugger. Help me find and fix a bug.

## What is happening
${clean(text) || 'Describe what goes wrong.'}
${error ? `\n## Error\n\`\`\`\n${error}\n\`\`\`\n` : ''}
## Environment
- Stack: ${stack(d) || 'not stated'}

## How to answer
${list([...(p.extras ?? []).map((e) => extras[e]), 'If you need more information (code, logs, versions), ask for the specific piece instead of guessing.'])}`;
  }

  function refactorPrompt(text, p, d) {
    const goals = { Readability: 'make it easier to read', 'Smaller functions': 'split it into small, single-purpose functions', 'Remove duplication': 'remove duplicated logic', 'Better names': 'use clear, descriptive names', 'Stronger types': 'add or tighten types', Performance: 'remove obvious performance waste' };
    const output = { 'Full new version': 'Return the full refactored code.', 'A diff': 'Return the changes as a unified diff.', 'A plan first': 'First list the changes you plan and why. Wait for my OK before writing code.' }[p.output] ?? 'Return the refactored code.';
    return `You are a careful ${d.langs[0] ?? ''} engineer refactoring existing code.

## Code to refactor
${clean(text) || 'Describe or paste the code.'}

## Goals
${list((p.goals ?? []).map((g) => goals[g]))}

## Rules
- Keep the behavior exactly the same. No new features.
- Keep the public interface unless I say otherwise.
- Point out anything that looks like an existing bug instead of silently changing it.

## Output
${output}`;
  }

  function securityPrompt(text, p, d) {
    const focus = p.focus?.length ? p.focus : ['OWASP Top 10'];
    return `You are an application security reviewer. Review the following for vulnerabilities.

## What to review
${clean(text) || 'Describe or paste the code or flow.'}

## Context
- Stack: ${stack(d) || 'not stated'}
- Exposure: ${p.exposure ?? 'not stated'}

## Focus on
${list(focus)}

## Report
For each finding give: severity (critical, high, medium, low), where it is, how it could be exploited in one sentence, and the fix with a code example.
Order findings by severity. Do not list theoretical issues without a plausible attack path. End with the three changes that reduce the most risk.`;
  }

  function explainPrompt(text, p, d) {
    const level = { 'New to this': 'someone new to programming', 'Some experience': 'a developer with some experience', Expert: 'an experienced engineer who wants the details' }[p.level] ?? 'a developer';
    const formats = { 'Step by step': 'Go step by step.', 'Analogy first': 'Start with a real-world analogy.', 'With a diagram': 'Include a small Mermaid diagram.', 'With a small example': 'Include one small, runnable example.' };
    return `Explain this to ${level}:

${clean(text) || 'What do you want explained?'}

${list([...(p.format ?? []).map((f) => formats[f]), 'Keep it short; use plain words and define any term you introduce.', d.tech.length || d.langs.length ? `Use ${stack(d)} in the examples.` : 'Pick the most common tool for the examples and say which one.'])}
End with one question I can answer to check I understood.`;
  }

  const BUILD = { image: imagePrompt, code: codePrompt, debug: debugPrompt, refactor: refactorPrompt, security: securityPrompt, explain: explainPrompt };

  function quality(text, d) {
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const p = picks[mode];
    const items = {
      image: [['Says what is in the picture', words >= 4], ['Picks a style', !!p.style], ['Sets the light', !!p.light], ['Sets the camera or angle', !!p.camera], ['Sets the aspect ratio', !!p.aspect]],
      code: [['Describes the task in a full sentence', words >= 8], ['Names the language', d.langs.length > 0], ['Names the framework or tools', d.tech.length > 0], ['Defines the output', !!p.output], ['Asks for error handling or tests', (p.extras ?? []).some((e) => /tests|errors/.test(e))]],
      debug: [['Says what happens', words >= 6], ['Includes the error message', !!(err.value.trim() || d.errorLine)], ['Names the language or framework', d.langs.length + d.tech.length > 0], ['Asks for the root cause', (p.extras ?? []).includes('Explain the root cause')], ['Asks how to verify', (p.extras ?? []).includes('Show how to verify')]],
      refactor: [['Describes the code', words >= 6], ['Names the language', d.langs.length > 0], ['Sets clear goals', (p.goals ?? []).length > 0], ['Keeps behavior the same', true], ['Picks the output form', !!p.output]],
      security: [['Describes what to review', words >= 6], ['Names the stack', d.langs.length + d.tech.length > 0], ['States the exposure', !!p.exposure], ['Sets a focus', (p.focus ?? []).length > 0], ['Asks for severity and fixes', true]],
      explain: [['Asks a clear question', words >= 4], ['Sets the level', !!p.level], ['Picks a format', (p.format ?? []).length > 0], ['Names a tool for examples', d.langs.length + d.tech.length > 0]],
    }[mode];
    return items;
  }

  function build() {
    const text = idea.value + (mode === 'debug' ? `\n${err.value}` : '');
    const d = detect(text);
    out.textContent = BUILD[mode](idea.value, picks[mode], d);
    const found = [...d.langs, ...d.tech];
    detected.innerHTML = found.length ? `Spotted: ${found.map((f) => `<b>${f}</b>`).join(' ')}` : (mode === 'image' ? 'Tip: name the subject, the place and the mood.' : 'Tip: mention the language and framework, and the bot will pick them up.');
    const items = quality(text, d);
    const passed = items.filter(([, ok]) => ok).length;
    const score = Math.round((passed / items.length) * 100);
    scoreEl.textContent = score;
    ring.style.setProperty('--p', score);
    checks.innerHTML = items.map(([label, ok]) => `<li class="${ok ? 'ok' : ''}">${label}</li>`).join('');
  }

  // Visual words in an image idea pick their option automatically, unless the user already chose one.
  idea.addEventListener('input', () => {
    if (mode === 'image') {
      for (const [key, list] of Object.entries(VISUAL)) {
        const hit = list.find(([, re]) => re.test(idea.value));
        if (hit && !picks.image[key]) { picks.image[key] = hit[0]; picks.image._auto = { ...picks.image._auto, [key]: true }; renderOptions(); }
      }
    }
    build();
  });
  err.addEventListener('input', build);

  $('#pb-copy', root).addEventListener('click', async (e) => {
    const b = e.currentTarget;
    try { await navigator.clipboard.writeText(out.textContent); b.textContent = 'Copied'; } catch { b.textContent = 'Select and copy'; }
    setTimeout(() => { b.textContent = 'Copy prompt'; }, 1600);
  });

  const start = new URLSearchParams(location.search).get('mode');
  const first = $(`.seg button[data-mode="${MODES[start] ? start : 'code'}"]`, root);
  first.click();
})();
