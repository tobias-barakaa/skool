import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    TypeOrmModule.forFeature([Question, Option, Test, ReferenceMaterial]),
  ],
  providers: [
    TestService,
    CreateTestProvider,
    FindTestsProvider,
    UpdateTestProvider,
    GenerateQuestionsProvider,
  ],
})
export class TestModule {}
