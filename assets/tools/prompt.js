// Prompt Builder: reads a rough idea and turns it into a complete prompt. No AI and no network.
// It works out what is being asked (a project, code, a fix, a review, an explanation or an image),
// picks up the stack, references, style and mood from the words, and fills in what experts would add.
(() => {
  const KB = window.PB_KB;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = $('#prompt-tool');
  if (!root || !KB) return;

  // ---------- reading the idea ----------
  const LANGS = [
    ['TypeScript', /\b(typescript|\.tsx?\b|ts\b)/i], ['JavaScript', /(\bjavascript\b|(^|[\s(])js\b|\bnode(\.js)?\b)/i], ['Python', /\b(python|\.py\b|pip|django|flask|fastapi|pandas)\b/i],
    ['Go', /\b(golang|go\s+(module|func|routine)|goroutine)\b/i], ['Rust', /\b(rust|cargo|\.rs\b)\b/i], ['Java', /\b(java(?!script)|spring|maven|gradle)\b/i],
    ['Kotlin', /\bkotlin\b/i], ['Swift', /\b(swift|swiftui)\b/i], ['C#', /(c#|\.net|dotnet|asp\.net)/i], ['C++', /(c\+\+|cpp)/i], ['PHP', /\b(php|laravel|wordpress)\b/i],
    ['Ruby', /\b(ruby|rails)\b/i], ['Dart', /\b(dart|flutter)\b/i], ['SQL', /\b(sql|postgres|mysql|sqlite)\b/i], ['Bash', /\b(bash|shell script|zsh|\.sh\b)\b/i],
  ];
  const TECH = ['React', 'Next.js', 'Vue', 'Nuxt', 'Angular', 'Svelte', 'Astro', 'Express', 'NestJS', 'Fastify', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'Laravel', 'Rails', 'Flutter', 'React Native', 'Expo',
    'Tailwind', 'GraphQL', 'Prisma', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Supabase', 'Firebase', 'Stripe', 'Shopify', 'Docker', 'Kubernetes', 'Terraform', 'AWS', 'GCP', 'Azure', 'GitHub Actions', 'Nginx', 'discord.js', 'Three.js', 'GSAP'];
  const techRe = (t) => new RegExp(`(^|[^\\w])${t.replace(/[.+]/g, (c) => `\\${c}`).replace(/\s/g, '[\\s-]?')}(?![\\w])`, 'i');

  // Rules experts follow for each stack, added to code prompts automatically.
  const STACK_RULES = {
    React: 'Follow the rules of hooks, keep components small, avoid unnecessary re-renders, and make every interactive element keyboard-accessible.',
    'Next.js': 'Use the App Router; keep data fetching in Server Components and mark only interactive parts with "use client".',
    TypeScript: 'Use strict types; no any.',
    Python: 'Use type hints and follow PEP 8; add pytest tests.',
    Express: 'Validate every request body (for example with Zod) and handle async errors in one error middleware.',
    FastAPI: 'Use Pydantic models for requests and responses and dependency injection for auth.',
    SQL: 'Use parameterized queries only and add indexes for the columns you filter on.',
    PostgreSQL: 'Use parameterized queries only and add indexes for the columns you filter on.',
    Prisma: 'Keep the schema normalized and use transactions for multi-step writes.',
    Docker: 'Use a multi-stage build, a small base image and a non-root user.',
    Kubernetes: 'Set resource requests and limits, readiness and liveness probes, and never put secrets in manifests.',
    Terraform: 'Use variables and modules, remote state with locking, and no hard-coded secrets.',
    'GitHub Actions': 'Pin action versions, cache dependencies and keep secrets in repository secrets.',
    Go: 'Return errors instead of panicking and keep packages small.',
    Rust: 'Prefer Result over unwrap and keep ownership simple.',
    'discord.js': 'Use slash commands and interactions, never log the bot token, and request minimal intents.',
    Tailwind: 'Keep class lists readable and extract repeated patterns into components.',
    Stripe: 'Never trust prices from the client; create Checkout Sessions on the server and verify webhooks.',
  };

  const MODES = {
    project: 'An online store like Gymshark for a new sportswear brand, bold and premium',
    code: 'A React hook that debounces a search input and cancels old fetch requests',
    debug: 'My Express API returns 500 when the body is empty. Paste the error below if you have it.',
    refactor: 'Clean up a 200-line Python function that parses CSV files and sends emails',
    security: 'Review the login and password reset flow of my Next.js app with Prisma',
    explain: 'How does a Kubernetes Service route traffic to Pods?',
    image: 'A boxer training alone in an old gym at night, strong and cinematic',
  };

  const OPTIONS = {
    project: [
      ['Build', 'scope', ['Plan first', 'Full build', 'One page at a time'], 'single'],
      ['Also', 'extras', ['Dark and light themes', 'Arabic (RTL) support', 'SEO', 'Analytics', 'Admin panel', 'Tests'], 'multi'],
    ],
    code: [
      ['Output', 'output', ['Complete file', 'One function', 'Step by step'], 'single'],
      ['Also', 'extras', ['Include tests', 'Handle errors', 'Add types', 'No new libraries', 'Explain trade-offs', 'Comment the tricky parts'], 'multi'],
    ],
    debug: [['Also', 'extras', ['Explain the root cause', 'Smallest possible fix', 'Show how to verify', 'Suggest a test that catches it'], 'multi']],
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
    image: [
      ['Model', 'model', ['Midjourney', 'ChatGPT / DALL·E', 'Stable Diffusion', 'Flux'], 'single'],
      ['Look', 'look', KB.LOOKS.map((l) => ({ epic: 'Epic', noir: 'Dark and moody', neon: 'Neon night', desert: 'Vast desert', scifi: 'Sci-fi', natural: 'Natural light', symmetry: 'Symmetric pastel', warm: 'Warm nostalgic', romantic: 'Romantic', action: 'Action', fantasy: 'Fantasy', horror: 'Horror' }[l.id])), 'single'],
      ['Aspect', 'aspect', ['1:1', '16:9', '9:16', '4:5', '3:2', '21:9'], 'single'],
    ],
  };
  const LOOK_BY_LABEL = { Epic: 'epic', 'Dark and moody': 'noir', 'Neon night': 'neon', 'Vast desert': 'desert', 'Sci-fi': 'scifi', 'Natural light': 'natural', 'Symmetric pastel': 'symmetry', 'Warm nostalgic': 'warm', Romantic: 'romantic', Action: 'action', Fantasy: 'fantasy', Horror: 'horror' };
  const DEFAULTS = {
    project: { scope: 'Plan first', extras: ['SEO'] }, code: { output: 'Complete file', extras: ['Handle errors'] }, debug: { extras: ['Explain the root cause', 'Smallest possible fix', 'Show how to verify'] },
    refactor: { goals: ['Readability', 'Smaller functions'], output: 'A diff' }, security: { focus: ['OWASP Top 10'], exposure: 'Public internet' }, explain: { level: 'Some experience', format: ['Step by step', 'With a small example'] },
    image: { model: 'Midjourney', aspect: '16:9' },
  };

  const idea = $('#pb-idea', root); const err = $('#pb-error', root); const errWrap = $('#pb-error-wrap', root);
  const out = $('#pb-out', root); const optsBox = $('#pb-options', root); const detected = $('#pb-detected', root);
  const checks = $('#pb-checks', root); const scoreEl = $('#pb-score', root); const ring = $('#pb-ring', root);
  let mode = 'project';
  let userPicked = false;
  const picks = structuredClone(DEFAULTS);

  // Which kind of request is this? The most specific signal wins.
  const MODE_SIGNALS = [
    ['image', /\b(images?|photos?|pictures?|pics?|illustration|poster|wallpaper|render|midjourney|dall-?e|stable diffusion|flux|logo|thumbnail|portrait of|shot of)\b|صور/i],
    ['debug', /\b(error|exception|traceback|bug|crash(es|ing)?|not working|doesn'?t work|broken|fails?|failing|(status|error) 500|500 error|undefined is not|cannot read)\b/i],
    ['security', /\b(security|secure|vulnerab\w*|pentest|audit|owasp|xss|injection|exploit)\b/i],
    ['refactor', /\b(refactor|clean ?up|messy|rewrite|improve (my|this) code|simplify)\b/i],
    ['explain', /^(how|what|why|when|explain|teach)\b|\b(explain|what is|how does|difference between)\b/i],
    ['code', /\b(function|hook|component|class|method|endpoint|query|regex|algorithm|snippet|helper|util)\b/i],
    ['project', /\b(website|web ?site|site|store|shop|e-?commerce|app|application|platform|dashboard|saas|bot|landing|portfolio|blog|game|extension|api|backend|clone|like \w+)\b/i],
  ];
  const guessMode = (text) => {
    const hit = MODE_SIGNALS.find(([, re]) => re.test(text));
    if (hit) return hit[0];
    // No explicit signal: a described scene (a subject or a mood) with no programming words is a picture.
    const visual = KB.SUBJECTS.some(([, re]) => re.test(text)) || KB.LOOKS.some((l) => l.re.test(text));
    const technical = LANGS.some(([, re]) => re.test(text)) || TECH.some((t) => techRe(t).test(text));
    return visual && !technical ? 'image' : 'code';
  };

  // Project type priority: specific products first, generic "website" last.
  const PROJECT_ORDER = ['bot', 'extension', 'mobile', 'game', 'ai', 'ecommerce', 'booking', 'saas', 'portfolio', 'blog', 'landing', 'api', 'automation', 'website'];
  const projectOf = (text) => PROJECT_ORDER.map((id) => KB.PROJECTS.find((p) => p.id === id)).find((p) => p.re.test(text));
  const LOOK_ORDER = ['neon', 'desert', 'scifi', 'symmetry', 'romantic', 'horror', 'fantasy', 'action', 'noir', 'warm', 'natural', 'epic'];

  function read(text) {
    const langs = LANGS.filter(([, re]) => re.test(text)).map(([n]) => n);
    if (langs.includes('TypeScript') && langs.includes('JavaScript')) langs.splice(langs.indexOf('JavaScript'), 1);
    const tech = TECH.filter((t) => techRe(t).test(text));
    const brands = KB.BRANDS.filter((b) => b.re.test(text));
    const styles = KB.STYLES.filter(([re]) => re.test(text)).map(([, s]) => s);
    const audience = (text.match(/\bfor (?:a |an |the |my )?((?:new |small |local |young |busy )?[a-z][a-z -]{2,40}?)(?=[,.;]| who| that| with| and |$)/i) || [])[1];
    const errorLine = (text.match(/^.*(Error|Exception|Traceback|panic:|FATAL|undefined is not|cannot read propert).*$/im) || [])[0];
    const subject = KB.SUBJECTS.find(([, re]) => re.test(text))?.[0];
    const look = LOOK_ORDER.map((id) => KB.LOOKS.find((l) => l.id === id)).find((l) => l.re.test(text));
    const rtl = /\b(arabic|rtl|عربي|العربية)\b/i.test(text);
    return { langs, tech, brands, styles, audience: audience && !/(me|my|him|her|it|us|them)$/i.test(audience.trim()) ? audience.trim() : null, errorLine, subject, look, rtl, project: projectOf(text) };
  }

  // ---------- writing helpers ----------
  const clean = (s) => s.trim().replace(/\s+/g, ' ').replace(/[.\s]+$/, '');
  const list = (items) => items.filter(Boolean).map((i) => `- ${i}`).join('\n');
  const stackOf = (d) => [...d.langs, ...d.tech].join(', ');
  // Turn "i want him to make me a website like gymshark" into "a website like gymshark".
  const tidyIdea = (text) => clean(text)
    .replace(/^(please\s+)?(can you\s+)?(i\s+(want|need|would like)\s+(you|him|her|it|the ai)?\s*(to\s+)?)?(make|build|create|generate|design|code|write|develop|draw|give)\s+(me\s+|for me\s+)?/i, '')
    .replace(/^(please\s+)?(i\s+(want|need|would like)\s+)/i, '')
    .replace(/^(some\s+|a\s+few\s+|an?\s+)?((strong|beautiful|great|cool|nice|amazing|epic|cinematic|realistic|high[- ]quality)\s+)*(pictures?|photos?|images?|shots?|renders?|illustrations?)\s+(of|showing)\s+/i, '')
    .replace(/^(an?|the)\s+/i, (m) => m.toLowerCase());
  const article = (s) => (/^[aeiou]/i.test(s) ? 'an' : 'a');

  // ---------- each kind of prompt ----------
  function projectPrompt(text, p, d) {
    const proj = d.project ?? KB.PROJECTS.find((x) => x.id === 'website');
    // A clean goal from what was understood, with the person's own words kept underneath.
    const kind = proj.label.charAt(0).toLowerCase() + proj.label.slice(1);
    const goal = `${article(kind)} ${kind}${d.brands.length ? ` inspired by ${d.brands.map((b) => b.name).join(' and ')}` : ''}${d.audience ? ` for ${d.audience}` : ''}`;
    const words = tidyIdea(text);
    const named = stackOf(d);
    const brandBlock = d.brands.map((b) => `Use ${b.name} (${b.sector}) as a reference for:\n${list(b.traits)}\nTake the structure and the feel, not the brand: no ${b.name} logos, names, copy, photos or product designs.`).join('\n\n');
    const extras = {
      'Dark and light themes': 'Dark and light themes that follow the device setting.',
      'Arabic (RTL) support': 'Full Arabic support: right-to-left layout, mirrored icons and arrows, an Arabic font such as IBM Plex Sans Arabic, and a language switcher.',
      SEO: 'SEO: unique titles and descriptions, Open Graph images, structured data, a sitemap and clean URLs.',
      Analytics: 'Privacy-friendly analytics (Plausible or Vercel Analytics) with events for the main actions.',
      'Admin panel': 'An admin panel to manage the content without touching code.',
      Tests: 'Tests for the main flows (Playwright end-to-end, plus unit tests for logic).',
    };
    const rtl = d.rtl && !(p.extras ?? []).includes('Arabic (RTL) support') ? [extras['Arabic (RTL) support']] : [];
    const scope = {
      'Plan first': 'Start with a short plan: the pages, the components, the data model and the folder structure. Wait for my OK, then build.',
      'Full build': 'Build the whole thing, page by page, with real-looking content (no lorem ipsum) and every state: loading, empty and error.',
      'One page at a time': 'Build one page at a time, starting with the most important one, and show it before moving on.',
    }[p.scope] ?? 'Start with a short plan, then build.';
    return `You are a ${proj.role}.

## Goal
Build ${goal}.${words ? `\nIn my words: "${words}"` : ''}
${brandBlock ? `\n## Reference\n${brandBlock}\n` : ''}
## Pages and features
${list(proj.features)}

## Design direction
${list([...d.styles, ...(d.brands.length ? ['Let the photography and product do the talking; keep the interface quiet around them'] : []), 'Mobile-first, then scale up to desktop', 'One consistent spacing scale, type scale and set of components', 'Real content and real states, no placeholder text'])}

## Tech stack
${[named ? `- Use: ${named}\n- Fill any gaps with: ${proj.stack}` : `- ${proj.stack} (or tell me if you would choose differently and why)`, ...[...new Set([...d.tech, ...d.langs].map((t) => STACK_RULES[t]).filter(Boolean))].map((r) => `- ${r}`)].join('\n')}

## Quality bar
${list([...proj.quality, ...rtl, ...(p.extras ?? []).map((e) => extras[e]), 'Accessible: semantic HTML, alt text, visible focus, good contrast'])}

## How to work
${scope}

## Before you start
Ask me what you need to know, for example:
${list(proj.questions)}
If I do not answer, state your assumptions and continue.`;
  }

  function codePrompt(text, p, d) {
    const lang = d.langs[0];
    const role = `You are a senior ${lang ?? 'software'} engineer${d.tech.length ? ` who works with ${d.tech.join(', ')}` : ''}.`;
    const output = { 'Complete file': 'Return one complete, runnable file.', 'One function': 'Return only the function and its imports.', 'Step by step': 'Explain the approach in a few steps, then give the code.' }[p.output] ?? 'Return the code, then a short explanation.';
    const extras = { 'Include tests': 'Include unit tests for the main paths and one edge case.', 'Handle errors': 'Handle errors and invalid input explicitly.', 'Add types': 'Use precise types; avoid any/unknown escapes.', 'No new libraries': 'Do not add new dependencies.', 'Explain trade-offs': 'Note the main trade-off you made and one alternative.', 'Comment the tricky parts': 'Comment only the non-obvious parts.' };
    const rules = [...d.tech, ...d.langs].map((t) => STACK_RULES[t]).filter(Boolean);
    return `${role}

## Task
${tidyIdea(text) || 'Describe what the code should do.'}

## Context
- Stack: ${stackOf(d) || 'not stated (ask me if it matters)'}
- Follow the conventions already common in this stack.

## Requirements
${list([...(p.extras ?? []).map((e) => extras[e]), ...rules, 'Keep it simple and readable; no clever tricks.'])}

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
- Stack: ${stackOf(d) || 'not stated'}

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
- Stack: ${stackOf(d) || 'not stated'}
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

${list([...(p.format ?? []).map((f) => formats[f]), 'Keep it short; use plain words and define any term you introduce.', d.tech.length || d.langs.length ? `Use ${stackOf(d)} in the examples.` : 'Pick the most common tool for the examples and say which one.'])}
End with one question I can answer to check I understood.`;
  }

  function imagePrompt(text, p, d) {
    const subject = tidyIdea(text).replace(/\b(strong|powerful|cinematic|epic|stunning|amazing|beautiful|best|high quality|4k|8k)\b,?\s*/gi, '').replace(/,\s*$/, '').trim() || 'your subject';
    const look = p.look ? KB.LOOKS.find((l) => l.id === LOOK_BY_LABEL[p.look]) : d.look;
    const base = KB.SUBJECT_LOOK[d.subject] ?? {};
    const isLogo = d.subject === 'logo';
    const light = look?.light ?? base.light ?? 'soft, directional natural light';
    const lens = look?.lens ?? base.lens ?? '35mm lens at eye level';
    const palette = look?.palette ?? base.palette ?? 'natural, true-to-life color';
    const stock = look?.stock ?? base.stock;
    const parts = isLogo
      ? [subject, 'flat vector logo, simple geometric shapes, two or three solid colors, works at small sizes, centered on a plain background']
      : [subject, look ? `in the style of ${look.ref}` : 'professional photograph', light, lens, palette, stock, 'shallow depth of field where it helps, fine texture and detail, thoughtful composition with a clear focal point'].filter(Boolean);
    const body = parts.join(', ');
    const negative = isLogo ? 'gradients, photo, 3D, text, watermark, clutter' : 'blurry, low resolution, extra fingers, distorted faces, watermark, text, logo, oversaturated';
    switch (p.model) {
      case 'Midjourney': return `${body} --ar ${p.aspect ?? '1:1'}${!isLogo ? ' --style raw' : ''} --no text, watermark`;
      case 'Stable Diffusion': return `${body}, highly detailed\n\nNegative prompt: ${negative}\nAspect ratio: ${p.aspect ?? '1:1'}`;
      case 'Flux': return `${body}. Aspect ratio ${p.aspect ?? '1:1'}. No text or watermark in the image.`;
      default: return `Create an image of ${subject}.\n\n${isLogo ? 'Style: flat vector logo, simple shapes, two or three solid colors, works at small sizes.' : `Look: ${look ? `inspired by ${look.ref}` : 'a professional photograph'}.\nLight: ${light}.\nCamera: ${lens}.\nColor: ${palette}${stock ? `, ${stock}` : ''}.\nComposition: one clear focal point, nothing distracting at the edges.`}\nFormat: ${p.aspect ?? '1:1'}.\nAvoid: ${negative}.`;
    }
  }

  const BUILD = { project: projectPrompt, code: codePrompt, debug: debugPrompt, refactor: refactorPrompt, security: securityPrompt, explain: explainPrompt, image: imagePrompt };

  function quality(text, d) {
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const p = picks[mode];
    return {
      project: [['Says what to build', words >= 4], ['A clear type of project', !!d.project], ['A reference or a style', d.brands.length + d.styles.length > 0], ['Names the audience', !!d.audience], ['Names the stack', d.langs.length + d.tech.length > 0]],
      code: [['Describes the task in a full sentence', words >= 8], ['Names the language', d.langs.length > 0], ['Names the framework or tools', d.tech.length > 0], ['Defines the output', !!p.output], ['Asks for error handling or tests', (p.extras ?? []).some((e) => /tests|errors/.test(e))]],
      debug: [['Says what happens', words >= 6], ['Includes the error message', !!(err.value.trim() || d.errorLine)], ['Names the language or framework', d.langs.length + d.tech.length > 0], ['Asks for the root cause', (p.extras ?? []).includes('Explain the root cause')], ['Asks how to verify', (p.extras ?? []).includes('Show how to verify')]],
      refactor: [['Describes the code', words >= 6], ['Names the language', d.langs.length > 0], ['Sets clear goals', (p.goals ?? []).length > 0], ['Keeps behavior the same', true], ['Picks the output form', !!p.output]],
      security: [['Describes what to review', words >= 6], ['Names the stack', d.langs.length + d.tech.length > 0], ['States the exposure', !!p.exposure], ['Sets a focus', (p.focus ?? []).length > 0], ['Asks for severity and fixes', true]],
      explain: [['Asks a clear question', words >= 4], ['Sets the level', !!p.level], ['Picks a format', (p.format ?? []).length > 0], ['Names a tool for examples', d.langs.length + d.tech.length > 0]],
      image: [['Says what is in the picture', words >= 4], ['A subject the builder recognizes', !!d.subject], ['A mood or look', !!(d.look || p.look)], ['Sets the aspect ratio', !!p.aspect], ['Picks a model', !!p.model]],
    }[mode];
  }

  // ---------- what the builder understood ----------
  function understood(d) {
    const bits = [];
    const LOOK_NAME = Object.fromEntries(Object.entries(LOOK_BY_LABEL).map(([k, v]) => [v, k]));
    if (mode === 'project' && d.project) bits.push(['Type', d.project.label]);
    if (mode === 'image' && d.subject) bits.push(['Subject', d.subject]);
    if (mode === 'image' && (picks.image.look || d.look)) bits.push(['Look', picks.image.look ?? LOOK_NAME[d.look.id]]);
    d.brands.forEach((b) => bits.push(['Reference', `${b.name} · ${b.sector}`]));
    if (mode !== 'image') d.styles.forEach((s) => bits.push(['Style', s.split(':')[0]]));
    [...d.langs, ...d.tech].forEach((t) => bits.push(['Stack', t]));
    if (d.audience && mode === 'project') bits.push(['Audience', d.audience]);
    if (d.rtl) bits.push(['Language', 'Arabic, right to left']);
    if (!bits.length) return `<span class="hint">${mode === 'image' ? 'Name the subject and the mood: "a boxer in an old gym at night, dark and moody".' : mode === 'project' ? 'Say what to build, who it is for, and a site you like: "a store like Gymshark for a new gym brand".' : 'Mention the language and framework and the builder picks them up.'}</span>`;
    return bits.map(([k, v]) => `<span class="u"><i>${k}</i>${v.replace(/</g, '&lt;')}</span>`).join('');
  }

  // ---------- rendering ----------
  function renderOptions() {
    optsBox.innerHTML = OPTIONS[mode].map(([label, key, values, kind]) => `
      <div class="pb-row"><span class="pb-label">${label}</span><div class="pills" data-key="${key}" data-kind="${kind}">
      ${values.map((v) => { const on = [].concat(picks[mode][key] ?? []).includes(v); return `<button type="button" class="pill${on ? ' on' : ''}" aria-pressed="${on}">${v}</button>`; }).join('')}
      </div></div>`).join('');
  }

  function setMode(next, byUser) {
    mode = next;
    if (byUser) userPicked = true;
    $$('.seg button', root).forEach((x) => x.setAttribute('aria-selected', x.dataset.mode === mode));
    idea.placeholder = MODES[mode];
    errWrap.hidden = mode !== 'debug';
    renderOptions();
  }

  function build() {
    const text = idea.value + (mode === 'debug' ? `\n${err.value}` : '');
    const d = read(text);
    out.textContent = BUILD[mode](idea.value, picks[mode], d);
    detected.innerHTML = understood(d);
    const items = quality(text, d);
    const score = Math.round((items.filter(([, ok]) => ok).length / items.length) * 100);
    scoreEl.textContent = score;
    ring.style.setProperty('--p', score);
    checks.innerHTML = items.map(([label, ok]) => `<li class="${ok ? 'ok' : ''}">${label}</li>`).join('');
  }

  optsBox.addEventListener('click', (e) => {
    const b = e.target.closest('.pill');
    if (!b) return;
    const { key, kind } = b.parentElement.dataset;
    const v = b.textContent;
    if (kind === 'single') picks[mode][key] = picks[mode][key] === v ? undefined : v;
    else { const s = new Set(picks[mode][key] ?? []); s.has(v) ? s.delete(v) : s.add(v); picks[mode][key] = [...s]; }
    renderOptions();
    build();
  });
  $$('.seg button', root).forEach((b) => b.addEventListener('click', () => { setMode(b.dataset.mode, true); build(); }));
  // Until the user picks a tab, the builder follows what they are asking for.
  idea.addEventListener('input', () => {
    if (!userPicked && idea.value.trim().split(/\s+/).length >= 3) {
      const guess = guessMode(idea.value);
      if (guess !== mode) setMode(guess, false);
    }
    build();
  });
  err.addEventListener('input', build);
  $('#pb-copy', root).addEventListener('click', async (e) => {
    const b = e.currentTarget;
    try { await navigator.clipboard.writeText(out.textContent); b.textContent = 'Copied'; } catch { b.textContent = 'Select and copy'; }
    setTimeout(() => { b.textContent = 'Copy prompt'; }, 1600);
  });

  const start = new URLSearchParams(location.search);
  const startMode = MODES[start.get('mode')] ? start.get('mode') : 'project';
  setMode(startMode, Boolean(start.get('mode')));
  if (start.get('q')) idea.value = start.get('q');
  build();
})();
