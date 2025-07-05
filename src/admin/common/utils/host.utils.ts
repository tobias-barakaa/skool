function extractSubdomainFromRequest(request: any): string {
  console.log('🔍 Full request headers:', request.headers);
  
  // Get the host that the client is actually accessing
  const host = request.headers.host || request.headers['x-forwarded-host'];
  console.log('🔍 Host from headers:', host);
  
  // For your case: "nicole-navarro.squl.co.ke"
  if (host && host.includes('.squl.co.ke')) {
    const subdomain = host.split('.squl.co.ke')[0];
    console.log('🔍 Extracted subdomain:', subdomain);
    return subdomain;
  }
  
  // Fallback for local development
  if (host && host.includes('localhost')) {
    // Handle localhost with subdomain simulation
    // e.g., localhost:3000?subdomain=nicole-navarro
    const url = new URL(request.url, `http://${host}`);
    const subdomainParam = url.searchParams.get('subdomain');
    if (subdomainParam) {
      console.log('🔍 Extracted subdomain from param:', subdomainParam);
      return subdomainParam;
    }
  }
  
  throw new Error(`Unable to extract subdomain from host: ${host}`);
}