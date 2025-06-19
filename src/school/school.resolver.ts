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

  @Query(() => Organization)
  async getCurrentOrganization(@ActiveUser() user: ActiveUserData) {
    return this.schoolService.getOrganizationById(user.organizationId);
  }

  @Query(() => [Student])
  async getStudentsByLevel(
    @Args('level') level: string,
    @Args('grade') grade: string,
    @ActiveUser() user: ActiveUserData
  ): Promise<Student[]> {
    return this.schoolService.getStudentsByLevel(user.organizationId, level, grade);
  }

  @Mutation(() => Organization)
  async updateSchoolConfiguration(
  @Args('data') data: UpdateSchoolConfigurationInput,
  @ActiveUser() user: ActiveUserData,
) {
  return this.schoolService.updateSchoolConfiguration(
    user.organizationId,
    data.schoolType,
    data.selectedLevels,
  );
}

}