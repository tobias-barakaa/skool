import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FeeBucket } from './fee-bucket/entities/fee-bucket.entity';
import { FeeStructure } from './fee-structure/entities/fee-structure.entity';
import { FeeStructureItem } from './fee-structure-item/entities/fee-structure-item.entity';
import { FeeAssignment } from './fee-assignment/entities/fee-assignment.entity';

import { FeeBucketService } from './fee-bucket/fee-bucket.service';
import { FeeStructureService } from './fee-structure/fee-structure.service';
import { FeeAssignmentService } from './fee-assignment/fee-assignment.service';

import { FeeBucketResolver } from './fee-bucket/fee-bucket.resolver';
import { FeeStructureResolver } from './fee-structure/fee-structure.resolver';
import { FeeAssignmentResolver } from './fee-assignment/fee-assignment.resolver';
import { FeeStructureItemService } from './fee-structure-item/fee-structure-item.service';
import { FeeStructureItemResolver } from './fee-structure-item/fee-structure-item.resolver';
import { StudentFeeAssignment } from './fee-assignment/entities/student_fee_assignments.entity';
import { StudentFeeItem } from './fee-assignment/entities/student_fee_items.entity';
import { StudentModule } from '../student/student.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FeeBucket,
      FeeStructure,
      FeeAssignment,
      FeeStructureItem,
      StudentFeeAssignment,
      StudentFeeItem

    ]),
    StudentModule
  ],
  providers: [
    FeeBucketService,
    FeeStructureService,
    FeeStructureItemService,
    FeeAssignmentService,
    
    FeeBucketResolver,
    FeeStructureResolver,
    FeeAssignmentResolver,
    FeeStructureItemResolver
  ],
  exports: [
    FeeBucketService,
    FeeStructureService,
    FeeStructureItemService,
    FeeAssignmentService,
  ],
})
export class FeeManagementModule {}