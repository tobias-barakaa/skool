import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeeStructure } from '../entities/fee-structure.entity';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { ComprehensiveFeeStructureSummary } from './dtos/comprehensive-assignment.dto';
import { FeeStructureSummaryByTenant } from './dtos/summary-tenant.dto';
import { FeeStructureSummaryByGradeLevel } from './dtos/summary-gradelevel.dto';
import { FeeStructureSummaryByAcademicYear } from './dtos/summary-by-academic-year.dto';
import { FeeStructureSummaryByFeeBucket } from './dtos/summary-by-fee-bucket.dto';

@Injectable()
export class FeeStructureSummaryService {
  constructor(
    @InjectRepository(FeeStructure)
    private feeStructureRepository: Repository<FeeStructure>,
  ) {}

  async getComprehensiveSummary(user: ActiveUserData): Promise<ComprehensiveFeeStructureSummary> {
    const [tenantSummary, gradeLevelSummaries, academicYearSummaries, feeBucketSummaries] = 
      await Promise.all([
        this.getTenantSummary(user),
        this.getGradeLevelSummaries(user),
        this.getAcademicYearSummaries(user),
        this.getFeeBucketSummaries(user),
      ]);

    return {
      tenantSummary,
      gradeLevelSummaries,
      academicYearSummaries,
      feeBucketSummaries,
    };
  }

  async getTenantSummary(user: ActiveUserData): Promise<FeeStructureSummaryByTenant> {
    const feeStructures = await this.feeStructureRepository
      .createQueryBuilder('fs')
      .leftJoinAndSelect('fs.academicYear', 'ay')
      .leftJoinAndSelect('fs.terms', 'terms')
      .leftJoinAndSelect('fs.gradeLevels', 'gl')
      .leftJoinAndSelect('fs.items', 'items')
      .leftJoinAndSelect('items.feeBucket', 'fb')
      .where('fs.tenantId = :tenantId', { tenantId: user.tenantId })
      .andWhere('fs.isActive = :isActive', { isActive: true })
      .getMany();

    const uniqueAcademicYears = new Set<string>();
    const uniqueTerms = new Set<string>();
    const uniqueFeeBuckets = new Set<string>();
    const uniqueGradeLevels = new Set<string>();
    
    let totalMandatoryAmount = 0;
    let totalOptionalAmount = 0;
    let totalFeeItems = 0;

    feeStructures.forEach(fs => {
      uniqueAcademicYears.add(fs.academicYear.name);
      
      fs.terms?.forEach(term => uniqueTerms.add(term.name));
      fs.gradeLevels?.forEach(gl => uniqueGradeLevels.add(gl.id));
      
      fs.items?.forEach(item => {
        totalFeeItems++;
        uniqueFeeBuckets.add(item.feeBucket.name);
        
        if (item.isMandatory) {
          totalMandatoryAmount += Number(item.amount);
        } else {
          totalOptionalAmount += Number(item.amount);
        }
      });
    });

    if(!user.tenantId) {
      throw new Error('Tenant ID is missing from the active user');
    }
    return {
      tenantId: user.tenantId,
      totalFeeStructures: feeStructures.length,
      totalGradeLevels: uniqueGradeLevels.size,
      totalMandatoryAmount,
      totalOptionalAmount,
      grandTotalAmount: totalMandatoryAmount + totalOptionalAmount,
      totalFeeItems,
      uniqueAcademicYears: Array.from(uniqueAcademicYears),
      uniqueTerms: Array.from(uniqueTerms),
      uniqueFeeBuckets: Array.from(uniqueFeeBuckets),
    };
  }

  async getGradeLevelSummaries(user: ActiveUserData): Promise<FeeStructureSummaryByGradeLevel[]> {
    const feeStructures = await this.feeStructureRepository
      .createQueryBuilder('fs')
      .leftJoinAndSelect('fs.academicYear', 'ay')
      .leftJoinAndSelect('fs.terms', 'terms')
      .leftJoinAndSelect('fs.gradeLevels', 'gl')
      .leftJoinAndSelect('gl.gradeLevel', 'grade')
      .leftJoinAndSelect('fs.items', 'items')
      .where('fs.tenantId = :tenantId', { tenantId: user.tenantId })
      .andWhere('fs.isActive = :isActive', { isActive: true })
      .getMany();

    const gradeLevelMap = new Map<string, {
      id: string;
      name: string;
      feeStructures: Set<string>;
      mandatoryAmount: number;
      optionalAmount: number;
      itemCount: number;
      academicYears: Set<string>;
      terms: Set<string>;
    }>();

    feeStructures.forEach(fs => {
      fs.gradeLevels?.forEach(gl => {
        if (!gradeLevelMap.has(gl.id)) {
          gradeLevelMap.set(gl.id, {
            id: gl.id,
            name: gl.gradeLevel.name,
            feeStructures: new Set(),
            mandatoryAmount: 0,
            optionalAmount: 0,
            itemCount: 0,
            academicYears: new Set(),
            terms: new Set(),
          });
        }

        const summary = gradeLevelMap.get(gl.id)!;
        summary.feeStructures.add(fs.id);
        summary.academicYears.add(fs.academicYear.name);
        fs.terms?.forEach(term => summary.terms.add(term.name));

        fs.items?.forEach(item => {
          summary.itemCount++;
          if (item.isMandatory) {
            summary.mandatoryAmount += Number(item.amount);
          } else {
            summary.optionalAmount += Number(item.amount);
          }
        });
      });
    });

    return Array.from(gradeLevelMap.values()).map(summary => ({
      gradeLevelId: summary.id,
      gradeLevelName: summary.name,
      totalFeeStructures: summary.feeStructures.size,
      totalMandatoryAmount: summary.mandatoryAmount,
      totalOptionalAmount: summary.optionalAmount,
      totalAmount: summary.mandatoryAmount + summary.optionalAmount,
      totalItems: summary.itemCount,
      academicYears: Array.from(summary.academicYears),
      terms: Array.from(summary.terms),
    }));
  }

  async getAcademicYearSummaries(user: ActiveUserData): Promise<FeeStructureSummaryByAcademicYear[]> {
    const feeStructures = await this.feeStructureRepository
      .createQueryBuilder('fs')
      .leftJoinAndSelect('fs.academicYear', 'ay')
      .leftJoinAndSelect('fs.terms', 'terms')
      .leftJoinAndSelect('fs.gradeLevels', 'gl')
      .leftJoinAndSelect('fs.items', 'items')
      .where('fs.tenantId = :tenantId', { tenantId: user.tenantId })
      .andWhere('fs.isActive = :isActive', { isActive: true })
      .getMany();

    const academicYearMap = new Map<string, {
      id: string;
      name: string;
      count: number;
      totalAmount: number;
      gradeLevels: Set<string>;
      terms: Set<string>;
    }>();

    feeStructures.forEach(fs => {
      if (!academicYearMap.has(fs.academicYearId)) {
        academicYearMap.set(fs.academicYearId, {
          id: fs.academicYearId,
          name: fs.academicYear.name,
          count: 0,
          totalAmount: 0,
          gradeLevels: new Set(),
          terms: new Set(),
        });
      }

      const summary = academicYearMap.get(fs.academicYearId)!;
      summary.count++;
      
      fs.gradeLevels?.forEach(gl => summary.gradeLevels.add(gl.id));
      fs.terms?.forEach(term => summary.terms.add(term.name));
      fs.items?.forEach(item => {
        summary.totalAmount += Number(item.amount);
      });
    });

    return Array.from(academicYearMap.values()).map(summary => ({
      academicYearId: summary.id,
      academicYearName: summary.name,
      totalFeeStructures: summary.count,
      totalAmount: summary.totalAmount,
      affectedGradeLevels: summary.gradeLevels.size,
      terms: Array.from(summary.terms),
    }));
  }

  async getFeeBucketSummaries(user: ActiveUserData): Promise<FeeStructureSummaryByFeeBucket[]> {
    const feeStructures = await this.feeStructureRepository
      .createQueryBuilder('fs')
      .leftJoinAndSelect('fs.items', 'items')
      .leftJoinAndSelect('items.feeBucket', 'fb')
      .where('fs.tenantId = :tenantId', { tenantId: user.tenantId })
      .andWhere('fs.isActive = :isActive', { isActive: true })
      .getMany();

    const feeBucketMap = new Map<string, {
      id: string;
      name: string;
      totalAmount: number;
      count: number;
      mandatoryCount: number;
      optionalCount: number;
    }>();

    feeStructures.forEach(fs => {
      fs.items?.forEach(item => {
        if (!feeBucketMap.has(item.feeBucket.id)) {
          feeBucketMap.set(item.feeBucket.id, {
            id: item.feeBucket.id,
            name: item.feeBucket.name,
            totalAmount: 0,
            count: 0,
            mandatoryCount: 0,
            optionalCount: 0,
          });
        }

        const summary = feeBucketMap.get(item.feeBucket.id)!;
        summary.totalAmount += Number(item.amount);
        summary.count++;
        
        if (item.isMandatory) {
          summary.mandatoryCount++;
        } else {
          summary.optionalCount++;
        }
      });
    });

    return Array.from(feeBucketMap.values()).map(summary => ({
      feeBucketId: summary.id,
      feeBucketName: summary.name,
      totalAmount: summary.totalAmount,
      usageCount: summary.count,
      mandatoryCount: summary.mandatoryCount,
      optionalCount: summary.optionalCount,
    }));
  }
}