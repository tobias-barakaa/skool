// import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
// import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
// import { Auth } from 'src/admin/auth/decorator/auth.decorator';
// import { AuthType } from 'src/admin/auth/enums/auth-type.enum';
// import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
// import { SchoolConfigurationResponse } from '../dtos/school-configuration';
// import { DataSource } from 'typeorm';
// import { SchoolConfig } from '../entities/school-config.entity';
// import { ConfigureSchoolLevelsInput } from '../dtos/try';
// import { SchoolConfigurationService } from '../services/school-type.service';

// @Resolver()
// export class SchoolTypeResolver {
//   constructor(
//     private readonly schoolConfigService: SchoolConfigurationService,
//     private readonly dataSource: DataSource,
//   ) {}

//   @Mutation(() => SchoolConfigurationResponse)
//   @Auth(AuthType.Bearer)
//   async configureSchoolLevelsByNames(
//     @Args('levelNames', { type: () => [String] }) levelNames: string[],
//     @ActiveUser() user: ActiveUserData,
//   ) {

//     const config = await this.schoolConfigService.configureSchoolLevels(
//       levelNames,
//       user,
//     );

//     return mapSchoolConfigToResponse(config);
//   }




// @Query(() => SchoolConfigurationResponse)
// @Auth(AuthType.Bearer)
// async getSchoolConfiguration(
//   @ActiveUser() user: ActiveUserData,
// ): Promise<SchoolConfigurationResponse> {
//    console.log(user, 'this is userrrxxxx');
//   const config = await this.schoolConfigService.getSchoolConfiguration(user);
//   return mapSchoolConfigToGetResponse(config);
// }

// // Updated mapping function for GET query (more detailed than create)

// }

// function mapSchoolConfigToResponse(
//   config: SchoolConfig,
// ): SchoolConfigurationResponse {
//   return {
//     id: config.id,
//     tenant: {
//       id: config.tenant.id,
//       schoolName: config.tenant.name,
//       subdomain: config.tenant.subdomain,
//     },
//     selectedLevels:
//       config.configLevels?.map((cl) => ({
//         id: cl.level.id,
//         name: cl.level.name,
//         gradeLevels:
//           cl.gradeLevels?.map((gl) => ({
//             id: gl.gradeLevel.id,
//             name: gl.gradeLevel.name,
//             code: gl.gradeLevel.code ?? null,
//             order: gl.gradeLevel.order ?? null,
//           })) ?? [],
//       })) ?? [],
//     createdAt: config.createdAt,
//     updatedAt: config.updatedAt,
//   };
// }



//   function mapSchoolConfigToGetResponse(
//   config: SchoolConfig,
// ): SchoolConfigurationResponse {
//   return {
//     id: config.id,
//     tenant: {
//       id: config.tenant.id,
//       schoolName: config.tenant.name,
//       subdomain: config.tenant.subdomain,
//     },
//     selectedLevels:
//       config.configLevels?.map((cl) => ({
//         id: cl.level.id,
//         name: cl.level.name,
//         description: cl.level.description ?? null,
//         subjects:
//           cl.subjects?.map((s) => ({
//             id: s.subject.id,
//             name: s.subject.name,
//             code: s.subject.code,
//             subjectType: s.subject.subjectType,
//             category: s.subject.category,
//             department: s.subject.department,
//             shortName: s.subject.shortName,
//             isCompulsory: s.subject.isCompulsory,
//             totalMarks: s.subject.totalMarks,
//             passingMarks: s.subject.passingMarks,
//             creditHours: s.subject.creditHours,
//             curriculum: s.subject.curriculum,
//           })) ?? [],
//         gradeLevels:
//           cl.gradeLevels?.map((gl) => ({
//             id: gl.gradeLevel.id,
//             name: gl.gradeLevel.name,
//             streams:
//               gl.gradeLevel.streams?.map((stream) => ({
//                 id: stream.id,
//                 name: stream.name,
//                 capacity: stream.capacity ?? null,
//                 isActive: stream.isActive ?? false,
//                 description: stream.description ?? null,
//                 gradeLevel: stream.gradeLevel ?? null,
//                 createdAt: stream.createdAt ?? null,
//                 updatedAt: stream.updatedAt ?? null,
//                 students: stream.students ?? [],
//                 tenant: stream.tenant ?? null,
//                 tenantId: stream.tenantId ?? null,
//               })) ?? [],
//             age: gl.gradeLevel.age !== null && gl.gradeLevel.age !== undefined ? gl.gradeLevel.age.toString() : undefined,
//           })) ?? [],
//       })) ?? [],
//     createdAt: config.createdAt,
//     updatedAt: config.updatedAt,
//   };

// }










//   // @Mutation(() => SchoolConfigurationResponse)
//   // async configureSchoolLevelsByNames(
//   //   @Args('levelNames', { type: () => [String] }) levelNames: string[],
//   //   @ActiveUser() user: ActiveUserData,
//   // ) {
//   //   console.log('ActiveUser:', user);

//   //   const subdomain = user.subdomain;
//   //   console.log('Extracted subdomain:', subdomain);

//   //   return await this.schoolTypeService.configureSchoolLevelsByNames(
//   //     levelNames,
//   //     subdomain || 'default',
//   //     user.sub,
//   //   );
//   // }

//   // @Query(() => SchoolConfigurationResponse, { nullable: true })
//   // async getSchoolConfiguration(@ActiveUser() user: ActiveUserData) {
//   //   console.log('ActiveUser:', user);

//   //   const subdomain = user.subdomain;
//   //   const manager = this.dataSource.manager;

//   //   const schoolConfig = await manager.findOne(SchoolConfig, {
//   //     where: {
//   //       tenant: { subdomain }, // lookup by tenant.subdomain
//   //     },
//   //     relations: [
//   //       'tenant',
//   //       'configLevels',
//   //       'configLevels.level',
//   //       'configLevels.level.curriculum',
//   //       'configLevels.gradeLevels',
//   //       'configLevels.gradeLevels.gradeLevel',
//   //       'configLevels.gradeLevels.gradeLevel.level',
//   //       'configLevels.subjects',
//   //       'configLevels.subjects.subject',
//   //     ],
//   //   });

//   //   if (!schoolConfig) {
//   //     throw new Error(`SchoolConfig not found for subdomain: ${subdomain}`);
//   //   }

//   //   return await this.schoolTypeService.getSchoolConfiguration(
//   //     schoolConfig.id,
//   //     manager,
//   //   );
//   // }

//   // @Query(() => SchoolConfigurationResponse, { nullable: true })
//   // @Auth(AuthType.Bearer)
//   // async getSchoolConfiguration(@ActiveUser() user: ActiveUserData) {
//   //   console.log('ActiveUser:', user);

//   //   const tenantId = user.tenantId;
//   //   console.log('Tenant ID:', tenantId);

//   //   const subdomain = user.subdomain || 'default';
//   //   const userId = user.sub;
//   //   return await this.schoolTypeService.getSchoolConfiguration(
//   //     subdomain,
//   //     userId,
//   //     { tenantId },
//   //   );
//   // };

// //   @Query(() => [String])
// //   async getAvailableLevelNames() {
// //     return [
// //       'Pre-Primary',
// //       'Lower Primary',
// //       'Upper Primary',
// //       'Junior Secondary',
// //       'Senior Secondary',
// //       'Madrasa Beginners',
// //       'Madrasa Lower',
// //       'Madrasa Upper',
// //       'Madrasa Secondary',
// //       'Madrasa Advanced Alim',
// //       'Homeschool Early Years',
// //       'Homeschool Lower Primary',
// //       'Homeschool Upper Primary',
// //       'Homeschool Junior Secondary',
// //       'Homeschool Senior Secondary',
// //     ];
// //   }

// //   @Query(() => String)
// //   debugHost(@Context() context): string {
// //     const req = context.req;
// //     console.log('🧪 Full headers:', req.headers);
// //     return req.headers['x-forwarded-host'] || req.headers.host;
// //   }
// // }
