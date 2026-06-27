import rateLimit from 'express-rate-limit';

// ─── Security Headers ─────────────────────────────────────────────────────────
export function securityHeaders(req, res, next) {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  // XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Remove fingerprinting header
  res.removeHeader('X-Powered-By');
  // Permissions policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  // Only allow content from same origin (allow localhost for dev)
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src *"
  );

  next();
}

// ─── Rate Limiter ─────────────────────────────────────────────────────────────
export const rateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300,            // 300 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
  skip: (req) => {
    // Don't rate limit health check or SSE streams
    return req.path === '/api/health' || req.path.includes('/stream');
  },
});

// ─── Stricter Rate Limiter for Auth Endpoints ────────────────────────────────
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts, try again later.' },
});

// ─── Request Logger ───────────────────────────────────────────────────────────
export function requestLogger(req, res, next) {
  const start = Date.now();
  const { method, path, ip } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const color = status >= 500 ? '🔴' : status >= 400 ? '🟡' : status >= 300 ? '🔵' : '🟢';
    console.log(`${color} ${method} ${path} ${status} ${duration}ms — ${ip}`);
  });

  next();
}

// ─── Path Traversal Protection ────────────────────────────────────────────────
export function pathTraversalGuard(req, res, next) {
  const pathsToCheck = [
    req.query.path,
    req.query.root,
    req.body?.path,
    req.body?.root,
  ].filter(Boolean);

  for (const p of pathsToCheck) {
    if (typeof p === 'string' && (p.includes('../') || p.includes('..\\') || p.includes('%2e%2e'))) {
      return res.status(400).json({ error: 'Path traversal detected' });
    }
  }

  next();
}

// ─── JSON Body Error Handler ──────────────────────────────────────────────────
export function jsonErrorHandler(err, req, res, next) {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  next(err);
}

export default { securityHeaders, rateLimiter, authRateLimiter, requestLogger, pathTraversalGuard, jsonErrorHandler };
