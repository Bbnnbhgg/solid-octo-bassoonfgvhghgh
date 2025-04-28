
export default {
  async fetch(request, env, ctx) {
    if (request.method !== 'POST') {
      return new Response("Use POST", { status: 405 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    const userMessage = body.text || "";
    const apiKey = env.GEMINI_API_KEY;

    const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey;

    // New prompt to Gemini
    const prompt = `Analyze the following message. Respond ONLY with "BAD" if the message contains insults, toxicity, profanity, or inappropriate language. Otherwise, respond with "SAFE".\n\nMessage: ${userMessage}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    if (!response.ok) {
      return new Response("Gemini request failed", { status: 500 });
    }

    const result = await response.json();
    const geminiText = result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "SAFE";

    if (geminiText.toUpperCase() === "BAD") {
      return new Response(JSON.stringify({ profanityDetected: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } else {
      return new Response(JSON.stringify({ safe: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
}
