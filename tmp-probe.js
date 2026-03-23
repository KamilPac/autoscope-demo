(async () => {
  const url = 'https://dreambid.pl/pl/lots/copart-78531105/2025-Mazda-CX-5-JM3KFBCL6S0582835';
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'text/html' } });
  const t = await r.text();
  console.log('status', r.status, 'len', t.length);

  const probes = [/Status sprzeda/i, /Numer oferty/i, /ACV/i, /Rodzaj paliwa/i, /__NEXT_DATA__/i];
  for (const p of probes) {
    const idx = t.search(p);
    console.log(String(p), idx);
    if (idx > 0) {
      console.log(t.slice(Math.max(0, idx - 220), Math.min(t.length, idx + 320)));
      console.log('---');
    }
  }

  const scriptMatch = t.match(/<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  console.log('nextData', !!scriptMatch, scriptMatch ? scriptMatch[1].length : 0);
})();
