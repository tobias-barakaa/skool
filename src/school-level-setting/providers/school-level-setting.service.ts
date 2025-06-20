// school-level-setting.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SchoolLevelSetting } from '../entities/school-level-setting.entity';
import { School } from '../../school/entities/school.entity';
import { Level } from '../../level/entities/level.entities';
import { BusinessException } from 'src/common/exceptions/business.exception';

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
    try {
      console.log('🔍 Starting configureLevelsByNames with:', { subdomain, levelNames });
      
      // Find the school by subdomain
      const school = await this.schoolRepo.findOne({ 
        where: { subdomain },
        relations: ['schoolType'] // Make sure to load the school type
      });

      console.log('🏫 Found school:', school ? { 
        id: school.schoolId, 
        name: school.schoolName, 
        subdomain: school.subdomain,
        schoolType: school.schoolType?.name 
      } : 'NOT FOUND');

      if (!school) {
        throw new BusinessException(
          `School with subdomain '${subdomain}' not found.`,
          'SCHOOL_NOT_FOUND'
        );
      }

      if (!school.schoolType) {
        throw new BusinessException(
          `School '${school.schoolName}' does not have a school type assigned.`,
          'NO_SCHOOL_TYPE'
        );
      }

      if (!levelNames || levelNames.length === 0) {
        throw new BusinessException(
          'At least one level name must be provided.',
          'NO_LEVELS_PROVIDED'
        );
      }

      console.log('🔍 Searching for levels with names:', levelNames);
      console.log('🎯 School type ID:', school.schoolType.id);

      // First, let's check what levels exist for this school type
      const allLevelsForSchoolType = await this.levelRepo.find({
        where: { schoolType: { id: school.schoolType.id } },
        relations: ['schoolType']
      });

      console.log('📚 All available levels for this school type:', 
        allLevelsForSchoolType.map(l => l.name)
      );

      // Find levels that belong to the school's curriculum type (school type)
      const levels = await this.levelRepo
        .createQueryBuilder("level")
        .leftJoinAndSelect("level.schoolType", "schoolType")
        .where("LOWER(level.name) IN (:...names)", {
          names: levelNames.map(name => name.toLowerCase()),
        })
        .andWhere("level.schoolTypeId = :schoolTypeId", {
          schoolTypeId: school.schoolType.id
        })
        .getMany();

      console.log('✅ Found matching levels:', levels.map(l => ({ id: l.id, name: l.name })));

    if (levels.length === 0) {
      throw new BusinessException(
        `No levels found with the provided names for ${school.schoolType.name} curriculum.`,
        'LEVELS_NOT_FOUND'
      );
    }

    // Check if all requested levels were found
    const foundLevelNames = levels.map(l => l.name.toLowerCase());
    const missingLevels = levelNames.filter(name => 
      !foundLevelNames.includes(name.toLowerCase())
    );

    if (missingLevels.length > 0) {
      throw new BusinessException(
        `The following levels are not available for ${school.schoolType.name} curriculum: ${missingLevels.join(', ')}`,
        'INVALID_LEVELS_SELECTED'
      );
    }

    // Find or create school level setting
    let setting = await this.settingRepo.findOne({
      where: { school: { schoolId: school.schoolId } },
      relations: ['selectedLevels', 'school', 'school.schoolType'],
    });

    if (setting) {
      // Update existing setting - replace selected levels
      setting.selectedLevels = levels;
      setting.updatedAt = new Date();
    } else {
      // Create new setting
      setting = this.settingRepo.create({
        school,
        selectedLevels: levels,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    const savedSetting = await this.settingRepo.save(setting);
    
    // Return with full relations loaded
    const result = await this.settingRepo.findOne({
      where: { id: savedSetting.id },
      relations: ['selectedLevels', 'school', 'school.schoolType'],
    });

    if (!result) {
      throw new BusinessException(
        `Failed to retrieve the saved school level setting.`,
        'SETTING_NOT_FOUND'
      );
    }

    return result;
  } catch (error) {
        console.error('❌ Error in configureLevelsByNames:', error);
        throw new BusinessException(
            `Failed to configure levels for school with subdomain '${subdomain}': ${error.message}`,
            'CONFIGURE_LEVELS_FAILED'
        );
    }
  }

  async getSchoolLevelConfiguration(subdomain: string): Promise<SchoolLevelSetting | null> {
    const school = await this.schoolRepo.findOne({ 
      where: { subdomain },
      relations: ['schoolType']
    });

    if (!school) {
      throw new BusinessException(
        `School with subdomain '${subdomain}' not found.`,
        'SCHOOL_NOT_FOUND'
      );
    }

    const setting = await this.settingRepo.findOne({
      where: { 
        school: { schoolId: school.schoolId },
        isActive: true 
      },
      relations: ['selectedLevels', 'school','selectedLevels.subjects', 'selectedLevels.gradeLevels','school.schoolType'],
    });

    return setting;
  }

  async getAvailableLevelsForSchool(subdomain: string): Promise<Level[]> {
    const school = await this.schoolRepo.findOne({ 
      where: { subdomain },
      relations: ['schoolType']
    });

    if (!school) {
      throw new BusinessException(
        `School with subdomain '${subdomain}' not found.`,
        'SCHOOL_NOT_FOUND'
      );
    }

    // Get all levels available for this school's curriculum type
    const availableLevels = await this.levelRepo.find({
      where: { schoolType: { id: school.schoolType.id } },
      relations: ['schoolType'],
      order: { name: 'ASC' }
    });

    return availableLevels;
  }

  async removeLevelFromSchool(subdomain: string, levelName: string): Promise<SchoolLevelSetting> {
    const setting = await this.getSchoolLevelConfiguration(subdomain);
    
    if (!setting) {
      throw new BusinessException(
        'No level configuration found for this school.',
        'NO_CONFIGURATION_FOUND'
      );
    }

    const updatedLevels = setting.selectedLevels.filter(
      level => level.name.toLowerCase() !== levelName.toLowerCase()
    );

    if (updatedLevels.length === setting.selectedLevels.length) {
      throw new BusinessException(
        `Level '${levelName}' is not currently selected for this school.`,
        'LEVEL_NOT_SELECTED'
      );
    }

    if (updatedLevels.length === 0) {
      throw new BusinessException(
        'Cannot remove the last level. At least one level must be configured.',
        'CANNOT_REMOVE_LAST_LEVEL'
      );
    }

    setting.selectedLevels = updatedLevels;
    setting.updatedAt = new Date();

    return this.settingRepo.save(setting);
  }
}