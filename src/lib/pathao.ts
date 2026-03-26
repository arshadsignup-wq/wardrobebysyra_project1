const PATHAO_SANDBOX_URL = "https://courier-api-sandbox.pathao.com";
const PATHAO_PRODUCTION_URL = "https://api-hermes.pathao.com";

interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number; // timestamp in ms
}

const globalForPathao = globalThis as unknown as {
  pathaoToken: TokenData | undefined;
};

function getBaseUrl() {
  return process.env.PATHAO_SANDBOX === "true"
    ? PATHAO_SANDBOX_URL
    : PATHAO_PRODUCTION_URL;
}

async function issueToken(): Promise<TokenData> {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/aladdin/api/v1/issue-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.PATHAO_CLIENT_ID,
      client_secret: process.env.PATHAO_CLIENT_SECRET,
      grant_type: "password",
      username: process.env.PATHAO_USERNAME,
      password: process.env.PATHAO_PASSWORD,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Pathao token error:", err);
    throw new Error("Failed to issue Pathao access token");
  }

  const data = await res.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    // expires_in is in seconds; subtract 60s buffer
    expires_at: Date.now() + (data.expires_in - 60) * 1000,
  };
}

async function refreshToken(refreshTok: string): Promise<TokenData> {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/aladdin/api/v1/issue-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.PATHAO_CLIENT_ID,
      client_secret: process.env.PATHAO_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshTok,
    }),
  });

  if (!res.ok) {
    // If refresh fails, do a full re-auth
    return issueToken();
  }

  const data = await res.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + (data.expires_in - 60) * 1000,
  };
}

export async function getPathaoToken(): Promise<string> {
  const cached = globalForPathao.pathaoToken;

  if (cached && Date.now() < cached.expires_at) {
    return cached.access_token;
  }

  let tokenData: TokenData;
  if (cached?.refresh_token) {
    tokenData = await refreshToken(cached.refresh_token);
  } else {
    tokenData = await issueToken();
  }

  globalForPathao.pathaoToken = tokenData;
  return tokenData.access_token;
}

export async function pathaoFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getPathaoToken();
  const baseUrl = getBaseUrl();

  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}
