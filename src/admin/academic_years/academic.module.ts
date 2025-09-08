import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TermResolver } from './resolvers/term.resolver';
import { AcademicYear } from './entities/academic_years.entity';
import { Term } from './entities/terms.entity';
import { AcademicYearService } from './services/academic.service';
import { TermService } from './services/term.service';
import { AcademicYearResolver } from './resolvers/academic.resolvers';

@Module({
  imports: [TypeOrmModule.forFeature([AcademicYear, Term])],
  providers: [AcademicYearService, TermService, AcademicYearResolver, TermResolver],
})
export class AcademicModule {}
