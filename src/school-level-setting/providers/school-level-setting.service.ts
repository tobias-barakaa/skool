import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { SchoolLevelSetting } from '../entities/school-level-setting.entity';
import { School } from 'src/school/entities/school.entity';
import { Level } from 'src/level/entities/level.entities';

@Injectable()
export class SchoolLevelSettingService {
  constructor(
    @InjectRepository(SchoolLevelSetting)
    private readonly settingRepo: Repository<SchoolLevelSetting>,
    @InjectRepository(School)
    private readonly schoolRepo: Repository<School>,
    @InjectRepository(Level)
    private readonly levelRepo: Repository<Level>,
  ) {}

  async configureLevelsByNames(subdomain: string, levelNames: string[]): Promise<SchoolLevelSetting> {
    const school = await this.schoolRepo.findOneOrFail({
      where: { subdomain },
      relations: ['levelSettings'],
    });
  
    const levels = await this.levelRepo
      .createQueryBuilder("level")
      .where("LOWER(level.name) IN (:...names)", {
        names: levelNames.map((name) => name.toLowerCase()),
      })
      .getMany();
  
    if (!levels.length) {
      throw new Error('No levels found with the provided names.');
    }
  
    // De-duplicate by name
    const uniqueLevels = Object.values(
      levels.reduce((acc, level) => {
        acc[level.name.toLowerCase()] = level;
        return acc;
      }, {} as Record<string, Level>)
    );
  
    // Remove old settings
    await this.settingRepo.delete({ school: { schoolId: school.schoolId } });
  
    const setting = this.settingRepo.create({
      school,
      selectedLevels: uniqueLevels,
    });
  
    return this.settingRepo.save(setting);
  }
  
}
