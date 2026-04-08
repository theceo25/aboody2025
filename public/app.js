const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const chatBox = document.getElementById("chatBox");

const conversation = [
  {
    role: "system",
    content:
      "You are a helpful Arabic-first assistant. Keep answers clear and friendly.",
  },
];

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
  } catch (error) {
    renderMessage("assistant", `حدث خطأ: ${error.message}`);
  } finally {
    button.disabled = false;
    messageInput.focus();
  }
});
