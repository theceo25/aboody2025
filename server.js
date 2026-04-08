const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

app.post("/api/chat", async (req, res) => {
  const { messages } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array is required." });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const lastMessage = messages[messages.length - 1]?.content || "";
    return res.json({
      reply:
        "(وضع تجريبي) لم يتم ضبط OPENAI_API_KEY بعد. آخر رسالة منك كانت: " +
        lastMessage,
    });
  }

  try {
    const input = messages.map((message) => ({
      role: message.role,
      content: [{ type: "input_text", text: message.content }],
    }));

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        input,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(502).json({
        error: "OpenAI request failed",
        details: errorText,
      });
    }

    const data = await response.json();
    const reply = data.output_text || "لم يصل رد من النموذج.";

    return res.json({ reply });
  } catch (error) {
    return res.status(500).json({
      error: "Unexpected server error",
      details: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
