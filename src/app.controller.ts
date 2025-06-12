import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('/.well-known/appspecific/com.chrome.devtools.json')
  chromeDevTools() {
    return {}; // or return some DevTools configuration if needed
  }
}