async function hunterAlpha(messages) {
    let response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    "model": "openrouter/hunter-alpha",
    "messages": messages,
    "reasoning": {"enabled": true}
  })
    });
    const data = await response.json();
    console.log(data);
}

hunterAlpha();

export default hunterAlpha;
