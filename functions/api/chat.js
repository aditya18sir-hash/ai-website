
export async function onRequestPost({ request, env }) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  };

  const respond = (data, status = 200) =>
    new Response(JSON.stringify(data), { status, headers });

  try {
    if (!env.GEMINI_API_KEY) {
      return respond({ error: "AI service is not configured yet." }, 500);
    }

    const body = await request.json();
    const message = typeof body.message === "string"
      ? body.message.trim()
      : "";

    if (!message) {
      return respond({ error: "Please enter a question." }, 400);
    }

    if (message.length > 4000) {
      return respond({ error: "Question is too long." }, 400);
    }

    const apiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [{ text: message }]
          }],
          generationConfig: {
            maxOutputTokens: 700
          }
        })
      }
    );

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      return respond({
        error: apiResponse.status === 429
          ? "Free AI limit reached. Please try again later."
          : "AI service is temporarily unavailable."
      }, apiResponse.status === 429 ? 429 : 502);
    }

    const reply = data.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("")
      .trim();

    if (!reply) {
      return respond({ error: "No answer returned. Please try again." }, 502);
    }

    return respond({ reply });
  } catch {
    return respond({ error: "Request failed. Please try again." }, 500);
  }
}
