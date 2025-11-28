import { Controller, Get } from '@nestjs/common';
import { Auth } from './admin/auth/decorator/auth.decorator';
import { AuthType } from './admin/auth/enums/auth-type.enum';
import { Public } from './admin/auth/decorator/public.decorator';

@Controller()
export class AppController {

  @Public() 
  @Auth(AuthType.None)
  @Get()
  getRoot() {
    return {
      message: 'API is running',
      graphql: '/graphql',
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Auth(AuthType.None)
  @Get('/.well-known/appspecific/com.chrome.devtools.json')
  chromeDevTools() {
    return {};
  }

  @Public()
  @Auth(AuthType.None)
  @Get('health')
  health() {
    return { 
      status: 'ok', 
      timestamp: new Date().toISOString() 
    };
  }

  @Get()
root() {
  return { status: 'ok' };
}
}

// import { Controller, Get } from '@nestjs/common';
// import { Auth } from './admin/auth/decorator/auth.decorator';
// import { AuthType } from './admin/auth/enums/auth-type.enum';
// import { Public } from './admin/auth/decorator/public.decorator';

// @Controller()
// export class AppController {

//   @Public() 
//   @Get()
//   @Auth(AuthType.None)
//   getRoot() {
//     return {
//       message: 'API is running',
//       graphql: '/graphql',
//       timestamp: new Date().toISOString(),
//     };
//   }

//   @Get('/.well-known/appspecific/com.chrome.devtools.json')
//   chromeDevTools() {
//     return {};
//   }


//   @Get('health')
//   health() {
//     return { status: 'ok', timestamp: new Date().toISOString() };
//   }
// }
// // N1GYZjUwLRfyib4
