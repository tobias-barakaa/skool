// src/school-level-setting/school-level-setting.resolver.ts
import { Resolver, Mutation, Args, Context } from '@nestjs/graphql';
import { SchoolLevelSetting } from './entities/school-level-setting.entity';
import { SchoolLevelSettingService } from './providers/school-level-setting.service';

@Resolver(() => SchoolLevelSetting)
export class SchoolLevelSettingResolver {
  constructor(private readonly schoolLevelSettingservice: SchoolLevelSettingService) {}

  @Mutation(() => SchoolLevelSetting)
  async configureSchoolLevelsByNames(
    @Args('levelNames', { type: () => [String] }) levelNames: string[],
    @Context() context: any, // ✅ no GqlExecutionContext
  ): Promise<SchoolLevelSetting> {
    const req = context.req;
    const host = req?.headers?.host ?? 'localhost';
    // const host = "skool.squl.co.ke"

    const subdomain = this.extractSubdomain(host);

    return this.schoolLevelSettingservice.configureLevelsByNames(subdomain, levelNames);
  }

  private extractSubdomain(host: string): string {
    const parts = host.split('.');
    if (parts.length < 3) return ''; 
    return parts[0];
  }
}
