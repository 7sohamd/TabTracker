document.addEventListener("DOMContentLoaded", () => {
  const fonts = new Set();
  const colors = new Set();

  document.querySelectorAll("*").forEach(el => {
    const style = window.getComputedStyle(el);
    fonts.add(style.fontFamily);
    colors.add(style.color);
    colors.add(style.backgroundColor);
    colors.add(style.borderColor);
  });

  const textContent = document.body.innerText.trim();
  const summary = textContent ? textContent.split(" ").slice(0, 50).join(" ") + "..." : "No content to summarize.";

  let data = { fonts: [...fonts], colors: [...colors], summary };

  console.log("Sending data:", data); // Debugging Log
  chrome.runtime.sendMessage(data, response => {
    if (chrome.runtime.lastError) {
      console.error("Error sending message:", chrome.runtime.lastError);
    } else {
      console.log("Response from background:", response);
    }
  });
});