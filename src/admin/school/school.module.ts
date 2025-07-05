import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { School } from './entities/school.entity';
import { SchoolService } from './providers/school.service';
import { SchoolCreateProvider } from './providers/school-create.provider';
import { OrganizationsModule } from 'src/admin/organizations/organizations.module';
import { StudentModule } from 'src/admin/student/student.module';
import { Organization } from 'src/admin/organizations/entities/organizations-entity';
import { Student } from 'src/admin/student/entities/student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([School,
    Organization,
    Student])],
  providers: [SchoolService, SchoolCreateProvider],
  exports: [SchoolService, SchoolCreateProvider, TypeOrmModule],
})
export class SchoolsModule {}
