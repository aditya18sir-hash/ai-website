
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/chat" && request.method === "POST") {
      try {
        if (!env.GEMINI_API_KEY) {
          return Response.json(
            { error: "AI key is not configured." },
            { status: 500 }
          );
        }

        const body = await request.json();
        const message = typeof body.message === "string"
          ? body.message.trim()
          : "";

        if (!message) {
          return Response.json(
            { error: "Please enter a question." },
            { status: 400 }
          );
        }

        const result = await fetch(
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
              generationConfig: { maxOutputTokens: 700 }
            })
          }
        );

        const data = await result.json();

        if (!result.ok) {
          return Response.json(
            { error: "AI service error. Please try again later." },
            { status: result.status === 429 ? 429 : 502 }
          );
        }

        const reply = data.candidates?.[0]?.content?.parts
          ?.map(part => part.text || "")
          .join("")
          .trim();

        return Response.json(
          reply ? { reply } : { error: "No answer returned." },
          { status: reply ? 200 : 502 }
        );
      } catch {
        return Response.json(
          { error: "Request failed. Please try again." },
          { status: 500 }
        );
      }
    }

    return new Response("AI website is running.");
  }
};
