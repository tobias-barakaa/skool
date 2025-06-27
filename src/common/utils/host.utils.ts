export function extractSubdomain(host: string): string | null {
    if (!host) return null;
    const parts = host.split('.');
    if (parts.length < 4) return null; 
    return parts[0]; // e.g., "greenfield.schoolapp.com" → "greenfield"
  }
  