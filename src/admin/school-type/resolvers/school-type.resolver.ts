import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { Auth } from 'src/admin/auth/decorator/auth.decorator';
import { AuthType } from 'src/admin/auth/enums/auth-type.enum';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { SchoolConfigurationResponse } from '../dtos/school-configuration';
import { SchoolTypeService } from '../services/school-type.service';

@Resolver()
export class SchoolTypeResolver {
  constructor(private readonly schoolTypeService: SchoolTypeService) {}

  @Mutation(() => SchoolConfigurationResponse)
  async configureSchoolLevelsByNames(
    @Args('levelNames', { type: () => [String] }) levelNames: string[],
    @ActiveUser() user: ActiveUserData,
  ) {
    console.log('ActiveUser:', user);

    const subdomain = user.subdomain;
    console.log('Extracted subdomain:', subdomain);

    return await this.schoolTypeService.configureSchoolLevelsByNames(
      levelNames,
      subdomain || 'default',
      user.sub,
    );
  }

  // @Query(() => SchoolConfigurationResponse, { nullable: true })
  // async getSchoolConfiguration(@ActiveUser() user: ActiveUserData) {
  //   console.log('ActiveUser:', user);

  //   const subdomain = user.subdomain;
  //   console.log('Extracted subdomain:', subdomain);

  //   return await this.schoolTypeService.getSchoolConfiguration(
  //     subdomain || 'default',
  //     user.sub
  //   );
  // }

  @Query(() => SchoolConfigurationResponse, { nullable: true })
  @Auth(AuthType.Bearer)
  async getSchoolConfiguration(@ActiveUser() user: ActiveUserData) {
    console.log('ActiveUser:', user);

    const tenantId = user.tenantId;
    console.log('Tenant ID:', tenantId);

    const subdomain = user.subdomain || 'default';
    const userId = user.sub;
    return await this.schoolTypeService.getSchoolConfiguration(
      subdomain,
      userId,
      { tenantId },
    );
  }

  @Query(() => [String])
  async getAvailableLevelNames() {
    return [
      'Pre-Primary',
      'Lower Primary',
      'Upper Primary',
      'Junior Secondary',
      'Senior Secondary',
      'Madrasa Beginners',
      'Madrasa Lower',
      'Madrasa Upper',
      'Madrasa Secondary',
      'Madrasa Advanced Alim',
      'Homeschool Early Years',
      'Homeschool Lower Primary',
      'Homeschool Upper Primary',
      'Homeschool Junior Secondary',
      'Homeschool Senior Secondary',
    ];
  }

  @Query(() => String)
  debugHost(@Context() context): string {
    const req = context.req;
    console.log('🧪 Full headers:', req.headers);
    return req.headers['x-forwarded-host'] || req.headers.host;
  }
}
