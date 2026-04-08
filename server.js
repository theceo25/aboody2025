const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const KNOWLEDGE_FILE = path.join(DATA_DIR, "knowledge.json");

app.use(express.json());
app.use(express.static("public"));


app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    app: "عبودي",
    mode: process.env.OPENAI_API_KEY ? "online" : "demo",
    timestamp: new Date().toISOString(),
  });
});

function ensureKnowledgeFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(KNOWLEDGE_FILE)) {
    fs.writeFileSync(KNOWLEDGE_FILE, JSON.stringify([], null, 2), "utf8");
  }
}

function loadKnowledge() {
  ensureKnowledgeFile();

  try {
    const raw = fs.readFileSync(KNOWLEDGE_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveKnowledge(items) {
  ensureKnowledgeFile();
  fs.writeFileSync(KNOWLEDGE_FILE, JSON.stringify(items, null, 2), "utf8");
}

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[\u064B-\u065F]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1);
}

function getTopKnowledgeMatches(question, knowledge, limit = 3) {
  const queryTokens = new Set(tokenize(question));
  if (queryTokens.size === 0) return [];

  const scored = knowledge
    .map((item) => {
      const bag = new Set(tokenize(`${item.question} ${item.answer} ${item.tags || ""}`));
      let score = 0;
      for (const token of queryTokens) {
        if (bag.has(token)) score += 1;
      }
      return { item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.item);

  return scored;
}

app.get("/api/knowledge", (req, res) => {
  const knowledge = loadKnowledge();
  res.json({ count: knowledge.length, items: knowledge });
});

app.post("/api/train", (req, res) => {
  const { question, answer, tags } = req.body || {};

  if (!question || !answer) {
    return res.status(400).json({ error: "question and answer are required." });
  }

  const knowledge = loadKnowledge();
  const newItem = {
    id: Date.now(),
    question: String(question).trim(),
    answer: String(answer).trim(),
    tags: String(tags || "").trim(),
    createdAt: new Date().toISOString(),
  };

  knowledge.push(newItem);
  saveKnowledge(knowledge);

  return res.status(201).json({ message: "Knowledge item added.", item: newItem });
});

app.post("/api/chat", async (req, res) => {
  const { messages, dialect } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array is required." });
  }

  const userMessages = messages.filter((message) => message.role === "user");
  const lastUserMessage = userMessages[userMessages.length - 1]?.content || "";

  const knowledge = loadKnowledge();
  const matches = getTopKnowledgeMatches(lastUserMessage, knowledge);

  const contextText =
    matches.length > 0
      ? matches
          .map(
            (item, index) =>
              `مرجع ${index + 1}:\nسؤال: ${item.question}\nجواب: ${item.answer}`,
          )
          .join("\n\n")
      : "لا يوجد مراجع مطابقة في قاعدة المعرفة.";

  const languageStyle =
    dialect === "msa"
      ? "أجب بالعربية الفصحى المبسطة."
      : "أجب باللهجة العراقية بشكل طبيعي وواضح، ومع الحفاظ على الاحترام.";

  const systemInstruction = `
أنت مساعد ذكي باسم "عبودي" داخل تطبيق دردشة عربي.
القواعد:
1) ${languageStyle}
2) أعطِ إجابة عملية على شكل نقاط قصيرة عندما يكون السؤال إجرائيًا.
3) استخدم المراجع المحلية التالية كأولوية قصوى إذا كانت مرتبطة بالسؤال:
${contextText}
4) لا تختلق معلومات غير موجودة في المراجع؛ إذا لم تكفِ المراجع، قل بوضوح أنك اعتمدت على معرفة عامة.
5) عند الأسئلة التقنية، اقترح خطوات تنفيذية واضحة داخل التطبيق.
`.trim();

  const preparedMessages = [
    { role: "system", content: systemInstruction },
    ...messages.filter((message) => message.role !== "system"),
  ];

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const fallback = matches.length
      ? `(${matches.length} مرجع محلي) ${matches[0].answer}`
      : "(وضع تجريبي) لم يتم ضبط OPENAI_API_KEY بعد، ولا توجد مراجع كافية في قاعدة المعرفة.";

    return res.json({ reply: fallback, usedKnowledge: matches });
  }

  try {
    const input = preparedMessages.map((message) => ({
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

    return res.json({ reply, usedKnowledge: matches });
  } catch (error) {
    return res.status(500).json({
      error: "Unexpected server error",
      details: error.message,
    });
  }
});

ensureKnowledgeFile();

app.listen(PORT, () => {
  console.log(`Aboudi server running on http://localhost:${PORT}`);
});
