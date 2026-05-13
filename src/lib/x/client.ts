import { TwitterApi } from "twitter-api-v2";

let client: TwitterApi | null = null;

export function getXClient(): TwitterApi {
  if (client) return client;

  const apiKey = process.env.X_API_KEY!;
  const apiSecret = process.env.X_API_SECRET!;
  const accessToken = process.env.X_ACCESS_TOKEN!;
  const accessSecret = process.env.X_ACCESS_SECRET!;
  const bearerToken = process.env.X_BEARER_TOKEN!;

  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
    throw new Error("X API credentials not configured in .env.local");
  }

  // OAuth 1.0a client for posting tweets
  client = new TwitterApi({
    appKey: apiKey,
    appSecret: apiSecret,
    accessToken: accessToken,
    accessSecret: accessSecret,
  });

  return client;
}

export function getXReadClient(): TwitterApi {
  const bearerToken = process.env.X_BEARER_TOKEN!;
  if (!bearerToken) {
    throw new Error("X Bearer Token not configured in .env.local");
  }
  return new TwitterApi(bearerToken);
}

/**
 * Post a tweet with optional media and link.
 * Returns the tweet ID and text on success.
 */
export async function postTweet(
  text: string,
  link?: string
): Promise<{ id: string; text: string } | null> {
  try {
    const xClient = getXClient();
    const content = link ? `${text}\n\n${link}` : text;

    // Ensure we don't exceed 280 chars (or 4000 for X Premium)
    const tweetText = content.length > 4000 ? content.slice(0, 3997) + "..." : content;

    const tweet = await xClient.v2.tweet(tweetText);
    console.log(`[X] Posted tweet ${tweet.data.id}: ${tweetText.slice(0, 60)}...`);
    return { id: tweet.data.id, text: tweetText };
  } catch (error: any) {
    console.error("[X] Failed to post tweet:", error?.message || error);
    return null;
  }
}

/**
 * Reply to a tweet.
 */
export async function replyToTweet(
  tweetId: string,
  text: string
): Promise<boolean> {
  try {
    const xClient = getXClient();
    await xClient.v2.reply(text, tweetId);
    console.log(`[X] Replied to ${tweetId}`);
    return true;
  } catch (error: any) {
    console.error("[X] Failed to reply:", error?.message || error);
    return false;
  }
}
