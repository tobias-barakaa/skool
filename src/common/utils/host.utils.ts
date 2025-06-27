export function extractSubdomain(host: string): string | null {
    if (!host) return null;
    const hostname = host.split(':')[0]; // Remove port if present
    const parts = hostname.split('.');
  
    if (parts.length < 3) return null; // e.g., just "zelisline.com" → no subdomain
    return parts[0]; // e.g., "skool" in "skool.zelisline.com"
  }
  