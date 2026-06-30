/**
 * Simple in-memory rate limiter
 * For production, consider using Redis or a dedicated rate limiting service
 */

const attempts = new Map();

/**
 * Rate limit a request by key
 * @param {string} key - Identifier (IP address, email, etc.)
 * @param {number} maxAttempts - Maximum attempts allowed
 * @param {number} windowMs - Time window in milliseconds
 * @throws {Error} If rate limit exceeded
 */
function rateLimit(key, maxAttempts, windowMs) {
  const now = Date.now();
  const record = attempts.get(key) || [];
  
  // Filter out attempts outside the time window
  const recentAttempts = record.filter(time => now - time < windowMs);
  
  if (recentAttempts.length >= maxAttempts) {
    const oldestAttempt = Math.min(...recentAttempts);
    const waitTime = Math.ceil((windowMs - (now - oldestAttempt)) / 1000);
    throw new Error(`Too many requests. Please try again in ${waitTime} seconds.`);
  }
  
  // Record this attempt
  recentAttempts.push(now);
  attempts.set(key, recentAttempts);
}

// Cleanup old entries every 10 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, times] of attempts.entries()) {
    // Keep entries from the last hour only
    const filtered = times.filter(t => now - t < 3600000);
    if (filtered.length === 0) {
      attempts.delete(key);
    } else {
      attempts.set(key, filtered);
    }
  }
}, 600000);

module.exports = { rateLimit };
