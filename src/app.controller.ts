import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get() 
  getRoot() {
    return {
      message: 'API is running',
      graphql: '/graphql',
      timestamp: new Date().toISOString()
    };
  }

  @Get('/.well-known/appspecific/com.chrome.devtools.json')
  chromeDevTools() {
    return {};
  }
} 
// EbtKKqozQ7IBCEF

