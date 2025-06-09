import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import environmentValidation from './config/environment.validation';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { SchoolModule } from './school/school.module';



/* 
User created Modules
*/

const ENV = process.env.NODE_ENV;

@Module({
  imports: [
   
    ConfigModule.forRoot({
      isGlobal: true,
      // envFilePath: ['.env.development']
      envFilePath: !ENV ? '.env.development' : `.env.${ENV}`,
      load: [appConfig, databaseConfig],
      validationSchema: environmentValidation,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        // entities: [User],
        autoLoadEntities: configService.get('database.autoLoadEntities'),
        synchronize: configService.get('database.synchronize'),
        port: +configService.get('database.port'),
        username: configService.get('database.user'),
        password: configService.get('database.password'),
        host: configService.get('database.host'),
        database: configService.get('database.name'),
        ssl: { rejectUnauthorized: false },
      }),
    }),
    UsersModule,
    SchoolModule,

   
    
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
