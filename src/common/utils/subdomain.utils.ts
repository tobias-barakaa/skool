export function extractSubdomain(host: string): string | null {
    if (!host) return null;
  
    const parts = host.split('.');
    const isLocalhost = host.includes('localhost') || /^\d+\.\d+\.\d+\.\d+$/.test(host);
  
    if (parts.length === 4 && parts[1] === 'squl' && parts[2] === 'co' && parts[3] === 'ke') {
      return parts[0];
    }
  
    if (isLocalhost) return 'localhost';
    return null;
  }
  