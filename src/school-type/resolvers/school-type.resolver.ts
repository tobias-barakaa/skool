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

  @Auth(AuthType.Bearer)
  @Mutation(() => SchoolConfigurationResponse)
  async configureSchoolLevelsByNames(
    @Args('levelNames', { type: () => [String] }) levelNames: string[],
    @Context() context: any,
    @ActiveUser() user: ActiveUserData
  ) {
    // Extract subdomain from request headers or context
    const subdomain = this.extractSubdomain(context.req);
    
    return await this.schoolTypeService.configureSchoolLevelsByNames(
      levelNames,
      subdomain,
      String(user.sub) // Convert user.sub to string to match the expected parameter type
    );
  }

  @Auth(AuthType.Bearer)
  @Query(() => SchoolConfigurationResponse, { nullable: true })
  async getSchoolConfiguration(
    @Context() context: any,
    @ActiveUser() user: ActiveUserData
  ) {
    // Extract subdomain from request headers or context
    const subdomain = this.extractSubdomain(context.req);
    
    return await this.schoolTypeService.getSchoolConfiguration(
      subdomain,
      String(user.sub) // Convert user.sub to string to match the expected parameter type
    );
  }

  @Query(() => [String])
  async getAvailableLevelNames() {
    return [
      // CBC School levels
      'Pre-Primary',
      'Lower Primary',
      'Upper Primary',
      'Junior Secondary',
      'Senior Secondary',
      // Madrasa levels
      'Madrasa Beginners',
      'Madrasa Lower',
      'Madrasa Upper',
      'Madrasa Secondary',
      'Madrasa Advanced Alim',
      // Homeschool levels
      'Homeschool Early Years',
      'Homeschool Lower Primary',
      'Homeschool Upper Primary',
      'Homeschool Junior Secondary',
      'Homeschool Senior Secondary'
    ];
  }

  private extractSubdomain(request: any): string {
    // Extract subdomain from Host header
    const host = request?.headers?.host || request?.headers?.Host || "sawa.squl.co.ke";
    // const host = "sawa-4.squl.co.ke"
    
    console.log('Host:', host);
    
    if (!host) {
      throw new Error('Host header is required');
    }

    // Handle different formats: subdomain.domain.com or subdomain.localhost:3000
    const hostParts = host.split('.');
    
    // For development (localhost)
    if (host.includes('localhost')) {
      const subdomain = hostParts[0];
      return subdomain === 'localhost' ? 'default' : subdomain;
    }
    
    // For production (subdomain.squl.co.ke)
    if (hostParts.length >= 3) {
      return hostParts[0];
    }
    
    throw new Error('Invalid subdomain format');
  }
}

// import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
// import { UseGuards } from '@nestjs/common';
// import { SchoolTypeService } from '../services/school-type.service';
// import { SchoolConfigurationResponse } from '../dtos/school-configuration';
// import { ActiveUser } from 'src/auth/decorator/active-user.decorator';
// import { User } from 'src/users/entities/user.entity';
// import { Auth } from 'src/auth/decorator/auth.decorator';
// import { AuthType } from 'src/auth/enums/auth-type.enum';

// @Resolver()
// export class SchoolTypeResolver {
//   constructor(private readonly schoolTypeService: SchoolTypeService) {}

  
//   @Mutation(() => SchoolConfigurationResponse)
//   async configureSchoolLevelsByNamess(
//     @Args('levelNames', { type: () => [String] }) levelNames: string[],
//     @Context() context: any,
//     @ActiveUser() user: User
//   ) {
//     // Extract subdomain from request headers or context
//     const subdomain = this.extractSubdomain(context.req);
    
//     return await this.schoolTypeService.configureSchoolLevelsByNames(
//       levelNames,
//       subdomain,
//       user.id
//     );
//   }

//   @Query(() => SchoolConfigurationResponse, { nullable: true })
//   async getSchoolConfiguration(
//     @Context() context: any,
//     @ActiveUser() user: User
//   ) {
//     // Extract subdomain from request headers or context
//     const subdomain = this.extractSubdomain(context.req);
//     // const subdomain = "neww.squl.co.ke"
    
//     return await this.schoolTypeService.getSchoolConfiguration(
//       subdomain,
//       user.id
//     );
//   }

//   @Query(() => [String])
//   async getAvailableLevelNames(
//   ) {
//     // This query returns all available curriculum level names for the frontend
//     // You can expand this to filter by school type if needed
//     return [
//       // CBC School levels
//       'Pre-Primary',
//       'Lower Primary',
//       'Upper Primary',
//       'Junior Secondary',
//       'Senior Secondary',
//       // Madrasa levels
//       'Madrasa Beginners',
//       'Madrasa Lower',
//       'Madrasa Upper',
//       'Madrasa Secondary',
//       'Madrasa Advanced Alim',
//       // Homeschool levels
//       'Homeschool Early Years',
//       'Homeschool Lower Primary',
//       'Homeschool Upper Primary',
//       'Homeschool Junior Secondary',
//       'Homeschool Senior Secondary'
//     ];
//   }

//   private extractSubdomain(request: any): string {
//     // Extract subdomain from Host header
//     // const host = request.headers.host || request.headers.Host;
//     const host = "sawa.squl.co.ke"
//     console.log(host, 'no host availabel whatever you say...........')
//     if (!host) {
//       throw new Error('Host header is required');
//     }

//     // Handle different formats: subdomain.domain.com or subdomain.localhost:3000
//     const hostParts = host.split('.');
    
//     // For development (localhost)
//     if (host.includes('localhost')) {
//       const subdomain = hostParts[0];
//       return subdomain === 'localhost' ? 'default' : subdomain;
//     }
    
//     // For production (subdomain.squl.co.ke)
//     if (hostParts.length >= 3) {
//       return hostParts[0];
//     }
    
//     throw new Error('Invalid subdomain format');
//   }
// }