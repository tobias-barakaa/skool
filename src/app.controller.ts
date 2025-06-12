import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get() // This handles GET requests to "/"
  getRoot() {
    return {
      message: 'API is running',
      graphql: '/graphql',
      timestamp: new Date().toISOString()
    };
  }

  @Get('/.well-known/appspecific/com.chrome.devtools.json')
  chromeDevTools() {
    return {}; // or return some DevTools configuration if needed
  }
}