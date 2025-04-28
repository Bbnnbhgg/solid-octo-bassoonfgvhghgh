
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

    // Step 1: Preprocess the text to normalize and remove obfuscations
    const cleanedText = normalizeText(userMessage);

    // New prompt to Gemini AI with cleaned text
    const prompt = `Analyze the following message. Respond ONLY with "BAD" if the message contains insults, toxicity, profanity, or inappropriate language. Otherwise, respond with "SAFE".\n\nMessage: ${cleanedText}`;

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
};

// Helper function to normalize text
function normalizeText(text) {
  // Replace common leet speak numbers with letters
  text = text.replace(/4/g, 'a').replace(/3/g, 'e').replace(/1/g, 'i').replace(/5/g, 's').replace(/0/g, 'o');
  
  // Replace symbols commonly used to mask bad words
  text = text.replace(/[@#$%^&*!()_+=|~`]/g, ''); // Remove common symbols
  text = text.replace(/\$\$/g, 'ss').replace(/@@/g, 'aa'); // Handle special cases
  
  // Remove extra spaces
  text = text.replace(/\s+/g, ''); // Remove any extra spaces or characters
  
  return text;
}
