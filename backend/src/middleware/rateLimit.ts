import { Response, NextFunction } from "express";
import { AuthedRequest } from "./auth";

/**
 * Minimal in-memory sliding-window rate limiter, keyed by userId.
 * Good enough for a single-instance deploy. If you ever run more than one
 * backend instance, swap this for a Redis-backed limiter — this state
 * won't be shared across processes.
 */
function makeLimiter(opts: { windowMs: number; max: number; message: string }) {
  const hits = new Map<string, number[]>();

  return function rateLimit(req: AuthedRequest, res: Response, next: NextFunction) {
    const key = req.userId || req.ip || "anonymous";
    const now = Date.now();
    const windowStart = now - opts.windowMs;

    const timestamps = (hits.get(key) || []).filter((t) => t > windowStart);
    if (timestamps.length >= opts.max) {
      return res.status(429).json({ error: opts.message });
    }

    timestamps.push(now);
    hits.set(key, timestamps);

    // Periodic cleanup so the map doesn't grow unbounded.
    if (hits.size > 5000) {
      for (const [k, v] of hits) {
        if (v.every((t) => t <= windowStart)) hits.delete(k);
      }
    }

    next();
  };
}

// AI-calling endpoints: expensive, so tighter limits.
export const aiRateLimit = makeLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: "Too many AI requests. Please wait a moment and try again.",
});

// Uploads: cheaper than AI calls, but still worth capping.
export const uploadRateLimit = makeLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: "Too many uploads. Please wait a moment and try again.",
});
