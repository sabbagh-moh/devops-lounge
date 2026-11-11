// Live numbers from the server itself: members and people online, read from the public invite.
// Nothing is shown until real numbers arrive, and the result is reused for five minutes.
(() => {
  const spots = document.querySelectorAll('[data-live-line]');
  const loose = [...document.querySelectorAll('[data-live]')].filter((el) => !el.closest('[data-live-line]'));
  if (!spots.length && !loose.length) return;
  const KEY = 'devops-lounge-live';
  const show = ({ members, online }) => {
    for (const spot of spots) {
      const fmt = new Intl.NumberFormat(spot.closest('[lang]')?.lang || undefined);
      spot.querySelectorAll('[data-live="members"]').forEach((el) => { el.textContent = fmt.format(members); });
      spot.querySelectorAll('[data-live="online"]').forEach((el) => { el.textContent = fmt.format(online); });
      // With nobody online, only the member count is shown.
      spot.querySelectorAll('[data-live-online-part]').forEach((el) => { el.hidden = online < 1; });
      spot.hidden = !(members > 0);
    }
    // Numbers that stand on their own, like the feature card, keep their placeholder until real ones arrive.
    for (const el of loose) {
      const value = el.getAttribute('data-live') === 'online' ? online : members;
      if (value > 0) el.textContent = new Intl.NumberFormat(el.closest('[lang]')?.lang || undefined).format(value);
    }
  };
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    if (saved && Date.now() - saved.at < 5 * 60 * 1000) { show(saved); return; }
  } catch { /* storage can be blocked; fetch instead */ }
  fetch('https://discord.com/api/v10/invites/XHtBz8rZp5?with_counts=true')
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then((d) => {
      const counts = { members: d.approximate_member_count, online: d.approximate_presence_count, at: Date.now() };
      if (!Number.isFinite(counts.members)) return;
      show(counts);
      try { sessionStorage.setItem(KEY, JSON.stringify(counts)); } catch { /* fine without the cache */ }
    })
    .catch(() => { /* No numbers is better than wrong numbers: the line simply stays hidden. */ });
})();
