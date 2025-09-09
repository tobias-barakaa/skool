import { BadRequestException, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { SchoolConfig } from '../school-type/entities/school-config.entity';
import { SchoolConfigLevel } from '../school-type/entities/school_config_level';
import { SchoolConfigGradeLevel } from '../school-type/entities/school_config_grade_level';
import { TenantGradeLevel } from '../school-type/entities/tenant-grade-level';

@Injectable()
export class SchoolSetupGuardService {
  private readonly logger = new Logger(SchoolSetupGuardService.name);

  constructor(
    @InjectRepository(SchoolConfig)
    private readonly schoolConfigRepo: Repository<SchoolConfig>,
    @InjectRepository(SchoolConfigLevel)
    private readonly configLevelRepo: Repository<SchoolConfigLevel>,
    @InjectRepository(TenantGradeLevel)
    private readonly tenantGradeLevelRepo: Repository<TenantGradeLevel>,
    private readonly dataSource: DataSource,
  ) {}



  async validateGradeLevelBelongsToTenant(
    tenantId: string,
    tenantGradeLevelId: string,
  ): Promise<boolean> {
    const count = await this.tenantGradeLevelRepo.count({
      where: { id: tenantGradeLevelId, tenant: { id: tenantId } },
    });
    return count > 0;
  }

  async validateTenantExists(tenantId: string): Promise<boolean> {
    const tenant = await this.tenantGradeLevelRepo.findOne({
      where: { id: tenantId },
    });
    return !!tenant;
  }

  async validateSchoolConfigExists(tenantId: string): Promise<boolean> {
    const config = await this.schoolConfigRepo.findOne({
      where: { tenant: { id: tenantId } },
    });
    return !!config;
  }



  
  async validateSchoolIsConfigured(tenantId: string) {
    this.logger.debug(`Validating school configuration for tenant: ${tenantId}`);

    const schoolConfigRepository = this.dataSource.getRepository(SchoolConfig);

    const config = await schoolConfigRepository.findOneBy({
      tenant: { id: tenantId }
    });

    if (!config) {
      this.logger.warn(`Action denied for unconfigured school. Tenant ID: ${tenantId}`);
      throw new ForbiddenException({
        message: 'School setup is not complete. Please configure the school before proceeding.',
        error: 'SCHOOL_NOT_CONFIGURED',
      });
    }

    this.logger.debug(`School is configured for tenant: ${tenantId}. Validation successful.`);
  }
}














// import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
// import { DataSource } from 'typeorm';
// import { SchoolConfig } from 'src/admin/school-config/entities/school-config.entity';
// import { TenantGradeLevel } from 'src/path/to/tenant-grade-level.entity'; // <-- UPDATE IMPORT PATH

// @Injectable()
// export class SchoolSetupGuardService {
//   private readonly logger = new Logger(SchoolSetupGuardService.name);

//   constructor(private readonly dataSource: DataSource) {}

//   /**
//    * Checks if a school configuration exists for the given tenant.
//    * Throws a ForbiddenException if the school is not configured.
//    * @param tenantId The UUID of the tenant to validate.
//    */
//   async validateSchoolIsConfigured(tenantId: string): Promise<void> {
//     this.logger.debug(`Validating school configuration for tenant: ${tenantId}`);

//     // Use DataSource to get the repository without direct injection
//     const schoolConfigRepository = this.dataSource.getRepository(SchoolConfig);

//     const config = await schoolConfigRepository.findOneBy({
//       tenant_id: tenantId, // Assuming the column in SchoolConfig is tenant_id
//     });

//     if (!config) {
//       this.logger.warn(`Action denied for unconfigured school. Tenant ID: ${tenantId}`);
//       throw new ForbiddenException({
//         message: 'School setup is not complete. Please configure the school before proceeding.',
//         error: 'SCHOOL_NOT_CONFIGURED',
//       });
//     }

//     this.logger.debug(`School is configured for tenant: ${tenantId}. Validation successful.`);
//   }

//   /**
//    * Checks if a specific TenantGradeLevel ID is valid and belongs to the tenant.
//    * Throws a BadRequestException if invalid.
//    * @param tenantId The UUID of the tenant.
//    * @param tenantGradeLevelId The UUID of the TenantGradeLevel to check.
//    * @returns The validated TenantGradeLevel entity.
//    */
//   async validateGradeLevelBelongsToTenant(
//     tenantId: string,
//     tenantGradeLevelId: string,
//   ): Promise<TenantGradeLevel> {
//       const tenantGradeLevelRepository = this.dataSource.getRepository(TenantGradeLevel);

//       const gradeLevel = await tenantGradeLevelRepository.findOneBy({
//           id: tenantGradeLevelId,
//           tenant_id: tenantId, // Assuming TenantGradeLevel has a tenant_id foreign key
//       });

//       if (!gradeLevel) {
//           throw new BadRequestException(
//               `Grade level with ID ${tenantGradeLevelId} is not part of the configured school for this tenant.`,
//           );
//       }

//       return gradeLevel;
//   }
// }
