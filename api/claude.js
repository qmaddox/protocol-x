export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set in Vercel environment variables.' });
  }

  let prompt, maxTokens;
  try {
    prompt = req.body.prompt;
    maxTokens = req.body.maxTokens || 4000;
  } catch (e) {
    return res.status(400).json({ error: 'Invalid request body.' });
  }

  if (!prompt) return res.status(400).json({ error: 'No prompt in request body.' });

  if (maxTokens > 6000) maxTokens = 6000;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    let data;
    try {
      data = await response.json();
    } catch (e) {
      return res.status(500).json({ error: 'Anthropic returned non-JSON response. Try again.' });
    }

    if (!response.ok) {
      const status = response.status;
      const msg = data && data.error && data.error.message ? data.error.message : 'Unknown error';
      if (status === 401) return res.status(401).json({ error: 'Invalid API key. Check Vercel environment variable ANTHROPIC_API_KEY.' });
      if (status === 429) return res.status(429).json({ error: 'Rate limit hit. Wait a moment and try again.' });
      if (status === 529) return res.status(529).json({ error: 'Anthropic overloaded. Try again in 60 seconds.' });
      return res.status(status).json({ error: 'Anthropic error ' + status + ': ' + msg });
    }

    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
}
