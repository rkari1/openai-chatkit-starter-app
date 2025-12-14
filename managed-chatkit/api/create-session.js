export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  
  const required = process.env.APP_PASSWORD;
  const provided = req.headers["x-app-password"];
  
  if (required && provided !== required) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  const apiKey = process.env.OPENAI_API_KEY;
  const workflowId =
    process.env.CHATKIT_WORKFLOW_ID || process.env.VITE_CHATKIT_WORKFLOW_ID;
  const workflowVersion =
    process.env.CHATKIT_WORKFLOW_VERSION || process.env.VITE_CHATKIT_WORKFLOW_VERSION;

  if (!apiKey) return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
  if (!workflowId) return res.status(500).json({ error: "Missing workflow id" });

  const payload = {
    user: "web-user", // keep stable for now
    workflow: {
      id: workflowId,
      ...(workflowVersion ? { version: workflowVersion } : {}),
    },
  };

  const r = await fetch("https://api.openai.com/v1/chatkit/sessions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "OpenAI-Beta": "chatkit_beta=v1",
    },
    body: JSON.stringify(payload),
  });

  const data = await r.json().catch(() => ({}));

  if (!r.ok) {
    return res.status(r.status).json(data);
  }

  // ChatKit needs client_secret from the session create response
  return res.status(200).json({ client_secret: data.client_secret });
}
