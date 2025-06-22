import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Curriculum } from 'src/curriculum/entities/curicula.entity';
import { CurriculumSubject } from 'src/curriculum/entities/curriculum_subjects.entity';
import { GradeLevel } from 'src/level/entities/grade-level.entity';
import { School } from 'src/school/entities/school.entity';
import { Equal, Repository } from 'typeorm';
import { SchoolConfig } from '../entities/school-config.entity';

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
  ) {}

  async configureSchoolLevelsByNames(
    levelNames: string[],
    subdomain: string,
    userId: string
  ): Promise<any> {
    // Validate school and user access
    const school = await this.validateSchoolAccess(subdomain, userId);
    
    // Normalize level names for case-insensitive matching
    const normalizedLevelNames = levelNames.map(name => 
      name.toLowerCase().trim().replace(/\s+/g, ' ')
    );
    
    // Find curricula that match the provided level names
    const matchingCurricula = await this.curriculumRepo
      .createQueryBuilder('curriculum')
      .leftJoinAndSelect('curriculum.schoolType', 'schoolType')
      .leftJoinAndSelect('curriculum.gradeLevels', 'gradeLevels')
      .leftJoinAndSelect('gradeLevels.level', 'level')

      .where('LOWER(REPLACE(curriculum.display_name, \' \', \' \')) IN (:...levelNames)', {
        levelNames: normalizedLevelNames
      })
      .getMany();

    if (matchingCurricula.length === 0) {
      throw new BadRequestException('No matching curriculum levels found');
    }

    // Validate that all selected levels belong to the same school type
    const schoolTypes = [...new Set(matchingCurricula.map(c => c.schoolType.id))];
    if (schoolTypes.length > 1) {
      throw new BadRequestException(
        'Cannot select levels from different school types. Please select levels from the same school type only.'
      );
    }

    // // Check if school already has a configuration
    // let schoolConfig = await this.schoolConfigRepo.findOne({
    //   where: { id: school.schoolId },
    //   relations: ['selectedLevels', 'selectedLevels.gradeLevels']
    // });

    let schoolConfig = await this.schoolConfigRepo.findOne({
        where: { school: Equal(school.schoolId) },
        relations: ['selectedLevels', 'selectedLevels.gradeLevels']
      });

    if (schoolConfig) {
      // Update existing configuration
      schoolConfig.selectedLevels = matchingCurricula.map(curriculum => ({
        id: curriculum.id, // Assuming curriculum.id exists
        curriculum,
        gradeLevels: curriculum.gradeLevels,
        schoolType: curriculum.schoolType,
        name: curriculum.display_name,
        curriculumSubjects: curriculum.curriculumSubjects || [], 
      }));
      schoolConfig.updatedAt = new Date();
    } else {
      // Create new configuration
      schoolConfig = this.schoolConfigRepo.create({
        school,
        selectedLevels: matchingCurricula,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    await this.schoolConfigRepo.save(schoolConfig);

    // Return the configuration with all related data
    return await this.schoolConfigRepo.findOne({
      where: { id: schoolConfig.id },
      relations: [
        'school',
        'selectedLevels',
        'selectedLevels.gradeLevels',
        'selectedLevels.schoolType'
      ]
    });
  }


  async getSchoolConfiguration(subdomain: string, userId: string): Promise<any> {
    // Validate school and user access
    const school = await this.validateSchoolAccess(subdomain, userId);
  
    // Use QueryBuilder for more precise control over relations
    const schoolConfig = await this.schoolConfigRepo
      .createQueryBuilder('config')
      .leftJoinAndSelect('config.school', 'school')
      .leftJoinAndSelect('config.selectedLevels', 'curriculum')
      .leftJoinAndSelect('curriculum.schoolType', 'schoolType')
      .leftJoinAndSelect('curriculum.gradeLevels', 'gradeLevels')
      .leftJoinAndSelect('curriculum.curriculumSubjects', 'curriculumSubjects')
      .leftJoinAndSelect('curriculumSubjects.subject', 'subject')
      .where('school.schoolId = :schoolId', { schoolId: school.schoolId })
      .getOne();
  
    if (!schoolConfig) {
      return null;
    }
  
    // Debug logging
    console.log('School Config Debug:', {
      id: schoolConfig.id,
      selectedLevelsCount: schoolConfig.selectedLevels?.length,
      levels: schoolConfig.selectedLevels?.map(level => ({
        id: level.id,
        name: level.name,
        gradeLevelsCount: level.gradeLevels?.length || 0,
        curriculumSubjectsCount: level.curriculumSubjects?.length || 0,
        gradeLevels: level.gradeLevels?.map(gl => gl.name) || [],
        subjects: level.curriculumSubjects?.map(cs => cs.subject?.name) || []
      }))
    });
  
    // Organize the data structure for frontend consumption
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
        gradeLevels: level.gradeLevels?.map(grade => ({
          id: grade.id,
          name: grade.name,
          code: grade.code,
          order: grade.order
        })) || [],
        subjects: level.curriculumSubjects?.map(cs => ({
          id: cs.subject?.id,
          name: cs.subject?.name,
          code: cs.subject?.code,
          subjectType: cs.subjectType
        })).filter(s => s.id) || [] // Filter out null subjects
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
//   async getSchoolConfiguration(subdomain: string, userId: string): Promise<any> {
//     // Validate school and user access
//     const school = await this.validateSchoolAccess(subdomain, userId);

//     const schoolConfig = await this.schoolConfigRepo.findOne({
//         where: { school: Equal(school.schoolId) },
//       relations: [
//         'school',
//         'selectedLevels',
//         'selectedLevels.gradeLevels',
//         'selectedLevels.schoolType',
//         'selectedLevels.curriculumSubjects',
//         'selectedLevels.curriculumSubjects.subject'
//       ]
//     });

    

//     if (!schoolConfig) {
//       return null;
//     }

//     // Organize the data structure for frontend consumption
//     const configurationData = {
//       id: schoolConfig.id,
//       school: {
//         schoolId: school.schoolId,
//         schoolName: school.schoolName,
//         subdomain: school.subdomain
//       },
//       schoolType: schoolConfig.selectedLevels[0]?.schoolType,
//       selectedLevels: schoolConfig.selectedLevels.map(level => ({
//         id: level.id,
//         name: level.name,
//         displayName: level.curriculum?.display_name,
//         code: level.curriculum?.code,
//         description: this.getCurriculumDescription(level.curriculum?.name),
//         ageRange: this.getAgeRange(level.curriculum?.name),
//         gradeLevels: level.gradeLevels.map(grade => ({
//           id: grade.id,
//           name: grade.name,
//           code: grade.code,
//           order: grade.order
//         })),
//         subjects: level.curriculum?.curriculumSubjects?.map(cs => ({
//           id: cs.subject.id,
//           name: cs.subject.name,
//           code: cs.subject.code,
//           subjectType: cs.subjectType
//         })) || []
//       })),
//       createdAt: schoolConfig.createdAt,
//       updatedAt: schoolConfig.updatedAt
//     };

//     return configurationData;
//   }

  private async validateSchoolAccess(subdomain: string, userId: string): Promise<School> {
    const school = await this.schoolRepo.findOne({
      where: { subdomain },
      relations: ['users']
    });

    if (!school) {
    throw new NotFoundException('School not found');
  }

  // ✅ Add these debug logs
  console.log('School users:', school.users?.map(u => u.id));
  console.log('Current user ID:', userId);

    if (!school) {
      throw new BadRequestException('School not found');
    }

    // Verify user belongs to this school
    const userBelongsToSchool = school.users?.some(user => user.id === userId);
    if (!userBelongsToSchool) {
      throw new ForbiddenException('Access denied: User does not belong to this school');
    }

    return school;
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