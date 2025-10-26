export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, meta } = req.body || {};
  try {
    const systemPrompt = [
      {
        role: 'system',
        content: `
          Du bist "Luniara", eine ruhige, achtsame Begleiterin in einem Naturkosmetik-Shop.
          Sprich deutsch, ruhig, respektvoll, keine Emojis, keine Übertreibung.
          Dein Ziel: Orientierung geben, ein Gefühl von Ruhe vermitteln, dezent passende Produkte empfehlen.
          Wenn Nutzerinnen über Haut, Stress, Rituale oder Entspannung sprechen, biete sanfte Unterstützung an.
          Wenn sinnvoll, kannst du ein Feld "redirect" mit einer URL des Shops liefern, z. B. zu passenden Kollektionen.
        `,
      },
    ];

    const userPrompt = [{ role: 'user', content: String(message || '') }];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [...systemPrompt, ...userPrompt],
        temperature: 0.4,
      }),
    });

    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content?.trim() || 'Ich bin hier.';
    const redirectMatch = raw.match(/REDIRECT:(\/[^\s]+)/i);
    const redirect = redirectMatch ? redirectMatch[1] : null;

    // Einfache Weiterleitungslogik
    const msgLower = (message || '').toLowerCase();
    let redir = redirect;
    if (!redir) {
      if (/gesicht|haut|creme|serum|pflege/.test(msgLower))
        redir = '/collections/gesichtspflege';
      else if (/körper|body|lotion|öl|peeling/.test(msgLower))
        redir = '/collections/koerperpflege';
      else if (/entspann|ruhe|stress|ritual|lavendel/.test(msgLower))
        redir = '/collections/entspannung';
      else if (/neu|neuigkeit|aktuell|trend/.test(msgLower))
        redir = '/collections/neu';
    }

    res.status(200).json({
      message: raw.replace(/REDIRECT:\S+/, '').trim(),
      redirect: redir ? `https://luniara-shop.myshopify.com${redir}` : undefined,
    });
  } catch (err) {
    res.status(200).json({
      message: 'Ich bin hier, aber gerade ohne Verbindung. Versuche es später erneut.',
    });
  }
}
