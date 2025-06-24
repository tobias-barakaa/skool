import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Curriculum } from 'src/curriculum/entities/curicula.entity';
import { CurriculumSubject } from 'src/curriculum/entities/curriculum_subjects.entity';
import { GradeLevel } from 'src/level/entities/grade-level.entity';
import { School } from 'src/school/entities/school.entity';
import { Equal,In, Repository } from 'typeorm';
import { SchoolConfig } from '../entities/school-config.entity';
import { SchoolLevel } from '../entities/school_level.entity';


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
  ) {}

  async configureSchoolLevelsByNames(
    levelNames: string[],
    subdomain: string,
    userId: string
  ): Promise<any> {
    const school = await this.validateSchoolOwnership(subdomain, userId);
    await this.assertSchoolNotConfigured(school.schoolId);
  
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
      where: { school: Equal(school.schoolId) },
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
        school,
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
        'school',
        'selectedLevels',
        'selectedLevels.gradeLevels',
        'selectedLevels.gradeLevels.level',
        'selectedLevels.curriculum',
        'selectedLevels.curriculumSubjects',
        'selectedLevels.curriculumSubjects.subject',
        'selectedLevels.curriculum.schoolType',
      ],
    });
  
    return result;
  }
  

  


  async getSchoolConfiguration(subdomain: string, userId: string): Promise<any> {
    // Validate school and user access
    // const school = await this.validateSchoolAccess(subdomain, userId);
    // const school = await this.validateSchoolAccess(subdomain, userId);
    const school = await this.validateSchoolOwnership(subdomain, userId);


  
    // Use QueryBuilder for more precise control over relations
  const schoolConfig = await this.schoolConfigRepo
  .createQueryBuilder('config')
  .leftJoinAndSelect('config.school', 'school')
  .leftJoinAndSelect('config.selectedLevels', 'schoolLevel')
  .leftJoinAndSelect('schoolLevel.schoolType', 'schoolType')
  .leftJoinAndSelect('schoolLevel.gradeLevels', 'gradeLevels') 
  .leftJoinAndSelect('gradeLevels.streams', 'streams')
  .leftJoinAndSelect('schoolLevel.curriculumSubjects', 'curriculumSubjects')
  .leftJoinAndSelect('curriculumSubjects.subject', 'subject')
  .where('school.schoolId = :schoolId', { schoolId: school.schoolId })
  .getOne();
  
  
    if (!schoolConfig) {
      return null;
    }
  
        
          const configurationData = {
      id: schoolConfig.id,
      school: {
        schoolId: school.schoolId,
        schoolName: school.schoolName,
        subdomain: school.subdomain
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
  
  // Also, you might want to verify your relations are working by testing individual queries:
  async debugRelations(schoolId: string): Promise<void> {
    // Test 1: Check if curriculum has grade levels
    const curricula = await this.curriculumRepo.find({
      where: { schoolType: { name: 'International' } }, // or whatever school type
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
  
    // Test 3: Check school configuration
    const config = await this.schoolConfigRepo.findOne({
      where: { school: { schoolId } },
      relations: ['selectedLevels']
    });
    
    console.log('School config:', {
      id: config?.id,
      selectedLevelsCount: config?.selectedLevels?.length || 0
    });
  }




  private async validateSchoolOwnership(subdomain: string, userId: string): Promise<School> {
    const school = await this.schoolRepo.findOne({
      where: { subdomain },
      relations: ['users'],
    });
  
    if (!school) {
      throw new NotFoundException('School not found');
    }
  
    const userBelongsToSchool = school.users?.some(user => user.id === userId);
    if (!userBelongsToSchool) {
      throw new ForbiddenException('Access denied: User does not belong to this school');
    }
  
    return school;
  }
  

  private async assertSchoolNotConfigured(schoolId: string): Promise<void> {
    const existingConfig = await this.schoolConfigRepo.findOne({
      where: { school: Equal(schoolId), isActive: true },
    });
  
    if (existingConfig) {
      throw new BadRequestException('School has already been configured');
    }
  }

  private getCurriculumDescription(curriculumName: string): string {
    const descriptions = {
      'PrePrimary': 'Early childhood education',
      'LowerPrimary': 'Foundation stage',
      'UpperPrimary': 'Intermediate stage',
      'JuniorSecondary': 'Middle school stage',
      'SeniorSecondary': 'Advanced level',
      'Madrasa_Beginners': 'With religious foundation',
      'Madrasa_Lower': 'With religious instruction',
      'Madrasa_Upper': 'Religious education integration',
      'Madrasa_Secondary': 'With religious studies integration',
      'Madrasa_AdvancedAlim': 'Specialized religious education',
      'Homeschool_EarlyYears': 'Early childhood homeschooling',
      'Homeschool_LowerPrimary': 'Elementary homeschooling',
      'Homeschool_UpperPrimary': 'Upper elementary homeschooling',
      'Homeschool_JuniorSecondary': 'Middle school homeschooling',
      'Homeschool_SeniorSecondary': 'High school homeschooling'
    };
    return descriptions[curriculumName] || 'Educational stage';
  }

  private getAgeRange(curriculumName: string): string {
    const ageRanges = {
      'PrePrimary': '4–5 years',
      'LowerPrimary': '6–8 years',
      'UpperPrimary': '9–11 years',
      'JuniorSecondary': '12–14 years',
      'SeniorSecondary': '15–17 years',
      'Madrasa_Beginners': '3–5 years',
      'Madrasa_Lower': '6–8 years',
      'Madrasa_Upper': '9–11 years',
      'Madrasa_Secondary': '12–14 years',
      'Madrasa_AdvancedAlim': '15–17 years',
      'Homeschool_EarlyYears': '3–5 years',
      'Homeschool_LowerPrimary': '6–8 years',
      'Homeschool_UpperPrimary': '9–11 years',
      'Homeschool_JuniorSecondary': '12–14 years',
      'Homeschool_SeniorSecondary': '15–17 years'
    };
    return ageRanges[curriculumName] || 'Various ages';
  }
}
