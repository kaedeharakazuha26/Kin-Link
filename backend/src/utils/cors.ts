export const isOriginAllowed = (origin?: string): boolean => {
  if (!origin) return true;
  try {
    const clean = origin.trim().replace(/\/+$/, '');
    const configuredOrigins = (process.env.CLIENT_URL || '')
      .split(',')
      .map((url) => url.trim().replace(/\/+$/, ''))
      .filter(Boolean);

    if (configuredOrigins.includes(clean)) return true;
    if (clean.includes('localhost') || clean.includes('127.0.0.1')) return true;

    const hostname = new URL(clean).hostname;
    // Automatically allow any Vercel domain (production and preview branches)
    if (hostname.endsWith('.vercel.app') || hostname === 'vercel.app') return true;

    // In non-production or if no CLIENT_URL configured, allow
    if (process.env.NODE_ENV !== 'production' || configuredOrigins.length === 0) return true;

    return false;
  } catch {
    return false;
  }
};
