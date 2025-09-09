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

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FeeBucket,
      FeeStructure,
      FeeAssignment,
      FeeStructureItem,

    ]),
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