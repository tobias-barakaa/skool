import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { SchoolTypeService } from '../services/school-type.service';
import { SchoolConfigurationResponse } from '../dtos/school-configuration';
import { ActiveUser } from 'src/auth/decorator/active-user.decorator';
import { ActiveUserData } from 'src/auth/interface/active-user.interface';
import { Auth } from 'src/auth/decorator/auth.decorator';
import { AuthType } from 'src/auth/enums/auth-type.enum';


@Resolver()
export class SchoolTypeResolver {
  constructor(private readonly schoolTypeService: SchoolTypeService) {}

  @Mutation(() => SchoolConfigurationResponse)
  // @Auth(AuthType.None)
  async configureSchoolLevelsByNames(
    @Args('levelNames', { type: () => [String] }) levelNames: string[],
    @ActiveUser() user: ActiveUserData
  ) {
    console.log('ActiveUser:', user);

    const subdomain = user.subdomain;
    console.log('Extracted subdomain:', subdomain);

    return await this.schoolTypeService.configureSchoolLevelsByNames(
      levelNames,
      subdomain || 'default',
      user.sub
    );
  }

  @Query(() => SchoolConfigurationResponse, { nullable: true })
  async getSchoolConfiguration(@ActiveUser() user: ActiveUserData) {
    console.log('ActiveUser:', user);

    const subdomain = user.subdomain;
    console.log('Extracted subdomain:', subdomain);

    return await this.schoolTypeService.getSchoolConfiguration(
      subdomain || 'default',
      user.sub
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
}


