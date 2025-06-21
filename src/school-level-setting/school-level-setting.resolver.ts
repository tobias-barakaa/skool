// school-level-setting.resolver.ts
import { Resolver, Mutation, Args, Context, Query } from '@nestjs/graphql';
import { SchoolLevelSetting } from './entities/school-level-setting.entity';
import { Level } from '../level/entities/level.entities';
import { SchoolLevelSettingService } from './providers/school-level-setting.service';
import { BusinessException } from 'src/common/exceptions/business.exception';

@Resolver(() => SchoolLevelSetting)
export class SchoolLevelSettingResolver {
  constructor(private readonly schoolLevelSettingService: SchoolLevelSettingService) {}

  @Mutation(() => SchoolLevelSetting)
  async configureSchoolLevelsByNames(
    @Args('levelNames', { type: () => [String] }) levelNames: string[],
    @Context() context: any,
  ): Promise<SchoolLevelSetting> {
    try {
      console.log('🚀 Resolver: configureSchoolLevelsByNames called with:', levelNames);
      
      if (!levelNames || levelNames.length === 0) {
        throw new BusinessException('You must select at least one level.', 'NO_LEVELS_SELECTED');
      }

      const req = context.req;
    //   const host = req?.headers?.host ?? 'localhost';
    const host = "what.squl.co.ke";

      
    //   console.log('🌐 Host from request:', host);
      
      // For testing, let's use a fixed host if needed
    //   const testHost = 'what.squl.co.ke';
      const subdomain = this.extractSubdomain(host);

      console.log('🏢 Extracted subdomain:', subdomain);

      if (!subdomain) {
        throw new BusinessException('Invalid subdomain. Please access through your school URL.', 'INVALID_SUBDOMAIN');
      }

      const result = await this.schoolLevelSettingService.configureLevelsByNames(subdomain, levelNames);
      console.log('✅ Resolver: Operation completed successfully');
      return result;
    } catch (error) {
      console.error('❌ Resolver error:', error);
      throw error;
    }
  }

  @Query(() => SchoolLevelSetting, { nullable: true })
  async getSchoolLevelConfiguration(
    @Context() context: any,
  ): Promise<SchoolLevelSetting | null> {
    const req = context.req;
    // const host = req?.headers?.host ?? 'localhost';
    const host = "what.squl.co.ke";

    const subdomain = this.extractSubdomain(host);

    if (!subdomain) {
      throw new BusinessException('Invalid subdomain. Please access through your school URL.', 'INVALID_SUBDOMAIN');
    }

    return this.schoolLevelSettingService.getSchoolLevelConfiguration(subdomain);
  }

  @Query(() => [Level])
  async getAvailableLevelsForSchool(
    @Context() context: any,
  ): Promise<Level[]> {
    const req = context.req;
    const host = req?.headers?.host ?? 'localhost';
    const subdomain = this.extractSubdomain(host);

    if (!subdomain) {
      throw new BusinessException('Invalid subdomain. Please access through your school URL.', 'INVALID_SUBDOMAIN');
    }

    return this.schoolLevelSettingService.getAvailableLevelsForSchool(subdomain);
  }

  @Mutation(() => SchoolLevelSetting)
  async removeLevelFromSchool(
    @Args('levelName') levelName: string,
    @Context() context: any,
  ): Promise<SchoolLevelSetting> {
    const req = context.req;
    const host = req?.headers?.host ?? 'localhost';
    const subdomain = this.extractSubdomain(host);

    if (!subdomain) {
      throw new BusinessException('Invalid subdomain. Please access through your school URL.', 'INVALID_SUBDOMAIN');
    }

    return this.schoolLevelSettingService.removeLevelFromSchool(subdomain, levelName);
  }

  private extractSubdomain(host: string): string {
    const parts = host.split('.');
    if (parts.length < 3) return '';
    return parts[0];
  }
}