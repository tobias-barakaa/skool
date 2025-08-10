import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { GradeLevel } from 'src/admin/level/entities/grade-level.entity';
import { CurriculumSubject } from 'src/admin/curriculum/entities/curriculum_subjects.entity';
import { SchoolConfig } from 'src/admin/school-type/entities/school-config.entity';




@Injectable()
export class TenantValidationServiceProvider {
  constructor(
    @InjectRepository(GradeLevel)
    private readonly gradeLevelRepo: Repository<GradeLevel>,

    @InjectRepository(CurriculumSubject)
    private readonly curriculumSubjectRepo: Repository<CurriculumSubject>,

    @InjectRepository(SchoolConfig)
    private readonly schoolConfigRepo: Repository<SchoolConfig>,
  ) {}

  async validateGradeLevelOwnership(gradeLevelId: string, tenantId: string) {
    const grade = await this.gradeLevelRepo.findOne({
      where: { id: gradeLevelId },
      relations: ['level', 'level.schoolType'],
    });

    if (!grade) throw new NotFoundException('Grade level not found');

    // You might need a join here through SchoolConfig -> Level -> GradeLevel
    const schoolConfig = await this.schoolConfigRepo.findOne({
      where: { tenant: { id: tenantId } },
      relations: ['schoolType'], // Adjust relations to match actual structure
    });

    const isValid: boolean =
      schoolConfig?.schoolType?.id === grade.level.schoolType?.id;

    if (!isValid) {
      throw new ForbiddenException(
        'You do not have access to this grade level',
      );
    }
  }

  // async validateSubjectOwnership(
  //   subjectId: string,
  //   gradeLevelId: string,
  //   tenantId: string,
  // ) {
  //   const config = await this.schoolConfigRepo.findOne({
  //     where: { tenant: { id: tenantId } },
  //     relations: [
  //       'selectedLevels',
  //       'selectedLevels.subjects',
  //       'selectedLevels.gradeLevels',
  //     ],
  //   });

  //   if (!config) {
  //     throw new ForbiddenException('School not configured');
  //   }

  //   // Check if any level has both the subject and grade level
  //   const validLevel = config.selectedLevels?.find((level) => {
  //     const subjectMatch = level.subjects?.some((subj) => subj.id === subjectId);
  //     const gradeMatch = level.gradeLevels?.some(
  //       (grade) => grade.id === gradeLevelId,
  //     );
  //     return subjectMatch && gradeMatch;
  //   });

  //   if (!validLevel) {
  //     throw new ForbiddenException(
  //       'Subject not available for this grade level',
  //     );
  //   }
  // }
}
