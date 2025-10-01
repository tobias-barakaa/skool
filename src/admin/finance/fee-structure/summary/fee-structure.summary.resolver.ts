import { Resolver, Query } from '@nestjs/graphql';
import { FeeStructureSummaryService } from './fee-structure.summary.service';
import { ComprehensiveFeeStructureSummary } from './dtos/comprehensive-assignment.dto';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { FeeStructureSummaryByTenant } from './dtos/summary-tenant.dto';
import { FeeStructureSummaryByGradeLevel } from './dtos/summary-gradelevel.dto';
import { FeeStructureSummaryByAcademicYear } from './dtos/summary-by-academic-year.dto';
import { FeeStructureSummaryByFeeBucket } from './dtos/summary-by-fee-bucket.dto';

@Resolver()
export class FeeStructureSummaryResolver {
  constructor(private readonly summaryService: FeeStructureSummaryService) {}

  @Query(() => ComprehensiveFeeStructureSummary, {
    name: 'comprehensiveFeeStructureSummary',
    description: 'Get comprehensive summary of all fee structures with breakdowns'
  })
  async getComprehensiveSummary(@ActiveUser() user: ActiveUserData) {
    return this.summaryService.getComprehensiveSummary(user);
  }

  @Query(() => FeeStructureSummaryByTenant, {
    name: 'feeStructureTenantSummary',
    description: 'Get tenant-wide fee structure summary'
  })
  async getTenantSummary(@ActiveUser() user: ActiveUserData) {
    return this.summaryService.getTenantSummary(user);
  }

  @Query(() => [FeeStructureSummaryByGradeLevel], {
    name: 'feeStructureGradeLevelSummaries',
    description: 'Get fee structure summaries grouped by grade level'
  })
  async getGradeLevelSummaries(@ActiveUser() user: ActiveUserData) {
    return this.summaryService.getGradeLevelSummaries(user);
  }

  @Query(() => [FeeStructureSummaryByAcademicYear], {
    name: 'feeStructureAcademicYearSummaries',
    description: 'Get fee structure summaries grouped by academic year'
  })
  async getAcademicYearSummaries(@ActiveUser() user: ActiveUserData) {
    return this.summaryService.getAcademicYearSummaries(user);
  }

  @Query(() => [FeeStructureSummaryByFeeBucket], {
    name: 'feeStructureFeeBucketSummaries',
    description: 'Get fee structure summaries grouped by fee bucket'
  })
  async getFeeBucketSummaries(@ActiveUser() user: ActiveUserData) {
    return this.summaryService.getFeeBucketSummaries(user);
  }
}