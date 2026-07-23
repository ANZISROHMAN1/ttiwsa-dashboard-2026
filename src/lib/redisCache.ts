import { Redis } from "@upstash/redis";

const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
    })
  : null;

export async function getCachedData<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    const data = await redis.get<T>(key);
    return data;
  } catch (error) {
    console.error(`Redis Get Error for key ${key}:`, error);
    return null;
  }
}

export async function setCachedData<T>(key: string, data: T, expiresInSeconds: number = 60): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(key, data, { ex: expiresInSeconds });
  } catch (error) {
    console.error(`Redis Set Error for key ${key}:`, error);
  }
}
