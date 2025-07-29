// src/run-seeder.ts
import { NestFactory } from '@nestjs/core';
import { SeederModule } from './seeder/seeder.module';
import { SeedingService } from './admin/school-type/seeds/school-type';


async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeederModule);
  const seeder = app.get(SeedingService);
  await seeder.seedAllSchoolTypes();
  await app.close();
}
bootstrap();
