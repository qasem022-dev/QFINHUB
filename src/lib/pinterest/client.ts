/**
 * QFINHUB Pinterest API Client
 * Pinterest API v5 wrapper
 * 
 * Features:
 * - Create pins with images
 * - Manage boards
 * - OAuth token refresh
 * - Rate limit handling (1,000 requests/day on trial)
 */

const PINTEREST_API = "https://api.pinterest.com/v5";

interface PinterestConfig {
  accessToken: string;
  refreshToken?: string;
  clientId: string;
  clientSecret: string;
}

interface Pin {
  id: string;
  title: string;
  description: string;
  link: string;
  board_id: string;
  media_source: {
    source_type: "image_url" | "media_id";
    url?: string;
    media_id?: string;
  };
}

interface Board {
  id: string;
  name: string;
  description: string;
  privacy: "PUBLIC" | "SECRET";
}

interface PinAnalytics {
  impressions: number;
  saves: number;
  clicks: number;
  [key: string]: any;
}

type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;

export class PinterestClient {
  private config: PinterestConfig;
  private requestCount: number = 0;
  private lastReset: number = Date.now();
  private dailyLimit: number = 1000;

  constructor(config: PinterestConfig) {
    this.config = config;
  }

  private get headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.config.accessToken}`,
      "Content-Type": "application/json",
    };
  }

  private checkRateLimit(): void {
    const now = Date.now();
    if (now - this.lastReset > 24 * 60 * 60 * 1000) {
      this.requestCount = 0;
      this.lastReset = now;
    }
    if (this.requestCount >= this.dailyLimit) {
      throw new Error(`Daily Pinterest API limit reached (${this.dailyLimit})`);
    }
  }

  private async request<T>(
    method: string,
    path: string,
    body?: any,
    retries = 2
  ): Promise<T> {
    this.checkRateLimit();

    const url = `${PINTEREST_API}${path}`;
    const options: RequestInit = {
      method,
      headers: this.headers,
    };

    if (body && method !== "GET") {
      options.body = JSON.stringify(body);
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, options);
        this.requestCount++;

        if (!response.ok) {
          const errorBody = await response.text().catch(() => "");
          let errorMsg = `Pinterest API ${response.status}: `;

          try {
            const parsed = JSON.parse(errorBody);
            errorMsg += parsed.message || parsed.error || errorBody;
            // Handle rate limiting specifically
            if (response.status === 429) {
              const retryAfter = parseInt(
                response.headers.get("Retry-After") || "60",
                10
              );
              errorMsg += ` (retry after ${retryAfter}s)`;
              if (attempt < retries) {
                await new Promise((r) => setTimeout(r, retryAfter * 1000));
                continue;
              }
            }
            // Handle auth errors
            if (response.status === 401) {
              errorMsg += " — Token may have expired";
            }
          } catch {
            errorMsg += errorBody.substring(0, 200);
          }

          throw new Error(errorMsg);
        }

        // Handle 204 No Content
        if (response.status === 204) {
          return {} as T;
        }

        return (await response.json()) as T;
      } catch (err) {
        lastError = err as Error;
        if (
          attempt < retries &&
          !(err instanceof Error && err.message.includes("401"))
        ) {
          await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
          continue;
        }
        throw lastError;
      }
    }

    throw lastError || new Error("Unknown Pinterest API error");
  }

  // ─── Boards ───

  async listBoards(pageSize = 25): Promise<Board[]> {
    const data = await request<{ items: Board[] }>(
      "GET",
      `/boards?page_size=${pageSize}`
    );
    return data.items || [];
  }

  async createBoard(name: string, description = ""): Promise<Board> {
    const data = await request<Board>("POST", "/boards", {
      name,
      description,
      privacy: "PUBLIC",
    });
    return data;
  }

  async getOrCreateBoard(name: string, description = ""): Promise<Board> {
    const boards = await this.listBoards();
    const existing = boards.find(
      (b) => b.name.toLowerCase() === name.toLowerCase()
    );
    if (existing) return existing;

    console.log(`Creating board: "${name}"`);
    return this.createBoard(name, description);
  }

  // ─── Pins ───

  async createPin(pin: Pin): Promise<any> {
    return this.request("POST", "/pins", pin);
  }

  async listPins(boardId?: string, pageSize = 25): Promise<any[]> {
    let path = `/pins?page_size=${pageSize}`;
    if (boardId) path += `&board_id=${boardId}`;
    const data = await this.request<{ items: any[] }>("GET", path);
    return data.items || [];
  }

  async deletePin(pinId: string): Promise<void> {
    await this.request("DELETE", `/pins/${pinId}`);
  }

  // ─── Analytics ───

  async getPinAnalytics(pinId: string): Promise<PinAnalytics | null> {
    try {
      const data = await request<any>("GET", `/pins/${pinId}/analytics`);
      return data;
    } catch {
      return null;
    }
  }

  // ─── Token Management ───

  /**
   * Exchange authorization code for access + refresh tokens
   */
  static async exchangeCode(
    code: string,
    redirectUri: string,
    clientId: string,
    clientSecret: string
  ): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  }> {
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    });

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
      "base64"
    );

    const response = await fetch(
      "https://api.pinterest.com/v5/oauth/token",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      }
    );

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      throw new Error(
        `Token exchange failed: ${response.status} — ${errBody}`
      );
    }

    return response.json();
  }

  /**
   * Refresh an expired access token using the refresh token
   */
  static async refreshAccessToken(
    refreshToken: string,
    clientId: string,
    clientSecret: string
  ): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  }> {
    const params = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
      "base64"
    );

    const response = await fetch(
      "https://api.pinterest.com/v5/oauth/token",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      }
    );

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      throw new Error(
        `Token refresh failed: ${response.status} — ${errBody}`
      );
    }

    return response.json();
  }

  // ─── Media Upload ───

  /**
   * Register an image URL for use in pin creation.
   * Pinterest will fetch and process the image.
   * Returns a media_id that can be used as media_source.
   */
  async registerImageUrl(imageUrl: string): Promise<string> {
    const data = await this.request<{ id: string }>("POST", "/media", {
      media_type: "images",
      cover_image_url: imageUrl,
    });
    return data.id;
  }
}

// Module-level request function for internal use
async function request<T>(
  method: string,
  url: string,
  headers?: Record<string, string>,
  body?: any
): Promise<T> {
  const options: RequestInit = { method, headers };
  if (body && method !== "GET") {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(
      `Pinterest API ${response.status}: ${errorBody.substring(0, 200)}`
    );
  }

  if (response.status === 204) return {} as T;
  return response.json();
}

export default PinterestClient;
