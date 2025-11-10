import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuperAdminAuthService } from './user/providers/super-admin-auth.service';
import { SuperAdminAuthResolver } from './user/super-admin-auth.resolver';
import { AuthModule } from 'src/admin/auth/auth.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([]),
    AuthModule,
    
   
  ],
  providers: [
       
    SuperAdminAuthService,
    SuperAdminAuthResolver,
  ],
  exports: [],
})
export class SuperAdminModule {}
