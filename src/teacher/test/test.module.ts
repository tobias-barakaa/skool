import { Module, forwardRef } from '@nestjs/common';
import { TestService } from './providers/test.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from './entities/question.entity';
import { Test } from './entities/test.entity';
import { Option } from './entities/option.entity';
import { ReferenceMaterial } from './entities/reference-material.entity';
import { CreateTestProvider } from './providers/create-test.provider';
import { FindTestsProvider } from './providers/find-tests.provider';
import { UpdateTestProvider } from './providers/update-test.provider';
import { GenerateQuestionsProvider } from './providers/generate-questions.provider';
import { TestResolver } from './test.resolver';
import { TeacherModule } from 'src/admin/teacher/teacher.module';
import { LevelModule } from 'src/admin/level/level.module';
import { UserModule } from 'src/admin/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Question, Option, Test, ReferenceMaterial]),
    forwardRef(() => TeacherModule),
    LevelModule,
    forwardRef(() => UserModule),
  ],
  providers: [
    TestService,
    CreateTestProvider,
    FindTestsProvider,
    UpdateTestProvider,
    GenerateQuestionsProvider,
    TestResolver,
  ],
})
export class TestModule {}
