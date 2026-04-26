export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Test 1: Check key exists
  if (!apiKey) {
    return res.status(200).json({
      step: 'FAILED: No API key',
      detail: 'ANTHROPIC_API_KEY environment variable is not set on this deployment'
    });
  }

  // Test 2: Check key format
  if (!apiKey.startsWith('sk-ant')) {
    return res.status(200).json({
      step: 'FAILED: Bad key format',
      detail: 'Key starts with: ' + apiKey.substring(0, 8) + '...'
    });
  }

  // Test 3: Make a minimal API call
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
        max_tokens: 50,
        messages: [{ role: 'user', content: 'Reply with just the word WORKING' }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(200).json({
        step: 'FAILED: Anthropic rejected the request',
        status: response.status,
        error: data.error || data
      });
    }

    const text = data.content?.[0]?.text || '';
    return res.status(200).json({
      step: 'SUCCESS',
      keyPrefix: apiKey.substring(0, 14) + '...',
      keyLength: apiKey.length,
      anthropicResponse: text,
      model: data.model
    });

  } catch (err) {
    return res.status(200).json({
      step: 'FAILED: Network error',
      detail: err.message
    });
  }
}
