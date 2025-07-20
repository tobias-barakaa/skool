import { BadRequestException, Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { SchoolConfig } from "../school-type/entities/school-config.entity";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class SchoolSetupGuardService {
  constructor(
    @InjectRepository(SchoolConfig)
    private readonly schoolConfigRepo: Repository<SchoolConfig>,
  ) {}

  async validateSchoolIsConfigured(tenantId: string) {
    const schoolConfig = await this.schoolConfigRepo.findOne({
      where: { tenant: { id: tenantId } },
      relations: ['selectedLevels'],
    });

    if (
      !schoolConfig ||
      !Array.isArray(schoolConfig.selectedLevels) ||
      schoolConfig.selectedLevels.length === 0
    ) {
      throw new BadRequestException(
        'Please complete your school setup before performing this action.',
      );
    }
  }
}
