const chatForm = document.getElementById("chatForm");
const trainForm = document.getElementById("trainForm");
const trainStatus = document.getElementById("trainStatus");
const messageInput = document.getElementById("messageInput");
const questionInput = document.getElementById("questionInput");
const answerInput = document.getElementById("answerInput");
const tagsInput = document.getElementById("tagsInput");
const chatBox = document.getElementById("chatBox");

const conversation = [];

function renderMessage(role, content) {
  const div = document.createElement("div");
  div.className = `message ${role}`;
  div.textContent = content;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const text = messageInput.value.trim();
  if (!text) return;

  renderMessage("user", text);
  messageInput.value = "";

  conversation.push({ role: "user", content: text });

  const button = chatForm.querySelector("button");
  button.disabled = true;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: conversation }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }

    const reply = data.reply || "لم يتم إرجاع رد.";
    conversation.push({ role: "assistant", content: reply });
    renderMessage("assistant", reply);

    if (Array.isArray(data.usedKnowledge) && data.usedKnowledge.length > 0) {
      renderMessage("assistant", `📚 تم استخدام ${data.usedKnowledge.length} مرجع من المعرفة المحلية.`);
    }
  } catch (error) {
    renderMessage("assistant", `حدث خطأ: ${error.message}`);
  } finally {
    button.disabled = false;
    messageInput.focus();
  }
});

trainForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = {
    question: questionInput.value.trim(),
    answer: answerInput.value.trim(),
    tags: tagsInput.value.trim(),
  };

  if (!payload.question || !payload.answer) {
    trainStatus.textContent = "الرجاء إدخال السؤال والإجابة.";
    return;
  }

  const button = trainForm.querySelector("button");
  button.disabled = true;
  trainStatus.textContent = "جاري حفظ المعرفة...";

  try {
    const response = await fetch("/api/train", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to save knowledge");
    }

    trainStatus.textContent = "✅ تم حفظ المعرفة بنجاح.";
    questionInput.value = "";
    answerInput.value = "";
    tagsInput.value = "";
  } catch (error) {
    trainStatus.textContent = `❌ خطأ: ${error.message}`;
  } finally {
    button.disabled = false;
  }
});
