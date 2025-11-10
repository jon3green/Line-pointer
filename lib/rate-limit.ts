// Simple in-memory rate limiting
// For production, use Redis or a proper rate limiting service

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(identifier: string, limit: number = 5, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

// Middleware for API routes
export function checkRateLimit(identifier: string, limit?: number): { allowed: boolean; remaining: number } {
  const allowed = rateLimit(identifier, limit);
  const record = rateLimitMap.get(identifier);
  const remaining = limit ? Math.max(0, limit - (record?.count || 0)) : 0;
  
  return { allowed, remaining };
}

