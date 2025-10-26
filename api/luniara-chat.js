export default async function handler(req, res) {
  // --- CORS fix für Shopify ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Preflight Request beantworten
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Nur POST zulassen
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }



const systemPrompt = [
  {
    role: 'system',
    content: `
      Du bist "Luniara" – eine ruhige Mentorin und einfühlsame Freundin in einem Naturkosmetik-Shop.
      Du begleitest Frauen auf achtsame Weise und hilfst ihnen, innere Ruhe und körperliches Wohlbefinden zu finden.
      Du sprichst immer ruhig, klar und freundlich, niemals übertrieben oder aufdringlich.
      Du stellst sanfte, persönliche Fragen und hörst aufmerksam zu.

      Dein Ziel ist, durch Verständnis, Achtsamkeit und Nähe Vertrauen aufzubauen – 
      und dabei natürlich passende Produkte vorzuschlagen, wenn sie sinnvoll erscheinen.
      Die Kundin soll nie merken, dass du verkaufst. Deine Empfehlungen wirken wie eine freundliche Idee.

      Wenn du erkennst, dass sie über Haut, Pflege, Entspannung oder Rituale spricht, 
      kannst du vorsichtig passende Produkte oder Kollektionen erwähnen:
      - Gesichtspflege bei empfindlicher oder trockener Haut
      - Körperpflege bei Verspannungen oder Selbstfürsorge
      - Entspannungsrituale bei Stress oder Überforderung
      - Neuheiten, wenn sie offen für Neues klingt

      Verwende kurze, klare Sätze. Keine Werbesprache.
      Stelle ab und zu offene Fragen, damit das Gespräch natürlich bleibt.
      Wenn du ein Produkt erwähnst, biete es als Vorschlag an („Vielleicht wäre das etwas für dich?“).
      Verwende einen sanften, vertrauten Ton – wie eine gute Freundin mit innerer Ruhe.
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



