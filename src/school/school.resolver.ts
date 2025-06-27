import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Organization } from 'src/organizations/entities/organizations-entity';
import { ActiveUserData } from 'src/auth/interface/active-user.interface';
import { Student } from 'src/student/entities/student.entity';
import { ActiveUser } from 'src/auth/decorator/active-user.decorator';
import { SchoolTypeConfig } from './dtos/school-type-config';
import { SchoolService } from './providers/school.service';
import { SCHOOL_TYPES_CONFIG } from './config/school-type.config';
import { UpdateSchoolConfigurationInput } from './dtos/update-school-configuration-input';

@Resolver(() => Organization)
export class SchoolResolver {
  constructor(
    private readonly schoolService: SchoolService,
  ) {}

  @Query(() => [SchoolTypeConfig])
  async getSchoolTypes(): Promise<SchoolTypeConfig[]> {
    return Object.entries(SCHOOL_TYPES_CONFIG).map(([key, config]) => ({
      type: key,
      ...config,
      levels: Object.values(config.levels) 
    }));
  }


}