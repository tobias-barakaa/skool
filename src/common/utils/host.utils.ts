export function extractSubdomain(host: string): string | null {
    if (!host) return null;
    const hostname = host.split(':')[0]; 
    const parts = hostname.split('.');
  
    if (parts.length < 3) return null; 
    return parts[0]; 
  }
  