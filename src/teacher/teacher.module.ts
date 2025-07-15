import { Module } from '@nestjs/common';
import { TestModule } from './test/test.module';

@Module({
  imports: [TestModule, TestModule],
  exports: [TestModule],
  providers: []

})
export class TeacherModule {}
