
// worker.js

// This function interacts with Gemini API to check for profanity or toxicity.
async function queryGeminiAIForProfanity(text, apiKey) {
  const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: text }]
      }]
    })
  });

  if (!response.ok) {
    throw new Error("Failed to contact Gemini API.");
  }

  const data = await response.json();
  // Assuming Gemini returns a toxicity score or flagged content
  const toxicity = data?.results?.toxicity || 0;
  return toxicity;
}

// Cloudflare Worker entry point
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);

  // Simulate a user input text (You can modify this to get text from the request body)
  const userMessage = "This is a message with badword1 and other content.";
  
  // Retrieve the Gemini API key from Cloudflare Workers' environment
  const apiKey = GEMINI_API_KEY;

  try {
    const toxicityScore = await queryGeminiAIForProfanity(userMessage, apiKey);
    const toxicityThreshold = 0.7; // Adjust based on what level you consider "toxic"
    
    if (toxicityScore > toxicityThreshold) {
      return new Response("This message contains inappropriate content.", {
        status: 400
      });
    } else {
      return new Response("This message is safe.", { status: 200 });
    }
  } catch (error) {
    return new Response("Error detecting toxicity: " + error.message, { status: 500 });
  }
}
