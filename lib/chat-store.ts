// lib/chat-store.ts
import Redis from "ioredis";

// Utilisation d'une instance globale pour éviter de multiplier les connexions lors du Hot Reload Next.js
const globalForRedis = globalThis as unknown as { redisClient: Redis };

export const redis =
  globalForRedis.redisClient ||
  new Redis(process.env.REDIS_URL || "redis://localhost:6379");

if (process.env.NODE_ENV !== "production") globalForRedis.redisClient = redis;

const getRedisKey = (sessionId: string) => `chat:pending:${sessionId}`;

/**
 * Enregistre la réponse envoyée par le Callback n8n
 * @param sessionId ID de la session
 * @param message Message généré
 */
export async function savePendingResponse(sessionId: string, message: string) {
  const key = getRedisKey(sessionId);
  // 'EX', 600 : Expire automatiquement au bout de 10 minutes (600 secondes)
  await redis.set(key, message, "EX", 600);
}

/**
 * Récupère puis supprime immédiatement la réponse dans Redis
 * @param sessionId ID de la session
 */
export async function getAndDeletePendingResponse(sessionId: string): Promise<string | null> {
  const key = getRedisKey(sessionId);
  // GETDEL est une commande Redis atomique (lit et supprime en 1 seule opération)
  const response = await redis.getdel(key);
  return response;
}