import { Injectable, BadRequestException, ForbiddenException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Curriculum } from 'src/curriculum/entities/curicula.entity';
import { CurriculumSubject } from 'src/curriculum/entities/curriculum_subjects.entity';
import { GradeLevel } from 'src/level/entities/grade-level.entity';
import { School } from 'src/school/entities/school.entity';
import { Equal,In, Repository } from 'typeorm';
import { SchoolConfig } from '../entities/school-config.entity';
import { SchoolLevel } from '../entities/school_level.entity';
import { Tenant } from 'src/tenants/entities/tenant.entity';
import { MembershipRole } from 'src/user-tenant-membership/entities/user-tenant-membership.entity';



@Injectable()
export class SchoolTypeService {
  constructor(
    @InjectRepository(School)
    private readonly schoolRepo: Repository<School>,
    @InjectRepository(Curriculum)
    private readonly curriculumRepo: Repository<Curriculum>,
    @InjectRepository(GradeLevel)
    private readonly gradeLevelRepo: Repository<GradeLevel>,
    @InjectRepository(CurriculumSubject)
    private readonly curriculumSubjectRepo: Repository<CurriculumSubject>,
    @InjectRepository(SchoolConfig)
    private readonly schoolConfigRepo: Repository<SchoolConfig>,
    @InjectRepository(SchoolLevel)
    private readonly schoolLevelRepo: Repository<SchoolLevel>,

    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
  ) {}

  async configureSchoolLevelsByNames(
    levelNames: string[],
    subdomain: string,
    userId: string
  ): Promise<any> {
    const tenant = await this.validateTenantOwnership(subdomain, userId);
    console.log(subdomain, 'this is the subdomain', userId, 'this is the user id')
    await this.assertSchoolNotConfigured(tenant.id);
  
    const normalizedLevelNames = levelNames.map(name =>
      name.toLowerCase().trim().replace(/\s+/g, ' ')
    );
  
    const matchingCurricula = await this.curriculumRepo
      .createQueryBuilder('curriculum')
      .leftJoinAndSelect('curriculum.schoolType', 'schoolType')
      .leftJoinAndSelect('curriculum.gradeLevels', 'gradeLevels')
      .leftJoinAndSelect('gradeLevels.level', 'level')
      .leftJoinAndSelect('curriculum.curriculumSubjects', 'curriculumSubjects')
      .leftJoinAndSelect('curriculumSubjects.subject', 'subject')
      .leftJoinAndSelect('curriculum.schoolLevels', 'schoolLevels')
      .where('LOWER(REPLACE(curriculum.display_name, \' \', \' \')) IN (:...levelNames)', {
        levelNames: normalizedLevelNames,
      })
      .getMany();
  
    if (matchingCurricula.length === 0) {
      throw new BadRequestException('No matching curriculum levels found');
    }
  
    const schoolTypes = [...new Set(matchingCurricula.map(c => c.schoolType.id))];
    if (schoolTypes.length > 1) {
      throw new BadRequestException(
        'Cannot select levels from different school types. Please select levels from the same school type only.'
      );
    }


  
    const schoolLevels: SchoolLevel[] = [];
  
    for (const curriculum of matchingCurricula) {
      const gradeLevelIds = curriculum.gradeLevels?.map(gl => gl.id) || [];
  
      const validGradeLevels = await this.gradeLevelRepo.find({
        where: { id: In(gradeLevelIds) },
        relations: ['level'],
      });
  
      for (const gl of validGradeLevels) {
        if (!gl.level?.id) {
          throw new Error(`GradeLevel ${gl.id} is missing a valid Level`);
        }
      }
  
      // Check if a SchoolLevel already exists for this curriculum
      let schoolLevel = await this.schoolLevelRepo.findOne({
        where: {
          curriculum: { id: curriculum.id },
        },
        relations: ['curriculumSubjects'],
      });
  
      if (schoolLevel) {
        // Update existing one
        schoolLevel.name = curriculum.display_name;
        schoolLevel.curriculumSubjects = curriculum.curriculumSubjects || [];
        schoolLevel = await this.schoolLevelRepo.save(schoolLevel);
      } else {
        // Create a new one
        schoolLevel = this.schoolLevelRepo.create({
          name: curriculum.display_name,
          schoolType: curriculum.schoolType,
          curriculum: curriculum,
          curriculumSubjects: curriculum.curriculumSubjects || [],
        });
        schoolLevel = await this.schoolLevelRepo.save(schoolLevel);
      }
  
      schoolLevels.push(schoolLevel);
    }
  
    if (schoolLevels.length === 0) {
      throw new BadRequestException('No school levels could be created or found');
    }
  
    let schoolConfig = await this.schoolConfigRepo.findOne({
      where: { tenant: { id: tenant.id } },
      relations: ['selectedLevels'],
    });
  
    if (schoolConfig) {
      // Remove previous relations if they exist
      if (schoolConfig.selectedLevels?.length) {
        await this.schoolConfigRepo
          .createQueryBuilder()
          .relation('SchoolConfig', 'selectedLevels')
          .of(schoolConfig.id)
          .remove(schoolConfig.selectedLevels.map(sl => sl.id));
      }
  
      // Add updated levels
      await this.schoolConfigRepo
        .createQueryBuilder()
        .relation('SchoolConfig', 'selectedLevels')
        .of(schoolConfig.id)
        .add(schoolLevels.map(sl => sl.id));
  
      schoolConfig.updatedAt = new Date();
      await this.schoolConfigRepo.save(schoolConfig);
    } else {
      // Create a new config and relate the levels
      schoolConfig = await this.schoolConfigRepo.save({
        tenant,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
  
      await this.schoolConfigRepo
        .createQueryBuilder()
        .relation('SchoolConfig', 'selectedLevels')
        .of(schoolConfig.id)
        .add(schoolLevels.map(sl => sl.id));
    }
  
    // Return full config with deep relations
    const result = await this.schoolConfigRepo.findOne({
      where: { id: schoolConfig.id },
      relations: [
        'tenant',
        'selectedLevels',
        'selectedLevels.gradeLevels',
        'selectedLevels.gradeLevels.level',
        'selectedLevels.curriculum',
        'selectedLevels.curriculumSubjects',
        'selectedLevels.curriculumSubjects.subject',
        'selectedLevels.curriculum.schoolType',
      ],
    });
    
    if (!result) {
      throw new Error('School configuration not found');
    }
    
    if (!result.selectedLevels || result.selectedLevels.length === 0) {
      throw new Error('No selected levels found');
    }
    
    // Define the SchoolConfigurationResponse interface
    interface SchoolConfigurationResponse {
      id: string;
      createdAt: Date;
      updatedAt: Date;
      tenant: {
        id: string;
        schoolName: string;
        subdomain: string;
      };
      schoolType: {
        id: string;
        name: string;
      } | null;
      selectedLevels: {
        id: string;
        curriculum: {
          id: string;
          name: string;
        };
        gradeLevels: {
          id: string;
          level: {
            id: string;
            name: string;
          };
        }[];
        curriculumSubjects: {
          id: string;
          subject: {
            id: string;
            name: string;
          };
        }[];
      }[];
    }
    
        const response: SchoolConfigurationResponse = {
      id: result.id,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      tenant: {
        id: result.tenant.id,
        schoolName: result.tenant.name,
        subdomain: result.tenant.subdomain,
      },
      schoolType: result.selectedLevels[0]?.curriculum?.schoolType
        ? {
            id: result.selectedLevels[0].curriculum.schoolType.id,
            name: result.selectedLevels[0].curriculum.schoolType.name,
          }
        : null,
        selectedLevels: result.selectedLevels.map(sl => ({
          id: sl.id,
          name: sl.name, 
          curriculum: {
            id: sl.curriculum.id,
            name: sl.curriculum.name,
          },
          gradeLevels: sl.gradeLevels?.map(gl => ({
            id: gl.id,
            name: gl.name, // ✅ ADD THIS LINE
            level: {
              id: gl.level.id,
              name: gl.level.name,
            },
          })) ?? [],
          curriculumSubjects: sl.curriculumSubjects?.map(cs => ({
            id: cs.id,
            subject: {
              id: cs.subject.id,
              name: cs.subject.name,
            },
          })) ?? [],
        })),
    };
    
    return response;
    
  }
  
  

  
    async getSchoolConfiguration(subdomain: string, userId: string, user: { tenantId: string }): Promise<any> {
      const tenant = await this.validateTenantOwnership(subdomain, userId);

      if (!tenant || !tenant.name || !tenant.subdomain) {
        console.log('Tenant info incomplete:', tenant);
        throw new InternalServerErrorException('Tenant info incomplete or not found');
      }
      const schoolConfig = await this.schoolConfigRepo
      .createQueryBuilder('config')
      .leftJoinAndSelect('config.tenant', 'tenant') // 👈 updated from 'school'
      .leftJoinAndSelect('config.selectedLevels', 'schoolLevel')
      .leftJoinAndSelect('schoolLevel.schoolType', 'schoolType')
      .leftJoinAndSelect('schoolLevel.gradeLevels', 'gradeLevels')
      .leftJoinAndSelect(
        'gradeLevels.streams',
        'streams',
        'streams.tenantId = :tenantId',
        { tenantId: user.tenantId }      
      )
      .leftJoinAndSelect('schoolLevel.curriculumSubjects', 'curriculumSubjects')
      .leftJoinAndSelect('curriculumSubjects.subject', 'subject')
      .where('tenant.id = :tenantId', { tenantId: user.tenantId }) // 👈 updated from school
      .getOne();
  
  
    if (!schoolConfig) {
      return null;
    }
  
        
    const configurationData = {
      id: schoolConfig.id,
      tenant: { 
        id: tenant.id,
        schoolName: tenant.name,
        subdomain: tenant.subdomain
      },
      schoolType: schoolConfig.selectedLevels[0]?.schoolType,
      selectedLevels: schoolConfig.selectedLevels.map(level => ({
        id: level.id,
        name: level.name,
        description: this.getCurriculumDescription(level.name),
        ageRange: this.getAgeRange(level.name),
        subjects: level.curriculumSubjects?.map(cs => ({
          id: cs.subject?.id,
          name: cs.subject?.name,
          code: cs.subject?.code,
          subjectType: cs.subjectType
        })).filter(s => s.id) || [],
        gradeLevels: level.gradeLevels?.map(g => ({
          id: g.id,
          name: g.name,
          streams: g.streams?.map(s => ({
            id: s.id,
            name: s.name,
          })) || [],
        })) || []
      })),
      
      createdAt: schoolConfig.createdAt,
      updatedAt: schoolConfig.updatedAt
    };
  
    return configurationData;
  }


  async debugRelations(tenantId: string): Promise<void> {
    // Test 1: Check if curriculum has grade levels
    const curricula = await this.curriculumRepo.find({
      where: { schoolType: { name: 'International' } },
      relations: ['gradeLevels']
    });
  
    console.log('Curricula with grade levels:', curricula.map(c => ({
      name: c.name,
      gradeLevelsCount: c.gradeLevels?.length || 0
    })));
  
    // Test 2: Check if curriculum has subjects
    const curriculaWithSubjects = await this.curriculumRepo.find({
      where: { schoolType: { name: 'International' } },
      relations: ['curriculumSubjects', 'curriculumSubjects.subject']
    });
  
    console.log('Curricula with subjects:', curriculaWithSubjects.map(c => ({
      name: c.name,
      subjectsCount: c.curriculumSubjects?.length || 0
    })));
  
    // Test 3: Check school configuration (tenant-based)
    const config = await this.schoolConfigRepo.findOne({
      where: { tenant: { id: tenantId } },
      relations: ['selectedLevels']
    });
  
    console.log('School config:', {
      id: config?.id,
      selectedLevelsCount: config?.selectedLevels?.length || 0
    });
  }
  



  private async validateTenantOwnership(subdomain: string, userId: string): Promise<Tenant> {
    const tenant = await this.tenantRepo.findOne({
      where: { subdomain },
      relations: ['memberships', 'memberships.user'], 
    });
    console.log(tenant, 'this is the tenant')
  
    if (!tenant) {
      throw new NotFoundException('School (tenant) not found');
    }
  
    const userMembership = tenant.memberships?.find(
      membership => membership.user.id === userId
    );
  
    // if (!userMembership) {
    //   throw new ForbiddenException('Access denied: User does not belong to this school');
    // }

    // // Check if user has appropriate role to configure school levels
    // const allowedRoles = MembershipRole.SCHOOL_ADMIN;
    // if (!allowedRoles.includes(userMembership.role)) {
    //   throw new ForbiddenException('Permission denied. You may not have admin rights to configure school levels.');
    // }
  
    return tenant;
  }
  
  
  
   
  
  
  
  private async assertSchoolNotConfigured(tenantId: string): Promise<void> {
    const existingConfig = await this.schoolConfigRepo.findOne({
      where: {
        tenant: { id: tenantId },
        isActive: true,
      },
      relations: ['tenant'],
    });
  
    if (existingConfig) {
      throw new BadRequestException('School has already been configured');
    }
  }
  


  private getCurriculumDescription(curriculumName: string): string {
    const key = curriculumName.replace(/\s+/g, '').replace(/-/g, '');
  
    const descriptions = {
      'PrePrimary': 'Early childhood education',
      'LowerPrimary': 'Foundation stage',
      'UpperPrimary': 'Intermediate stage',
      'JuniorSecondary': 'Middle school stage',
      'SeniorSecondary': 'Advanced level',
      'MadrasaBeginners': 'With religious foundation',
      'MadrasaLower': 'With religious instruction',
      'MadrasaUpper': 'Religious education integration',
      'MadrasaSecondary': 'With religious studies integration',
      'MadrasaAdvancedAlim': 'Specialized religious education',
      'HomeschoolEarlyYears': 'Early childhood homeschooling',
      'HomeschoolLowerPrimary': 'Elementary homeschooling',
      'HomeschoolUpperPrimary': 'Upper elementary homeschooling',
      'HomeschoolJuniorSecondary': 'Middle school homeschooling',
      'HomeschoolSeniorSecondary': 'High school homeschooling'
    };
  
    return descriptions[key] || 'Educational stage';
  }
  

  private getAgeRange(curriculumName: string): string {
    const normalizedKey = curriculumName.replace(/\s+/g, '').replace(/_/g, '').replace(/-/g, '');
  
    const ageRanges: Record<string, string> = {
      'PrePrimary': '4–5 years',
      'LowerPrimary': '6–8 years',
      'UpperPrimary': '9–11 years',
      'JuniorSecondary': '12–14 years',
      'SeniorSecondary': '15–17 years',
      'MadrasaBeginners': '3–5 years',
      'MadrasaLower': '6–8 years',
      'MadrasaUpper': '9–11 years',
      'MadrasaSecondary': '12–14 years',
      'MadrasaAdvancedAlim': '15–17 years',
      'HomeschoolEarlyYears': '3–5 years',
      'HomeschoolLowerPrimary': '6–8 years',
      'HomeschoolUpperPrimary': '9–11 years',
      'HomeschoolJuniorSecondary': '12–14 years',
      'HomeschoolSeniorSecondary': '15–17 years',
    };
  
    return ageRanges[normalizedKey] || 'Various ages';
  }
  
}
