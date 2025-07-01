import { Request } from 'express';

export function extractSubdomainFromRequest(req: Request): string | null {
  const host = req.headers['x-forwarded-host'] || req.headers['host'];
  if (!host) return null;

  const hostname = (host as string).split(':')[0];
  const parts = hostname.split('.');

  if (parts.length < 3) return null;
  return parts[0];
}
