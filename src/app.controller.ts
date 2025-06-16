import { Controller, Get } from '@nestjs/common';
import { Auth } from './auth/decorator/auth.decorator';
import { AuthType } from './auth/enums/auth-type.enum';

@Controller()
export class AppController {
  @Get() 
  @Auth(AuthType.None)
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

