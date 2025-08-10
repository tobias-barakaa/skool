// import {
//   BadRequestException,
//   ConflictException,
//   ForbiddenException,
//   Injectable,
//   InternalServerErrorException,
//   NotFoundException,
// } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Curriculum } from 'src/admin/curriculum/entities/curicula.entity';
// import { CurriculumSubject } from 'src/admin/curriculum/entities/curriculum_subjects.entity';
// import { School } from 'src/admin/school/entities/school.entity';
// import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
// import { DataSource, In, Repository, EntityManager } from 'typeorm';
// import { SchoolConfig } from '../entities/school-config.entity';
// import { SchoolLevel } from '../entities/school_level.entity';
// import { GradeLevel } from 'src/admin/level/entities/grade-level.entity';
// import { MembershipRole } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';
// import { type } from 'os';
// import { SchoolConfigLevel } from '../entities/school_config_level';
// import { SchoolConfigGradeLevel } from '../entities/school_config_grade_level';
// import { SchoolConfigSubject } from '../entities/school_config_subject';
// import Redis from 'ioredis';
// import { InjectRedis } from '@nestjs-modules/ioredis';
// import { SchoolConfigurationResponse } from '../dtos/school-configuration';
// import { SubjectType } from 'src/admin/subject/enums/subject.type.enum';
// import { Level } from 'src/admin/level/entities/level.entities';
// import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
// import { SchoolType } from '../entities/school-type';
// import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
// // import { SchoolConfigurationResponse } from '../dtos/school-configuration';


// @Injectable()
// export class SchoolConfigurationService {
//   constructor(
//     @InjectRepository(Level) private levelRepo: Repository<Level>,
//     @InjectRepository(SchoolType)
//     private schoolTypeRepo: Repository<SchoolType>,
//     @InjectRepository(Tenant) private tenantRepo: Repository<Tenant>,
//     @InjectRepository(SchoolConfig)
//     private schoolConfigRepo: Repository<SchoolConfig>,
//     @InjectRepository(SchoolConfigLevel)
//     private configLevelRepo: Repository<SchoolConfigLevel>,
//     @InjectRepository(SchoolConfigGradeLevel)
//     private configGradeLevelRepo: Repository<SchoolConfigGradeLevel>,
//     @InjectRepository(SchoolConfigSubject)
//     private configSubjectRepo: Repository<SchoolConfigSubject>,
//     @InjectRepository(CurriculumSubject)
//     private curriculumSubjectRepo: Repository<CurriculumSubject>,
//     @InjectRepository(GradeLevel)
//     private gradeLevelRepo: Repository<GradeLevel>,
//   ) {}

//   async configureSchoolLevelsByNames(
//     levelNames: string[],
//     @ActiveUser() user: ActiveUserData,
//   ): Promise<SchoolConfigurationResponse> {
//     const tenant = await this.tenantRepo.findOneByOrFail({ id: user.tenantId });

//     /* 1.  Tenant already configured? */
//     const existing = await this.schoolConfigRepo.findOne({
//       where: { tenant: { id: tenant.id } },
//       relations: ['configLevels'],
//     });
//     if (existing && existing.configLevels.length) {
//       throw new BadRequestException('School already configured');
//     }

//     /* 2.  Load requested levels and verify they belong to ONE school-type */
//     const levels = await this.levelRepo.find({
//       where: { name: In(levelNames) },
//       relations: ['schoolType', 'gradeLevels'],
//     });
//     if (levels.length !== levelNames.length) {
//       throw new BadRequestException('Some levels do not exist');
//     }
//     const distinctTypes = new Set(levels.map((l) => l.schoolType.id));
//     if (distinctTypes.size !== 1) {
//       throw new BadRequestException(
//         'Levels must belong to a single school type',
//       );
//     }
//     const schoolType = levels[0].schoolType;

//     /* 3.  Create or update the tenant’s SchoolConfig */
//     let config = await this.schoolConfigRepo.findOne({
//       where: { tenant: { id: tenant.id } },
//     });
//     if (!config) {
//       config = this.schoolConfigRepo.create({
//         tenant,
//         schoolType,
//         isActive: true,
//       });
//       config = await this.schoolConfigRepo.save(config);
//     }

//     /* 4.  Persist levels, grade-levels, subjects */
//     for (const level of levels) {
//       const cfgLevel = await this.schoolConfigLevelRepo.save(
//         this.schoolConfigLevelRepo.create({
//           schoolConfig: config,
//           level,
//         }),
//       );

//       // Save Grade Levels
//       const cfgGrades = level.gradeLevels.map((g) =>
//         this.schoolConfigGradeLevelRepo.create({
//           configLevel: cfgLevel,
//           gradeLevel: g,
//         }),
//       );
//       await this.schoolConfigGradeLevelRepo.save(cfgGrades);

//       // 🔥 Fetch subjects ONLY for the grade levels of this level
//       const curriculumSubjects = await this.curriculumSubjectRepo.find({
//         where: {
//           gradeLevel: In(level.gradeLevels.map((g) => g.id)), // only fetch for this level’s grade levels
//           curriculum: { schoolType: { id: schoolType.id } },
//         },
//         relations: ['subject'],
//       });

//       // Save Subjects
//       const cfgSubjects = curriculumSubjects.map((cs) =>
//         this.schoolConfigSubjectRepo.create({
//           configLevel: cfgLevel,
//           subject: cs.subject,
//           subjectType:
//             cs.subjectType === SubjectType.ELECTIVE ? 'elective' : 'core',
//         }),
//       );
//       await this.schoolConfigSubjectRepo.save(cfgSubjects);
//     }

//     /* 5.  Return full DTO */
//     return this.schoolConfigRepo.findOne({
//       where: { id: config.id },
//       relations: [
//         'tenant',
//         'schoolType',
//         'configLevels',
//         'configLevels.level',
//         'configLevels.gradeLevels',
//         'configLevels.subjects',
//         'configLevels.subjects.subject',
//       ],
//     });
//   }

//   async getSchoolConfiguration(
//     userData: ActiveUserData,
//   ): Promise<SchoolConfig> {
//     // Find the school configuration for the user's tenant
//     const schoolConfig = await this.schoolConfigRepo.findOne({
//       where: {
//         tenant: { id: userData.tenantId },
//         isActive: true,
//       },
//       relations: [
//         'tenant',
//         'schoolType',
//         'configLevels',
//         'configLevels.level',
//         'configLevels.gradeLevels',
//         'configLevels.gradeLevels.gradeLevel',
//         'configLevels.gradeLevels.gradeLevel.streams',
//         'configLevels.subjects',
//         'configLevels.subjects.subject',
//       ],
//     });

//     if (!schoolConfig) {
//       throw new NotFoundException(
//         'School configuration not found for this tenant',
//       );
//     }

//     return schoolConfig;
//   }
// }

// // Updated mapping function to ensure proper structure


// // @Injectable()
// // export class SchoolTypeService {
// //   constructor(
// //     @InjectRepository(School)
// //     private readonly schoolRepo: Repository<School>,
// //     @InjectRepository(Curriculum)
// //     private readonly curriculumRepo: Repository<Curriculum>,
// //     @InjectRepository(SchoolConfig)
// //     private readonly schoolConfigRepo: Repository<SchoolConfig>,
// //     @InjectRepository(SchoolConfigLevel)
// //     private readonly schoolConfigLevelRepo: Repository<SchoolConfigLevel>,
// //     @InjectRepository(SchoolConfigGradeLevel)
// //     private readonly schoolConfigGradeLevelRepo: Repository<SchoolConfigGradeLevel>,
// //     @InjectRepository(SchoolConfigSubject)
// //     private readonly schoolConfigSubjectRepo: Repository<SchoolConfigSubject>,
// //     @InjectRepository(CurriculumSubject)
// //     private readonly curriculumSubjectsRepo: Repository<CurriculumSubject>,
// //     @InjectRepository(Tenant)
// //     private readonly tenantRepo: Repository<Tenant>,
// //     @InjectRepository(GradeLevel)
// //     private readonly gradeLevelRepo: Repository<GradeLevel>,
// //     @InjectRepository(SchoolLevel)
// //     private readonly schoolLevelRepo: Repository<SchoolLevel>,
// //   ) {}

// //   private async assertSchoolNotConfigured(tenantId: string): Promise<void> {
// //   const existingConfig = await this.schoolConfigRepo.findOne({
// //     where: {
// //       tenant: { id: tenantId },
// //     },
// //   });

// //   if (existingConfig) {
// //     throw new BadRequestException('School has already been configured');
// //   }
// // }


// //   private async clearExistingConfiguration(
// //     schoolConfigId: string,
// //   ): Promise<void> {
// //     // Find all SchoolConfigLevel IDs
// //     const configLevels = await this.schoolConfigLevelRepo.find({
// //       where: { schoolConfig: { id: schoolConfigId } },
// //     });

// //     const configLevelIds = configLevels.map((cl) => cl.id);

// //     if (configLevelIds.length === 0) {
// //       return;
// //     }

// //     // Delete grade level configurations
// //     await this.schoolConfigGradeLevelRepo.delete({
// //       configLevel: { id: In(configLevelIds) },
// //     });

// //     // Delete subject configurations
// //     await this.schoolConfigSubjectRepo.delete({
// //       configLevel: { id: In(configLevelIds) },
// //     });

// //     // Delete config levels
// //     await this.schoolConfigLevelRepo.delete({
// //       schoolConfig: { id: schoolConfigId },
// //     });
// //   }

// //   private async validateTenantOwnership(
// //     subdomain: string,
// //     userId: string,
// //   ): Promise<Tenant> {
// //     const tenant = await this.tenantRepo.findOne({
// //       where: { subdomain },
// //       relations: ['memberships', 'memberships.user'],
// //     });

// //     if (!tenant) {
// //       throw new BadRequestException('Tenant not found');
// //     }

// //     const userMembership = tenant.memberships?.find(
// //       (membership) => membership.user.id === userId,
// //     );

// //     if (
// //       !userMembership ||
// //       userMembership.role !== MembershipRole.SCHOOL_ADMIN
// //     ) {
// //       throw new BadRequestException('Unauthorized: You do not own this tenant');
// //     }

// //     return tenant;
// //   }

// //   // DEBUG METHOD: Check what curricula exist in the database
// //   async debugCurriculaQuery(levelNames: string[]): Promise<any> {
// //     const normalizedLevelNames = levelNames.map((name) =>
// //       name.toLowerCase().trim().replace(/\s+/g, ' '),
// //     );

// //     console.log(
// //       '🔍 Debug: Searching for curricula with normalized names:',
// //       normalizedLevelNames,
// //     );

// //     // Check all curricula in database
// //     const allCurricula = await this.curriculumRepo.find({
// //       relations: ['schoolType', 'schoolLevels'],
// //       take: 50, // Limit for debugging
// //     });

// //     console.log('📊 Debug: Total curricula in database:', allCurricula.length);
// //     console.log('📋 Debug: Available curricula names:');
// //     allCurricula.forEach((c, index) => {
// //       console.log(`  ${index + 1}. ID: ${c.id}`);
// //       console.log(`     name: "${c.name || 'NULL'}"`);
// //       console.log(`     display_name: "${c.display_name || 'NULL'}"`);
// //       console.log(`     displayName: "${(c as any).displayName || 'NULL'}"`);
// //       console.log(`     schoolType: ${c.schoolType?.name || 'NULL'}`);
// //       console.log(`     schoolLevels count: ${c.schoolLevels?.length || 0}`);
// //       console.log('     ---');
// //     });

// //     // Try exact matches
// //     const exactMatches = allCurricula.filter((c) => {
// //       const cName = (c.name || '').toLowerCase().trim().replace(/\s+/g, ' ');
// //       const cDisplayName = (c.display_name || '')
// //         .toLowerCase()
// //         .trim()
// //         .replace(/\s+/g, ' ');
// //       const cDisplayName2 = ((c as any).displayName || '')
// //         .toLowerCase()
// //         .trim()
// //         .replace(/\s+/g, ' ');

// //       return (
// //         normalizedLevelNames.includes(cName) ||
// //         normalizedLevelNames.includes(cDisplayName) ||
// //         normalizedLevelNames.includes(cDisplayName2)
// //       );
// //     });

// //     console.log('✅ Debug: Exact matches found:', exactMatches.length);
// //     exactMatches.forEach((c) => {
// //       console.log(
// //         `  - ${c.name || c.display_name} (ID: ${c.id}, SchoolLevels: ${c.schoolLevels?.length || 0})`,
// //       );
// //     });

// //     return {
// //       totalCurricula: allCurricula.length,
// //       searchTerms: normalizedLevelNames,
// //       exactMatches: exactMatches.length,
// //       availableNames: allCurricula.map((c) => ({
// //         id: c.id,
// //         name: c.name,
// //         display_name: c.display_name,
// //         displayName: (c as any).displayName,
// //         schoolLevelsCount: c.schoolLevels?.length || 0,
// //       })),
// //     };
// //   }

// //   async configureSchoolLevelsByNames(
// //     levelNames: string[],
// //     subdomain: string,
// //     userId: string,
// //   ): Promise<SchoolConfigurationResponse> {
// //     console.log('Starting configureSchoolLevelsByNames with:', {
// //       levelNames,
// //       subdomain,
// //       userId,
// //     });

// //     const tenant = await this.validateTenantOwnership(subdomain, userId);
// //     await this.assertSchoolNotConfigured(tenant.id);

// //     const normalizedLevelNames = levelNames.map((name) =>
// //       name.toLowerCase().trim().replace(/\s+/g, ' '),
// //     );

// //     console.log('🔄 Normalized level names:', normalizedLevelNames);

// //     return await this.processSchoolConfiguration(normalizedLevelNames, tenant);
// //   }

// //   private async processSchoolConfiguration(
// //     levelNames: string[],
// //     tenant: Tenant,
// //   ): Promise<SchoolConfigurationResponse> {
// //     console.log('🔍 Step 1: Finding matching curricula...');

// //     // CRITICAL FIX: Try different query approaches
// //     let matchingCurricula: Curriculum[] = [];

// //     // Approach 1: Direct field matching using query builder
// //     try {
// //       matchingCurricula = await this.curriculumRepo
// //         .createQueryBuilder('curriculum')
// //         .leftJoinAndSelect('curriculum.schoolType', 'schoolType')
// //         .leftJoinAndSelect('curriculum.schoolLevels', 'schoolLevels')
// //         .where(
// //           levelNames
// //             .map(
// //               (_, index) =>
// //                 `(LOWER(TRIM(curriculum.name)) = :name${index} OR
// //               LOWER(TRIM(curriculum.display_name)) = :name${index} OR
// //               LOWER(TRIM(curriculum.display_name)) = :name${index})`,
// //             )
// //             .join(' OR '),
// //           levelNames.reduce((params, name, index) => {
// //             params[`name${index}`] = name;
// //             return params;
// //           }, {}),
// //         )
// //         .getMany();

// //       console.log(
// //         '📊 Approach 1 - Direct matching found:',
// //         matchingCurricula.length,
// //       );
// //     } catch (error) {
// //       console.error('❌ Approach 1 failed:', error.message);
// //     }

// //     // Approach 2: If no matches, try LIKE matching
// //     if (matchingCurricula.length === 0) {
// //       try {
// //         matchingCurricula = await this.curriculumRepo
// //           .createQueryBuilder('curriculum')
// //           .leftJoinAndSelect('curriculum.schoolType', 'schoolType')
// //           .leftJoinAndSelect('curriculum.schoolLevels', 'schoolLevels')
// //           .where(
// //             levelNames
// //               .map(
// //                 (_, index) =>
// //                   `(LOWER(curriculum.name) LIKE :name${index} OR
// //                 LOWER(curriculum.display_name) LIKE :name${index})`,
// //               )
// //               .join(' OR '),
// //             levelNames.reduce((params, name, index) => {
// //               params[`name${index}`] = `%${name}%`;
// //               return params;
// //             }, {}),
// //           )
// //           .getMany();

// //         console.log(
// //           '📊 Approach 2 - LIKE matching found:',
// //           matchingCurricula.length,
// //         );
// //       } catch (error) {
// //         console.error('❌ Approach 2 failed:', error.message);
// //       }
// //     }

// //     // Approach 3: If still no matches, get all and filter in code
// //     if (matchingCurricula.length === 0) {
// //       console.log('⚠️ No database matches, trying manual filtering...');

// //       const allCurricula = await this.curriculumRepo.find({
// //         relations: ['schoolType', 'schoolLevels'],
// //       });

// //       matchingCurricula = allCurricula.filter((curriculum) => {
// //         const curriculumNames = [
// //           curriculum.name,
// //           curriculum.display_name,
// //           (curriculum as any).display_name,
// //         ]
// //           .filter(Boolean)
// //           .map((name) => name.toLowerCase().trim().replace(/\s+/g, ' '));

// //         return levelNames.some((levelName) =>
// //           curriculumNames.some(
// //             (currName) =>
// //               currName.includes(levelName) || levelName.includes(currName),
// //           ),
// //         );
// //       });

// //       console.log(
// //         '📊 Approach 3 - Manual filtering found:',
// //         matchingCurricula.length,
// //       );
// //     }

// //     // Log detailed information about found curricula
// //     console.log('📋 Found curricula details:');
// //     matchingCurricula.forEach((curriculum, index) => {
// //       console.log(
// //         `  ${index + 1}. ${curriculum.name || curriculum.display_name} (ID: ${curriculum.id})`,
// //       );
// //       console.log(`     School Type: ${curriculum.schoolType?.name || 'NULL'}`);
// //       console.log(
// //         `     School Levels: ${curriculum.schoolLevels?.length || 0}`,
// //       );
// //       if (curriculum.schoolLevels?.length > 0) {
// //         curriculum.schoolLevels.forEach((level, levelIndex) => {
// //           console.log(
// //             `       ${levelIndex + 1}. ${level.name} (ID: ${level.id})`,
// //           );
// //         });
// //       }
// //     });

// //     if (matchingCurricula.length === 0) {
// //       // Get debug info for better error message
// //       const debugInfo = await this.debugCurriculaQuery(levelNames);

// //       throw new BadRequestException(
// //         `No matching curriculum levels found for: ${levelNames.join(', ')}. ` +
// //           `Available curricula count: ${debugInfo.totalCurricula}. ` +
// //           `Check the console logs for available curriculum names.`,
// //       );
// //     }

// //     // 2. Validate single school type
// //     const schoolTypes: string[] = [
// //       ...new Set(
// //         matchingCurricula.map((c: Curriculum) => c.schoolType.id as string),
// //       ),
// //     ] as string[];

// //     if (schoolTypes.length > 1) {
// //       throw new BadRequestException(
// //         'Cannot select levels from different school types. Please select levels from the same school type only.',
// //       );
// //     }

// //     console.log('✅ Step 2: School type validation passed');

// //     // 3. Get or create school config
// //     console.log('🔧 Step 3: Creating/updating school config...');

// //     let schoolConfig = await this.schoolConfigRepo.findOne({
// //       where: { tenant: { id: tenant.id } },
// //     });

// //     if (!schoolConfig) {
// //       schoolConfig = this.schoolConfigRepo.create({
// //         tenant,
// //         createdAt: new Date(),
// //         updatedAt: new Date(),
// //       });
// //       schoolConfig = await this.schoolConfigRepo.save(schoolConfig);
// //       console.log('✅ Created new school config:', schoolConfig.id);
// //     } else {
// //       await this.clearExistingConfiguration(schoolConfig.id);
// //       schoolConfig.updatedAt = new Date();
// //       await this.schoolConfigRepo.save(schoolConfig);
// //       console.log('✅ Updated existing school config:', schoolConfig.id);
// //     }

// //     // 4. Create configuration levels
// //     console.log('🏗️ Step 4: Creating configuration levels...');

// //     const createdLevels = await this.createConfigurationLevels(
// //       matchingCurricula,
// //       schoolConfig,
// //     );

// //     console.log('✅ Created configuration levels:', createdLevels.length);

// //     // 5. Build and return response
// //     console.log('📦 Step 5: Building response...');

// //     const response = await this.buildConfigurationResponse(schoolConfig.id);

// //     console.log('🎉 Final response summary:', {
// //       configId: response.id,
// //       selectedLevelsCount: response.selectedLevels.length,
// //       tenantName: response.tenant.schoolName,
// //       schoolType: response.schoolType?.name,
// //     });

// //     // CRITICAL: Log the actual selectedLevels data
// //     if (response.selectedLevels.length === 0) {
// //       console.error('❌ PROBLEM: selectedLevels is empty!');

// //       // Debug: Check what's actually in the database
// //       const directCheck = await this.schoolConfigLevelRepo.find({
// //         where: { schoolConfig: { id: schoolConfig.id } },
// //         relations: ['level', 'gradeLevels', 'gradeLevels.gradeLevel'],
// //       });

// //       console.log(
// //         '🔍 Direct database check - ConfigLevels found:',
// //         directCheck.length,
// //       );
// //       directCheck.forEach((cl, index) => {
// //         console.log(`  ${index + 1}. ConfigLevel ID: ${cl.id}`);
// //         console.log(`     Level Name: ${cl.level?.name || 'NULL'}`);
// //         console.log(`     Grade Levels: ${cl.gradeLevels?.length || 0}`);
// //       });
// //     }

// //     return response;
// //   }

// //   private async createConfigurationLevels(
// //     curricula: Curriculum[],
// //     schoolConfig: SchoolConfig,
// //   ): Promise<SchoolConfigLevel[]> {
// //     const configLevels: SchoolConfigLevel[] = [];

// //     console.log('🏗️ Creating config levels for', curricula.length, 'curricula');

// //     for (const curriculum of curricula) {
// //       console.log(
// //         `\n📚 Processing curriculum: ${curriculum.name || curriculum.display_name} (ID: ${curriculum.id})`,
// //       );

// //       // Get school levels - try multiple approaches
// //       let schoolLevels = curriculum.schoolLevels || [];

// //       if (schoolLevels.length === 0) {
// //         console.log('  🔍 No preloaded school levels, querying database...');
// //         schoolLevels = await this.schoolLevelRepo.find({
// //           where: { curriculum: { id: curriculum.id } },
// //         });
// //       }

// //       console.log(`  📊 Found ${schoolLevels.length} school levels`);

// //       if (schoolLevels.length === 0) {
// //         console.warn(
// //           `  ⚠️ WARNING: No school levels found for curriculum ${curriculum.id}`,
// //         );
// //         continue;
// //       }

// //       for (const schoolLevel of schoolLevels) {
// //         console.log(
// //           `    🎯 Processing school level: ${schoolLevel.name} (ID: ${schoolLevel.id})`,
// //         );

// //         // Create config level
// //         const configLevel = this.schoolConfigLevelRepo.create({
// //           schoolConfig,
// //           level: schoolLevel,
// //         });

// //         const savedConfigLevel =
// //           await this.schoolConfigLevelRepo.save(configLevel);
// //         console.log(`    ✅ Created config level: ${savedConfigLevel.id}`);

// //         // Get grade levels
// //         const gradeLevels = await this.gradeLevelRepo.find({
// //           where: { curriculum: { id: curriculum.id } },
// //           relations: ['level'],
// //         });

// //         console.log(`    📈 Found ${gradeLevels.length} grade levels`);

// //         // Create grade level configs
// //         if (gradeLevels.length > 0) {
// //           const gradeLevelConfigs = gradeLevels.map((gradeLevel) =>
// //             this.schoolConfigGradeLevelRepo.create({
// //               configLevel: savedConfigLevel,
// //               gradeLevel,
// //             }),
// //           );

// //           await this.schoolConfigGradeLevelRepo.save(gradeLevelConfigs);
// //           console.log(
// //             `    ✅ Created ${gradeLevelConfigs.length} grade level configs`,
// //           );
// //         }

// //         // Get and create subjects
// //         const curriculumSubjects = await this.curriculumSubjectsRepo.find({
// //           where: { curriculum: { id: curriculum.id } },
// //           relations: ['subject'],
// //         });

// //         console.log(`    📚 Found ${curriculumSubjects.length} subjects`);

// //         if (curriculumSubjects.length > 0) {
// //           const subjectConfigs = curriculumSubjects.map((curriculumSubject) =>
// //             this.schoolConfigSubjectRepo.create({
// //               configLevel: savedConfigLevel,
// //               subject: curriculumSubject.subject,
// //               subjectType: SubjectType.CORE || 'core',
// //             }),
// //           );

// //           await this.schoolConfigSubjectRepo.save(subjectConfigs);
// //           console.log(
// //             `    ✅ Created ${subjectConfigs.length} subject configs`,
// //           );
// //         }

// //         configLevels.push(savedConfigLevel);
// //       }
// //     }

// //     console.log(`\n🎉 Total config levels created: ${configLevels.length}`);
// //     return configLevels;
// //   }

// //   private async buildConfigurationResponse(
// //     schoolConfigId: string,
// //   ): Promise<SchoolConfigurationResponse> {
// //     console.log('📦 Building configuration response for:', schoolConfigId);

// //     const result = await this.schoolConfigRepo.findOne({
// //       where: { id: schoolConfigId },
// //       relations: [
// //         'tenant',
// //         'configLevels',
// //         'configLevels.level',
// //         'configLevels.level.curriculum',
// //         'configLevels.level.curriculum.schoolType',
// //         'configLevels.gradeLevels',
// //         'configLevels.gradeLevels.gradeLevel',
// //         'configLevels.gradeLevels.gradeLevel.level',
// //         'configLevels.subjects',
// //         'configLevels.subjects.subject',
// //       ],
// //     });

// //     if (!result) {
// //       throw new Error(
// //         `School configuration not found for ID: ${schoolConfigId}`,
// //       );
// //     }

// //     console.log('📊 Raw result from database:', {
// //       id: result.id,
// //       configLevelsCount: result.configLevels?.length || 0,
// //       tenantId: result.tenant?.id,
// //       tenantName: result.tenant?.name,
// //     });

// //     // Log each config level in detail
// //     result.configLevels?.forEach((configLevel, index) => {
// //       console.log(`  ConfigLevel ${index + 1}:`);
// //       console.log(`    ID: ${configLevel.id}`);
// //       console.log(`    Level Name: ${configLevel.level?.name || 'NULL'}`);
// //       console.log(`    Level ID: ${configLevel.level?.id || 'NULL'}`);
// //       console.log(`    Grade Levels: ${configLevel.gradeLevels?.length || 0}`);
// //       console.log(`    Subjects: ${configLevel.subjects?.length || 0}`);
// //     });

// //     const firstLevel = result.configLevels?.[0];
// //     const schoolType = firstLevel?.level?.curriculum?.schoolType;

// //     const response: SchoolConfigurationResponse = {
// //       id: result.id,
// //       createdAt: result.createdAt,
// //       updatedAt: result.updatedAt,
// //       tenant: {
// //         id: result.tenant.id,
// //         schoolName: result.tenant.name,
// //         subdomain: result.tenant.subdomain,
// //       },
// //       schoolType: schoolType
// //         ? {
// //             id: schoolType.id,
// //             name: schoolType.name,
// //             displayName: schoolType.name,
// //           }
// //         : undefined,
// //       selectedLevels: (result.configLevels || []).map((configLevel) => {
// //         console.log(`    🔧 Mapping configLevel ${configLevel.id} to response`);

// //         return {
// //           id: configLevel.id,
// //           name: configLevel.level?.name || '',
// //           curriculum: {
// //             id: configLevel.level?.id || '',
// //             name: configLevel.level?.name || '',
// //           },
// //           gradeLevels: (configLevel.gradeLevels || []).map((gl) => ({
// //             id: gl.id,
// //             name: gl.gradeLevel?.name || '',
// //             level: {
// //               id: gl.gradeLevel?.level?.id || '',
// //               name: gl.gradeLevel?.level?.name || '',
// //             },
// //           })),
// //           curriculumSubjects: (configLevel.subjects || []).map((cs) => ({
// //             id: cs.id,
// //             subject: {
// //               id: cs.subject?.id || '',
// //               name: cs.subject?.name || '',
// //             },
// //           })),
// //         };
// //       }),
// //     };

// //     console.log(
// //       '🎯 Final response selectedLevels count:',
// //       response.selectedLevels.length,
// //     );

// //     return response;
// //   }
// // }
// // @Injectable()
// // export class SchoolTypeService {
// //   constructor(
// //     @InjectRepository(School)
// //     private readonly schoolRepo: Repository<School>,
// //     @InjectRepository(Curriculum)
// //     private readonly curriculumRepo: Repository<Curriculum>,
// //     @InjectRepository(SchoolConfig)
// //     private readonly schoolConfigRepo: Repository<SchoolConfig>,
// //     @InjectRepository(SchoolConfigLevel)
// //     private readonly schoolConfigLevelRepo: Repository<SchoolConfigLevel>,
// //     @InjectRepository(SchoolConfigGradeLevel)
// //     private readonly schoolConfigGradeLevelRepo: Repository<SchoolConfigGradeLevel>,
// //     @InjectRepository(SchoolConfigSubject)
// //     private readonly schoolConfigSubjectRepo: Repository<SchoolConfigSubject>,
// //     @InjectRepository(Tenant)
// //     private readonly tenantRepo: Repository<Tenant>,
// //     @InjectRedis() private readonly redis: Redis,
// //     private readonly dataSource: DataSource,
// //   ) {}

// //   async configureSchoolLevelsByNames(
// //     levelNames: string[],
// //     subdomain: string,
// //     userId: string,
// //   ): Promise<SchoolConfigurationResponse> {
// //     // Check cache first
// //     const cacheKey = `school_config:${subdomain}`;
// //     const cached = await this.redis.get(cacheKey);

// //     // If we have cached config and levelNames match, return it
// //     if (cached) {
// //       const cachedConfig = JSON.parse(cached);
// //       const cachedLevelNames: string[] = (cachedConfig.selectedLevels as { name: string }[]).map((l: { name: string }) =>
// //         l.name.toLowerCase(),
// //       );
// //       const requestedLevelNames = levelNames.map((name) =>
// //         name.toLowerCase().trim(),
// //       );

// //       if (
// //         this.arraysEqual(cachedLevelNames.sort(), requestedLevelNames.sort())
// //       ) {
// //         return cachedConfig;
// //       }
// //     }

// //     const tenant = await this.validateTenantOwnership(subdomain, userId);
// //     await this.assertSchoolNotConfigured(tenant.id);

// //     const normalizedLevelNames = levelNames.map((name) =>
// //       name.toLowerCase().trim().replace(/\s+/g, ' '),
// //     );
// //     // Use transaction for data consistency
// //     return await this.dataSource.transaction(async (manager) => {
// //       const result = await this.processSchoolConfiguration(
// //         normalizedLevelNames,
// //         tenant,
// //         manager,
// //       );

// //       // Cache the result
// //       await this.cacheSchoolConfiguration(subdomain, result);

// //       return result;
// //     });
// //   }

// //   private async processSchoolConfiguration(
// //     levelNames: string[],
// //     tenant: Tenant,
// //     manager: any,
// //   ): Promise<SchoolConfigurationResponse> {
// //     // 1. Find matching curricula with minimal relations
// //     const matchingCurricula = await manager
// //       .createQueryBuilder(Curriculum, 'curriculum')
// //       .leftJoinAndSelect('curriculum.schoolType', 'schoolType')
// //       .where(
// //         "LOWER(REPLACE(curriculum.display_name, ' ', ' ')) IN (:...levelNames)",
// //         { levelNames },
// //       )
// //       .getMany();

// //     if (matchingCurricula.length === 0) {
// //       throw new BadRequestException('No matching curriculum levels found');
// //     }

// //     // 2. Validate single school type
// //     const schoolTypes: string[] = [
// //       ...new Set(matchingCurricula.map((c: Curriculum) => c.schoolType.id as string)),
// //     ] as string[];
// //     if (schoolTypes.length > 1) {
// //       throw new BadRequestException(
// //         'Cannot select levels from different school types. Please select levels from the same school type only.',
// //       );
// //     }

// //     // 3. Get or create school config
// //     let schoolConfig = await manager.findOne(SchoolConfig, {
// //       where: { tenant: { id: tenant.id } },
// //     });

// //     if (!schoolConfig) {
// //       schoolConfig = manager.create(SchoolConfig, {
// //         tenant,
// //         createdAt: new Date(),
// //         updatedAt: new Date(),
// //       });
// //       schoolConfig = await manager.save(SchoolConfig, schoolConfig);
// //     } else {
// //       // Clear existing configuration
// //       await this.clearExistingConfiguration(schoolConfig.id, manager);
// //       schoolConfig.updatedAt = new Date();
// //       await manager.save(SchoolConfig, schoolConfig);
// //     }

// //     // 4. Create new configuration
// //     await this.createConfigurationLevels(
// //       matchingCurricula,
// //       schoolConfig,
// //       manager,
// //     );

// //     // 5. Build response
// //     return await this.buildConfigurationResponse(schoolConfig.id, manager);
// //   }

// //   private async createConfigurationLevels(
// //     curricula: Curriculum[],
// //     schoolConfig: SchoolConfig,
// //     manager: any,
// //   ): Promise<SchoolConfigLevel[]> {
// //     const configLevels: SchoolConfigLevel[] = [];

// //     for (const curriculum of curricula) {
// //       // Load schoolLevels if not already loaded
// //       const schoolLevels =
// //         curriculum.schoolLevels?.length > 0
// //           ? curriculum.schoolLevels
// //           : await manager.find(SchoolLevel, {
// //               where: { curriculum: { id: curriculum.id } },
// //             });

// //       for (const schoolLevel of schoolLevels) {
// //         const configLevel = manager.create(SchoolConfigLevel, {
// //           schoolConfig,
// //           level: schoolLevel,
// //         });

// //         const savedConfigLevel = await manager.save(
// //           SchoolConfigLevel,
// //           configLevel,
// //         );

// //         // Get and create grade levels for this curriculum
// //         const gradeLevels = await manager.find(GradeLevel, {
// //           where: { curriculum: { id: curriculum.id } },
// //           relations: ['level'],
// //         });

// //         for (const gradeLevel of gradeLevels) {
// //           const configGradeLevel = manager.create(SchoolConfigGradeLevel, {
// //             configLevel: savedConfigLevel,
// //             gradeLevel,
// //           });
// //           await manager.save(SchoolConfigGradeLevel, configGradeLevel);
// //         }

// //         // Get and create subjects for this curriculum
// //         const curriculumSubjects = await manager.find(CurriculumSubject, {
// //           where: { curriculum: { id: curriculum.id } },
// //           relations: ['subject'],
// //         });

// //         for (const curriculumSubject of curriculumSubjects) {
// //           const configSubject = manager.create(SchoolConfigSubject, {
// //             configLevel: savedConfigLevel,
// //             subject: curriculumSubject.subject,
// //             subjectType: curriculumSubject.type || 'core',
// //           });
// //           await manager.save(SchoolConfigSubject, configSubject);
// //         }

// //         configLevels.push(savedConfigLevel);
// //       }
// //     }

// //     return configLevels;
// //   }

// //   private async clearExistingConfiguration(
// //     schoolConfigId: string,
// //     manager: any, // EntityManager from transaction
// //   ): Promise<void> {
// //     // Step 1: Find all SchoolConfigLevel IDs associated with this schoolConfig
// //     const configLevels = await manager.findBy(SchoolConfigLevel, {
// //       schoolConfig: { id: schoolConfigId },
// //     });

// //     const configLevelIds = configLevels.map((cl) => cl.id);

// //     if (configLevelIds.length === 0) {
// //       return; // Nothing to delete
// //     }

// //     await manager
// //       .createQueryBuilder()
// //       .delete()
// //       .from(SchoolConfigGradeLevel)
// //       .where('configLevelId IN (:...ids)', { ids: configLevelIds })
// //       .execute();

// //     // Delete SchoolConfigSubject entries
// //     await manager
// //       .createQueryBuilder()
// //       .delete()
// //       .from(SchoolConfigSubject)
// //       .where('configLevelId IN (:...ids)', { ids: configLevelIds })
// //       .execute();

// //     // Step 3: Delete SchoolConfigLevel entries
// //     await manager
// //       .createQueryBuilder()
// //       .delete()
// //       .from(SchoolConfigLevel)
// //       .where('schoolConfig.id = :configId', { configId: schoolConfigId })
// //       .execute();
// //   }

// //   private async buildConfigurationResponse(
// //     schoolConfigId: string,
// //     manager: any,
// //   ): Promise<SchoolConfigurationResponse> {
// //     const result = await manager.findOne(SchoolConfig, {
// //       where: { id: schoolConfigId },
// //       relations: [
// //         'tenant',
// //         'configLevels',
// //         'configLevels.level',
// //         'configLevels.level.curriculum',
// //         'configLevels.gradeLevels',
// //         'configLevels.gradeLevels.gradeLevel',
// //         'configLevels.gradeLevels.gradeLevel.level',
// //         'configLevels.subjects',
// //         'configLevels.subjects.subject',
// //       ],
// //     });

// //     if (!result) {
// //       throw new Error('School configuration not found');
// //     }

// //     // Get school type from first level
// //     const firstLevel = result.configLevels?.[0];
// //     let schoolType: { id: string; name: string } | null = null;

// //     if (firstLevel) {
// //       const curriculum = await manager.findOne(Curriculum, {
// //         where: { id: firstLevel.level.curriculum.id },
// //         relations: ['schoolType'],
// //       });
// //       schoolType = curriculum?.schoolType;
// //     }

// //     return {
// //       id: result.id,
// //       createdAt: result.createdAt,
// //       updatedAt: result.updatedAt,
// //       tenant: {
// //         id: result.tenant.id,
// //         schoolName: result.tenant.name,
// //         subdomain: result.tenant.subdomain,
// //       },
// //       schoolType: schoolType
// //         ? {
// //             id: schoolType.id,
// //             name: schoolType.name,
// //             displayName: schoolType.name,
// //           }
// //         : undefined,
// //       selectedLevels: result.configLevels.map((configLevel) => ({
// //         id: configLevel.id,
// //         name: configLevel.level.name,
// //         curriculum: {
// //           id: configLevel.level.id,
// //           name: configLevel.level.name,
// //         },
// //         gradeLevels:
// //           configLevel.gradeLevels?.map((gl) => ({
// //             id: gl.id,
// //             name: gl.gradeLevel.name,
// //             level: {
// //               id: gl.gradeLevel.level.id,
// //               name: gl.gradeLevel.level.name,
// //             },
// //           })) ?? [],

// //         curriculumSubjects:
// //           configLevel.subjects?.map((cs) => ({
// //             id: cs.id,
// //             subject: {
// //               id: cs.subject.id,
// //               name: cs.subject.name,
// //             },
// //           })) ?? [],
// //       })),
// //     };
// //   }

// //   // Redis caching methods
// //   private async cacheSchoolConfiguration(
// //     subdomain: string,
// //     config: SchoolConfigurationResponse,
// //   ): Promise<void> {
// //     const cacheKey = `school_config:${subdomain}`;
// //     const ttl = 3600;

// //     await this.redis.setex(cacheKey, ttl, JSON.stringify(config));

// //     // Also cache by tenant ID for faster lookups
// //     const tenantCacheKey = `school_config:tenant:${config.tenant.id}`;
// //     await this.redis.setex(tenantCacheKey, ttl, JSON.stringify(config));
// //   }

// //   async getSchoolConfiguration(
// //     schoolConfigId: string,
// //     manager: any,
// //   ): Promise<SchoolConfigurationResponse> {
// //     const result = await manager.findOne(SchoolConfig, {
// //       where: { id: schoolConfigId },
// //       relations: [
// //         'tenant',
// //         'configLevels',
// //         'configLevels.level',
// //         'configLevels.level.curriculum',
// //         'configLevels.gradeLevels',
// //         'configLevels.gradeLevels.gradeLevel',
// //         'configLevels.gradeLevels.gradeLevel.level',
// //         'configLevels.subjects',
// //         'configLevels.subjects.subject',
// //       ],
// //     });

// //     if (!result) {
// //       throw new Error('School configuration not found');
// //     }

// //     const firstLevel = result.configLevels?.[0];
// //     let schoolType: { id: string; name: string } | null = null;

// //     if (firstLevel) {
// //       const curriculum = await manager.findOne(Curriculum, {
// //         where: { id: firstLevel.level.curriculum.id },
// //         relations: ['schoolType'],
// //       });
// //       schoolType = curriculum?.schoolType;
// //     }

// //     return {
// //       id: result.id,
// //       createdAt: result.createdAt,
// //       updatedAt: result.updatedAt,
// //       tenant: {
// //         id: result.tenant.id,
// //         schoolName: result.tenant.name,
// //         subdomain: result.tenant.subdomain,
// //       },
// //       schoolType: schoolType
// //         ? {
// //             id: schoolType.id,
// //             name: schoolType.name,
// //             displayName: schoolType.name,
// //           }
// //         : undefined,
// //       selectedLevels: result.configLevels.map((configLevel) => ({
// //         id: configLevel.id,
// //         name: configLevel.level.name,
// //         description: configLevel.level.description || null,
// //         curriculum: {
// //           id: configLevel.level.id,
// //           name: configLevel.level.name,
// //         },
// //         gradeLevels:
// //           configLevel.gradeLevels?.map((gl) => ({
// //             id: gl.id,
// //             name: gl.gradeLevel.name,
// //             streams: null, // Add stream relation if needed
// //             age: gl.gradeLevel.age || null,
// //             level: {
// //               id: gl.gradeLevel.level.id,
// //               name: gl.gradeLevel.level.name,
// //             },
// //           })) ?? [],
// //         subjects:
// //           configLevel.subjects?.map((cs) => ({
// //             id: cs.subject.id,
// //             name: cs.subject.name,
// //             code: cs.subject.code || null,
// //             subjectType: cs.subjectType || 'core',
// //             category: cs.subject.category || null,
// //             department: cs.subject.department || null,
// //             shortName: cs.subject.shortName || null,
// //             isCompulsory: cs.subject.isCompulsory || false,
// //             totalMarks: cs.subject.totalMarks || null,
// //             passingMarks: cs.subject.passingMarks || null,
// //             creditHours: cs.subject.creditHours || null,
// //             curriculum: cs.subject.curriculum || null,
// //           })) ?? [],
// //         curriculumSubjects:
// //           configLevel.subjects?.map((cs) => ({
// //             id: cs.id,
// //             subject: {
// //               id: cs.subject.id,
// //               name: cs.subject.name,
// //             },
// //           })) ?? [],
// //       })),
// //     };
// //   }

// //   async invalidateSchoolConfigCache(
// //     subdomain: string,
// //     tenantId?: string,
// //   ): Promise<void> {
// //     const keys = [`school_config:${subdomain}`];

// //     if (tenantId) {
// //       keys.push(`school_config:tenant:${tenantId}`);
// //     }

// //     await this.redis.del(...keys);
// //   }

// //   // Additional service methods
// //   async getAvailableCurricula(schoolTypeId?: string) {
// //     const cacheKey = schoolTypeId
// //       ? `available_curricula:${schoolTypeId}`
// //       : 'available_curricula:all';

// //     const cached = await this.redis.get(cacheKey);
// //     if (cached) {
// //       return JSON.parse(cached);
// //     }

// //     const queryBuilder = this.curriculumRepo
// //       .createQueryBuilder('curriculum')
// //       .leftJoinAndSelect('curriculum.schoolType', 'schoolType')
// //       .leftJoin('curriculum.gradeLevels', 'gradeLevels')
// //       .leftJoin('curriculum.curriculumSubjects', 'curriculumSubjects')
// //       .addSelect('COUNT(DISTINCT gradeLevels.id)', 'gradeCount')
// //       .addSelect('COUNT(DISTINCT curriculumSubjects.id)', 'subjectCount')
// //       .groupBy('curriculum.id')
// //       .addGroupBy('schoolType.id');

// //     if (schoolTypeId) {
// //       queryBuilder.where('curriculum.schoolTypeId = :schoolTypeId', {
// //         schoolTypeId,
// //       });
// //     }

// //     const curricula = await queryBuilder.getRawAndEntities();

// //     const result = curricula.entities.map((curriculum, index) => {
// //       const raw = curricula.raw[index];
// //       return {
// //         id: curriculum.id,
// //         name: curriculum.name,
// //         code: curriculum.code,
// //         displayName: curriculum.display_name,
// //         schoolType: curriculum.schoolType,
// //         gradeCount: parseInt(raw.gradeCount) || 0,
// //         subjectCount: parseInt(raw.subjectCount) || 0,
// //       };
// //     });

// //     // Cache for 30 minutes
// //     await this.redis.setex(cacheKey, 1800, JSON.stringify(result));

// //     return result;
// //   }

// //   async resetSchoolConfiguration(
// //     subdomain: string,
// //     userId: string,
// //   ): Promise<boolean> {
// //     const tenant = await this.validateTenantOwnership(subdomain, userId);

// //     return await this.dataSource.transaction(async (manager) => {
// //       const schoolConfig = await manager.findOne(SchoolConfig, {
// //         where: { tenant: { id: tenant.id } },
// //       });

// //       if (schoolConfig) {
// //         await this.clearExistingConfiguration(schoolConfig.id, manager);
// //         await manager.remove(SchoolConfig, schoolConfig);
// //       }

// //       // Invalidate cache
// //       await this.invalidateSchoolConfigCache(subdomain, tenant.id);

// //       return true;
// //     });
// //   }

// //   // Utility methods
// //   private arraysEqual(a: string[], b: string[]): boolean {
// //     return a.length === b.length && a.every((val, index) => val === b[index]);
// //   }

// //   private async validateTenantOwnership(
// //     subdomain: string,
// //     userId: string,
// //   ): Promise<Tenant> {
// //     const tenant = await this.tenantRepo.findOne({
// //       where: { subdomain },
// //       relations: ['memberships', 'memberships.user'],
// //     });

// //     if (!tenant) {
// //       throw new BadRequestException('Tenant not found');
// //     }

// //     const userMembership = tenant.memberships?.find(
// //       (membership) => membership.user.id === userId,
// //     );

// //     if (
// //       !userMembership ||
// //       userMembership.role !== MembershipRole.SCHOOL_ADMIN
// //     ) {
// //       throw new BadRequestException('Unauthorized: You do not own this tenant');
// //     }

// //     return tenant;
// //   }

// //   private async assertSchoolNotConfigured(tenantId: string): Promise<void> {
// //     const existingConfig = await this.schoolConfigRepo.findOne({
// //       where: { tenant: { id: tenantId } },
// //     });

// //     if (existingConfig) {
// //       // Allow reconfiguration, just log it
// //       console.log(`Reconfiguring school for tenant ${tenantId}`);
// //     }
// //   }
// // }

// // // Updated GraphQL Response Type
// // interface SchoolConfigurationResponse {
// //   id: string;
// //   createdAt: Date;
// //   updatedAt: Date;
// //   tenant: {
// //     id: string;
// //     schoolName: string;
// //     subdomain: string;
// //   };
// //   schoolType: {
// //     id: string;
// //     name: string;
// //   } | null;
// //   selectedLevels: {
// //     id: string;
// //     name: string;
// //     curriculum: {
// //       id: string;
// //       name: string;
// //     };
// //     gradeLevels: {
// //       id: string;
// //       name: string;
// //       level: {
// //         id: string;
// //         name: string;
// //       };
// //     }[];
// //     curriculumSubjects: {
// //       id: string;
// //       subject: {
// //         id: string;
// //         name: string;
// //       };
// //     }[];
// //   }[];
// // }

// // @Injectable()
// // export class SchoolTypeService {
// //   constructor(
// //     @InjectRepository(School)
// //     private readonly schoolRepo: Repository<School>,
// //     @InjectRepository(Curriculum)
// //     private readonly curriculumRepo: Repository<Curriculum>,
// //     @InjectRepository(SchoolConfig)
// //     private readonly schoolConfigRepo: Repository<SchoolConfig>,
// //     @InjectRepository(SchoolConfigLevel)
// //     private readonly schoolConfigLevelRepo: Repository<SchoolConfigLevel>,
// //     @InjectRepository(SchoolConfigGradeLevel)
// //     private readonly schoolConfigGradeLevelRepo: Repository<SchoolConfigGradeLevel>,
// //     @InjectRepository(SchoolConfigSubject)
// //     private readonly schoolConfigSubjectRepo: Repository<SchoolConfigSubject>,
// //     @InjectRepository(Tenant)
// //     private readonly tenantRepo: Repository<Tenant>,
// //     @InjectRedis() private readonly redis: Redis,
// //     private readonly dataSource: DataSource,
// //   ) {}

// //   async configureSchoolLevelsByNames(
// //     levelNames: string[],
// //     subdomain: string,
// //     userId: string,
// //   ): Promise<SchoolConfigurationResponse> {
// //     // Check cache first
// //     const cacheKey = `school_config:${subdomain}`;
// //     const cached = await this.redis.get(cacheKey);

// //     // If we have cached config and levelNames match, return it
// //     if (cached) {
// //       const cachedConfig = JSON.parse(cached);
// //       const cachedLevelNames = cachedConfig.selectedLevels.map((l) =>
// //         l.name.toLowerCase(),
// //       );
// //       const requestedLevelNames = levelNames.map((name) =>
// //         name.toLowerCase().trim(),
// //       );

// //       if (
// //         this.arraysEqual(cachedLevelNames.sort(), requestedLevelNames.sort())
// //       ) {
// //         return cachedConfig;
// //       }
// //     }

// //     const tenant = await this.validateTenantOwnership(subdomain, userId);
// //     await this.assertSchoolNotConfigured(tenant.id);

// //     const normalizedLevelNames = levelNames.map((name) =>
// //       name.toLowerCase().trim().replace(/\s+/g, ' '),
// //     );

// //     // Use transaction for data consistency
// //     return await this.dataSource.transaction(async (manager) => {
// //       const result = await this.processSchoolConfiguration(
// //         normalizedLevelNames,
// //         tenant,
// //         manager,
// //       );

// //       // Cache the result
// //       await this.cacheSchoolConfiguration(subdomain, result);

// //       return result;
// //     });
// //   }

// //   private async processSchoolConfiguration(
// //     levelNames: string[],
// //     tenant: Tenant,
// //     manager: any,
// //   ): Promise<SchoolConfigurationResponse> {
// //     // 1. Find matching curricula with minimal relations
// //     const matchingCurricula = await manager
// //       .createQueryBuilder(Curriculum, 'curriculum')
// //       .leftJoinAndSelect('curriculum.schoolType', 'schoolType')
// //       .where(
// //         "LOWER(REPLACE(curriculum.display_name, ' ', ' ')) IN (:...levelNames)",
// //         { levelNames },
// //       )
// //       .getMany();

// //     if (matchingCurricula.length === 0) {
// //       throw new BadRequestException('No matching curriculum levels found');
// //     }

// //     // 2. Validate single school type
// //     const schoolTypes = [
// //       ...new Set(matchingCurricula.map((c) => c.schoolType.id)),
// //     ];
// //     if (schoolTypes.length > 1) {
// //       throw new BadRequestException(
// //         'Cannot select levels from different school types. Please select levels from the same school type only.',
// //       );
// //     }

// //     // 3. Get or create school config
// //     let schoolConfig = await manager.findOne(SchoolConfig, {
// //       where: { tenant: { id: tenant.id } },
// //     });

// //     if (!schoolConfig) {
// //       schoolConfig = manager.create(SchoolConfig, {
// //         tenant,
// //         createdAt: new Date(),
// //         updatedAt: new Date(),
// //       });
// //       schoolConfig = await manager.save(SchoolConfig, schoolConfig);
// //     } else {
// //       // Clear existing configuration
// //       await this.clearExistingConfiguration(schoolConfig.id, manager);
// //       schoolConfig.updatedAt = new Date();
// //       await manager.save(SchoolConfig, schoolConfig);
// //     }

// //     // 4. Create new configuration
// //     const configLevels = await this.createConfigurationLevels(
// //       matchingCurricula,
// //       schoolConfig,
// //       manager,
// //     );

// //     // 5. Build response
// //     return await this.buildConfigurationResponse(schoolConfig.id, manager);
// //   }

// //   private async createConfigurationLevels(
// //     curricula: Curriculum[],
// //     schoolConfig: SchoolConfig,
// //     manager: any,
// //   ): Promise<SchoolConfigLevel[]> {
// //     const configLevels: SchoolConfigLevel[] = [];

// //     for (const curriculum of curricula) {
// //       // Create config level
// //       const configLevel = manager.create(SchoolConfigLevel, {
// //         schoolConfig,
// //         level: { id: curriculum.id }, // Assuming curriculum maps to level
// //       });
// //       const savedConfigLevel = await manager.save(
// //         SchoolConfigLevel,
// //         configLevel,
// //       );

// //       // Get and create grade levels for this curriculum
// //       const gradeLevels = await manager.find('GradeLevel', {
// //         where: { curriculum_id: curriculum.id },
// //         relations: ['level'],
// //       });

// //       for (const gradeLevel of gradeLevels) {
// //         const configGradeLevel = manager.create(SchoolConfigGradeLevel, {
// //           configLevel: savedConfigLevel,
// //           gradeLevel,
// //         });
// //         await manager.save(SchoolConfigGradeLevel, configGradeLevel);
// //       }

// //       // Get and create subjects for this curriculum
// //       const curriculumSubjects = await manager.find('CurriculumSubject', {
// //         where: { curriculum_id: curriculum.id },
// //         relations: ['subject'],
// //       });

// //       for (const curriculumSubject of curriculumSubjects) {
// //         const configSubject = manager.create(SchoolConfigSubject, {
// //           configLevel: savedConfigLevel,
// //           subject: curriculumSubject.subject,
// //           subjectType: curriculumSubject.type || 'core',
// //         });
// //         await manager.save(SchoolConfigSubject, configSubject);
// //       }

// //       configLevels.push(savedConfigLevel);
// //     }

// //     return configLevels;
// //   }


// //   private async clearExistingConfiguration(
// //   schoolConfigId: string,
// //   manager: any,
// // ): Promise<void> {
// //   await manager
// //     .createQueryBuilder()
// //     .delete()
// //     .from('SchoolConfigGradeLevel')
// //     .where(
// //       'configLevelId IN (SELECT id FROM school_config_level WHERE "schoolConfigId" = :configId)',
// //       { configId: schoolConfigId },
// //     )
// //     .execute();

// //   await manager
// //     .createQueryBuilder()
// //     .delete()
// //     .from('SchoolConfigSubject')
// //     .where(
// //       'configLevelId IN (SELECT id FROM school_config_level WHERE "schoolConfigId" = :configId)',
// //       { configId: schoolConfigId },
// //     )
// //     .execute();

// //   await manager
// //     .createQueryBuilder()
// //     .delete()
// //     .from('SchoolConfigLevel')
// //     .where('"schoolConfigId" = :configId', { configId: schoolConfigId })
// //     .execute();


// // }

// //   private async buildConfigurationResponse(
// //     schoolConfigId: string,
// //     manager: any,
// //   ): Promise<SchoolConfigurationResponse> {
// //     const result = await manager.findOne(SchoolConfig, {
// //       where: { id: schoolConfigId },
// //       relations: [
// //         'tenant',
// //         'configLevels',
// //         'configLevels.level',
// //         'configLevels.gradeLevels',
// //         'configLevels.gradeLevels.gradeLevel',
// //         'configLevels.subjects',
// //         'configLevels.subjects.subject',
// //       ],
// //     });

// //     if (!result) {
// //       throw new Error('School configuration not found');
// //     }

// //     // Get school type from first level
// //     const firstLevel = result.configLevels?.[0];
// //     let schoolType: { id: string; name: string } | null = null;

// //     if (firstLevel) {
// //       const curriculum = await manager.findOne('Curriculum', {
// //         where: { id: firstLevel.level.id },
// //         relations: ['schoolType'],
// //       });
// //       schoolType = curriculum?.schoolType;
// //     }

// //     return {
// //       id: result.id,
// //       createdAt: result.createdAt,
// //       updatedAt: result.updatedAt,
// //       tenant: {
// //         id: result.tenant.id,
// //         schoolName: result.tenant.name,
// //         subdomain: result.tenant.subdomain,
// //       },
// //       schoolType: schoolType
// //         ? {
// //             id: schoolType?.id || '',
// //             name: schoolType.name,
// //             displayName: schoolType.name, // Assuming displayName is the same as name
// //           }
// //         : undefined,
// //       selectedLevels: result.configLevels.map((configLevel) => ({
// //         id: configLevel.id,
// //         name: configLevel.level.name,
// //         curriculum: {
// //           id: configLevel.level.id,
// //           name: configLevel.level.name,
// //         },
// //         gradeLevels:
// //           configLevel.gradeLevels?.map((gl) => ({
// //             id: gl.id,
// //             name: gl.gradeLevel.name,
// //             level: {
// //               id: gl.gradeLevel.level.id,
// //               name: gl.gradeLevel.level.name,
// //             },
// //           })) ?? [],
// //         curriculumSubjects:
// //           configLevel.subjects?.map((cs) => ({
// //             id: cs.id,
// //             subject: {
// //               id: cs.subject.id,
// //               name: cs.subject.name,
// //             },
// //           })) ?? [],
// //       })),
// //     };
// //   }

// //   // Redis caching methods
// //   private async cacheSchoolConfiguration(
// //     subdomain: string,
// //     config: SchoolConfigurationResponse,
// //   ): Promise<void> {
// //     const cacheKey = `school_config:${subdomain}`;
// //     const ttl = 3600; // 1 hour

// //     await this.redis.setex(cacheKey, ttl, JSON.stringify(config));

// //     // Also cache by tenant ID for faster lookups
// //     const tenantCacheKey = `school_config:tenant:${config.tenant.id}`;
// //     await this.redis.setex(tenantCacheKey, ttl, JSON.stringify(config));
// //   }

//   //   async getSchoolConfiguration(subdomain: string): Promise<SchoolConfigurationResponse | null> {
//   //     const cacheKey = `school_config:${subdomain}`;
//   //     const cached = await this.redis.get(cacheKey);

//   //     if (cached) {
//   //       return JSON.parse(cached);
//   //     }

//   //     // Fetch from database if not cached
//   //     const tenant = await this.tenantRepo.findOne({ where: { subdomain } });
//   //     if (!tenant) return null;

//   //     const config = await this.schoolConfigRepo.findOne({
//   //       where: { tenant: { id: tenant.id } },
//   //       relations: [
//   //         'tenant',
//   //         'configLevels',
//   //         'configLevels.level',
//   //         'configLevels.gradeLevels',
//   //         'configLevels.gradeLevels.gradeLevel',
//   //         'configLevels.subjects',
//   //         'configLevels.subjects.subject'
//   //       ]
//   //     });

//   //     if (config) {
//   //       const response = await this.buildConfigurationResponse(config.id, this.dataSource.manager);
//   //       await this.cacheSchoolConfiguration(subdomain, response);
//   //       return response;
//   //     }

//   //     return null;
//   //   }

//   //   async invalidateSchoolConfigCache(subdomain: string, tenantId?: string): Promise<void> {
//   //     const keys = [`school_config:${subdomain}`];

//   //     if (tenantId) {
//   //       keys.push(`school_config:tenant:${tenantId}`);
//   //     }

//   //     await this.redis.del(...keys);
//   //   }

//   //   // Utility methods
// //   private arraysEqual(a: string[], b: string[]): boolean {
// //     return a.length === b.length && a.every((val, index) => val === b[index]);
// //   }

// //   private async validateTenantOwnership(
// //     subdomain: string,
// //     userId: string,
// //   ): Promise<Tenant> {
// //     const tenant = await this.tenantRepo.findOne({
// //       where: { subdomain },
// //       relations: ['memberships', 'memberships.user'],
// //     });

// //     if (!tenant) {
// //       throw new BadRequestException('Tenant not found');
// //     }

// //     const userMembership = tenant.memberships?.find(
// //       (membership) => membership.user.id === userId,
// //     );

// //     if (!userMembership) {
// //       throw new BadRequestException(
// //         'Unauthorized: You do not belong to this tenant',
// //       );
// //     }

// //     return tenant;
// //   }

// //   private async assertSchoolNotConfigured(tenantId: string): Promise<void> {
// //     const existingConfig = await this.schoolConfigRepo.findOne({
// //       where: { tenant: { id: tenantId } },
// //     });
// //     console.log(existingConfig, 'this is the existing config');

// //     if (existingConfig) {
// //       // Allow reconfiguration, just log it
// //       console.log(`Reconfiguring school for tenant ${tenantId}`);
// //     }
// //   }
// // }



//   // Updated GraphQL Response Type


//   // interface SchoolConfigurationResponse {
//   //   id: string;
//   //   createdAt: Date;
//   //   updatedAt: Date;
//   //   tenant: {
//   //     id: string;
//   //     schoolName: string;
//   //     subdomain: string;
//   //   };
//   //   schoolType: {
//   //     id: string;
//   //     name: string;
//   //   } | null;
//   //   selectedLevels: {
//   //     id: string;
//   //     name: string;
//   //     curriculum: {
//   //       id: string;
//   //       name: string;
//   //     };
//   //     gradeLevels: {
//   //       id: string;
//   //       name: string;
//   //       level: {
//   //         id: string;
//   //         name: string;
//   //       };
//   //     }[];
//   //     curriculumSubjects: {
//   //       id: string;
//   //       subject: {
//   //         id: string;
//   //         name: string;
//   //       };
//   //     }[];
//   //   }[];
//   // // Updated GraphQL Response Type
//   // interface SchoolConfigurationResponse {
//   //   id: string;
//   //   createdAt: Date;
//   //   updatedAt: Date;
//   //   tenant: {
//   //     id: string;
//   //     schoolName: string;
//   //     subdomain: string;
//   //   };
//   //   schoolType: {
//   //     id: string;
//   //     name: string;
//   //   } | null;
//   //   selectedLevels: {
//   //     id: string;
//   //     name: string;
//   //     curriculum: {
//   //       id: string;
//   //       name: string;
//   //     };
//   //     gradeLevels: {
//   //       id: string;
//   //       name: string;
//   //       level: {
//   //         id: string;
//   //         name: string;
//   //       };
//   //     }[];
//   //     curriculumSubjects: {
//   //       id: string;
//   //       subject: {
//   //         id: string;
//   //         name: string;
//   //       };
//   //     }[];
//   //   }[];

//   //  async getSchoolConfiguration(
//   //     subdomain: string,
//   //     userId: string,
//   //     user: { tenantId: string },
//   //   ): Promise<any> {
//   //     const tenant = await this.validateTenantOwnership(subdomain, userId);

//   //     if (!tenant || !tenant.name || !tenant.subdomain) {
//   //       console.log('Tenant info incomplete:', tenant);
//   //       throw new InternalServerErrorException(
//   //         'Tenant info incomplete or not found',
//   //       );
//   //     }
//   //     const schoolConfig = await this.schoolConfigRepo
//   //       .createQueryBuilder('config')
//   //       .leftJoinAndSelect('config.tenant', 'tenant')
//   //       .leftJoinAndSelect('config.selectedLevels', 'schoolLevel')
//   //       .leftJoinAndSelect('schoolLevel.schoolType', 'schoolType')
//   //       .leftJoinAndSelect('schoolLevel.gradeLevels', 'gradeLevels')
//   //       .leftJoinAndSelect('gradeLevels.streams', 'streams')
//   //       .leftJoinAndSelect('schoolLevel.curriculumSubjects', 'curriculumSubjects')
//   //       .leftJoinAndSelect('curriculumSubjects.subject', 'subject')
//   //       .where('tenant.id = :tenantId', { tenantId: user.tenantId })
//   //       .getOne();

//   //       console.log(
//   //         this.schoolConfigRepo
//   //           .createQueryBuilder('config')
//   //           .leftJoinAndSelect('config.selectedLevels', 'schoolLevel')
//   //           .leftJoinAndSelect('schoolLevel.gradeLevels', 'gradeLevels')
//   //           .getSql(),
//   //       );

//   //     // Add this logging
//   //     console.log('School config found:', !!schoolConfig);
//   //     if (schoolConfig) {
//   //       console.log(
//   //         'Selected levels count:',
//   //         schoolConfig.selectedLevels?.length,
//   //       );
//   //       schoolConfig.selectedLevels?.forEach((level, index) => {
//   //         console.log(`Level ${index} grade levels:`, level.gradeLevels?.length);
//   //       });
//   //     }

//   //     if (!schoolConfig) {
//   //       return null;
//   //     }

//   //     const configurationData = {
//   //       id: schoolConfig.id,
//   //       tenant: {
//   //         id: tenant.id,
//   //         schoolName: tenant.name,
//   //         subdomain: tenant.subdomain,
//   //       },
//   //       schoolType: schoolConfig.selectedLevels[0]?.schoolType,
//   //       selectedLevels: schoolConfig.selectedLevels.map((level) => ({
//   //         id: level.id,
//   //         name: level.name,
//   //         description: this.getCurriculumDescription(level.name),
//   //         ageRange: this.getAgeRange(level.name),
//   //         subjects:
//   //           level.curriculumSubjects
//   //             ?.map((cs) => ({
//   //               id: cs.subject?.id,
//   //               name: cs.subject?.name,
//   //               code: cs.subject?.code,
//   //               subjectType: cs.subjectType,
//   //             }))
//   //             .filter((s) => s.id) || [],
//   //         gradeLevels:
//   //           level.gradeLevels?.map((g) => ({
//   //             id: g.id,
//   //             name: g.name,
//   //             streams:
//   //               g.streams?.map((s) => ({
//   //                 id: s.id,
//   //                 name: s.name,
//   //               })) || [],
//   //           })) || [],
//   //       })),

//   //       createdAt: schoolConfig.createdAt,
//   //       updatedAt: schoolConfig.updatedAt,
//   //     };

//   //     return configurationData;
//   //   }

//   //   async debugRelations(tenantId: string): Promise<void> {
//   //     // Test 1: Check if curriculum has grade levels
//   //     const curricula = await this.curriculumRepo.find({
//   //       where: { schoolType: { name: 'International' } },
//   //       relations: ['gradeLevels'],
//   //     });

//   //     console.log(
//   //       'Curricula with grade levels:',
//   //       curricula.map((c) => ({
//   //         name: c.name,
//   //         gradeLevelsCount: c.gradeLevels?.length || 0,
//   //       })),
//   //     );

//   //     // Test 2: Check if curriculum has subjects
//   //     const curriculaWithSubjects = await this.curriculumRepo.find({
//   //       where: { schoolType: { name: 'International' } },
//   //       relations: ['curriculumSubjects', 'curriculumSubjects.subject'],
//   //     });

//   //     console.log(
//   //       'Curricula with subjects:',
//   //       curriculaWithSubjects.map((c) => ({
//   //         name: c.name,
//   //         subjectsCount: c.curriculumSubjects?.length || 0,
//   //       })),
//   //     );

//   //     // Test 3: Check school configuration (tenant-based)
//   //     const config = await this.schoolConfigRepo.findOne({
//   //       where: { tenant: { id: tenantId } },
//   //       relations: ['selectedLevels'],
//   //     });

//   //     console.log('School config:', {
//   //       id: config?.id,
//   //       selectedLevelsCount: config?.selectedLevels?.length || 0,
//   //     });
//   //   }

//   //   private async validateTenantOwnership(
//   //     subdomain: string,
//   //     userId: string,
//   //   ): Promise<Tenant> {
//   //     const tenant = await this.tenantRepo.findOne({
//   //       where: { subdomain },
//   //       relations: ['memberships', 'memberships.user'], // load required nested relations
//   //     });

//   //     if (!tenant) {
//   //       throw new NotFoundException('School (tenant) not found');
//   //     }

//   //     const userMembership = tenant.memberships?.find(
//   //       (membership) => membership.user.id === userId,
//   //     );

//   //     if (!userMembership) {
//   //       throw new ForbiddenException(
//   //         'Access denied: User does not belong to this school',
//   //       );
//   //     }

//   //     // Check if user has appropriate role to configure school levels
//   //     const allowedRoles = [MembershipRole.SCHOOL_ADMIN];

//   //     console.log('User role is::::::', userMembership.role);

//   //     console.log(allowedRoles, 'this is the allowed rolesssss');
//   //     if (!allowedRoles.includes(userMembership.role)) {
//   //       throw new ForbiddenException(
//   //         'Permission denied. You may not have admin rights to configure school levels.',
//   //       );
//   //     }

//   //     return tenant;
//   //   }

//   //   private async assertSchoolNotConfigured(tenantId: string): Promise<void> {
//   //     const existingConfig = await this.schoolConfigRepo.findOne({
//   //       where: {
//   //         tenant: { id: tenantId },
//   //         isActive: true,
//   //       },
//   //       relations: ['tenant'],
//   //     });

//   //     if (existingConfig) {
//   //       throw new BadRequestException('School has already been configured');
//   //     }
//   //   }

//   //   private getCurriculumDescription(curriculumName: string): string {
//   //     const key = curriculumName.replace(/\s+/g, '').replace(/-/g, '');

//   //     const descriptions = {
//   //       PrePrimary: 'Early childhood education',
//   //       LowerPrimary: 'Foundation stage',
//   //       UpperPrimary: 'Intermediate stage',
//   //       JuniorSecondary: 'Middle school stage',
//   //       SeniorSecondary: 'Advanced level',
//   //       MadrasaBeginners: 'With religious foundation',
//   //       MadrasaLower: 'With religious instruction',
//   //       MadrasaUpper: 'Religious education integration',
//   //       MadrasaSecondary: 'With religious studies integration',
//   //       MadrasaAdvancedAlim: 'Specialized religious education',
//   //       HomeschoolEarlyYears: 'Early childhood homeschooling',
//   //       HomeschoolLowerPrimary: 'Elementary homeschooling',
//   //       HomeschoolUpperPrimary: 'Upper elementary homeschooling',
//   //       HomeschoolJuniorSecondary: 'Middle school homeschooling',
//   //       HomeschoolSeniorSecondary: 'High school homeschooling',
//   //     };

//   //     return descriptions[key] || 'Educational stage';
//   //   }

//   //   private getAgeRange(curriculumName: string): string {
//   //     const normalizedKey = curriculumName
//   //       .replace(/\s+/g, '')
//   //       .replace(/_/g, '')
//   //       .replace(/-/g, '');

//   //     const ageRanges: Record<string, string> = {
//   //       PrePrimary: '4–5 years',
//   //       LowerPrimary: '6–8 years',
//   //       UpperPrimary: '9–11 years',
//   //       JuniorSecondary: '12–14 years',
//   //       SeniorSecondary: '15–17 years',
//   //       MadrasaBeginners: '3–5 years',
//   //       MadrasaLower: '6–8 years',
//   //       MadrasaUpper: '9–11 years',
//   //       MadrasaSecondary: '12–14 years',
//   //       MadrasaAdvancedAlim: '15–17 years',
//   //       HomeschoolEarlyYears: '3–5 years',
//   //       HomeschoolLowerPrimary: '6–8 years',
//   //       HomeschoolUpperPrimary: '9–11 years',
//   //       HomeschoolJuniorSecondary: '12–14 years',
//   //       HomeschoolSeniorSecondary: '15–17 years',
//   //     };

//   //     return ageRanges[normalizedKey] || 'Various ages';
//   //   }
//   // }



