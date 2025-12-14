const readEnvString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

/**
 * Simple password prompt + per-tab storage.
 * - Prompts once per tab (sessionStorage).
 * - Clear by closing the tab or deleting sessionStorage key "app_pw".
 */
const getAppPassword = (): string => {
  let pw = sessionStorage.getItem("app_pw");
  if (!pw) {
    pw = window.prompt("Password?") || "";
    sessionStorage.setItem("app_pw", pw);
  }
  return pw;
};

export const workflowId = (() => {
  const id = readEnvString(import.meta.env.VITE_CHATKIT_WORKFLOW_ID);
  if (!id || id.startsWith("wf_replace")) {
    throw new Error("Set VITE_CHATKIT_WORKFLOW_ID in your .env file.");
  }
  return id;
})();

export function createClientSecretFetcher(
  workflow: string,
  endpoint = "/api/create-session"
) {
  return async (currentSecret: string | null) => {
    if (currentSecret) return currentSecret;

    const pw = getAppPassword();

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-app-password": pw,
      },
      body: JSON.stringify({ workflow: { id: workflow } }),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      client_secret?: string;
      error?: string;
    };

    if (!response.ok) {
      throw new Error(payload.error ?? "Failed to create session");
    }

    if (!payload.client_secret) {
      throw new Error("Missing client secret in response");
    }

    return payload.client_secret;
  };
}
