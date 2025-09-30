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
import { InvoiceResolver } from './invoice/invoice.resolver';
import { InvoiceService } from './invoice/invoice.service';
import { Invoice } from './invoice/entities/invoice.entity';
import { Payment } from './payment/entities/payment.entity';
import { FeeAssignmentGradeLevel } from './fee-assignment/entities/fee_assignment_grade_levels.entity';
import { InvoiceItem } from './invoice/entities/invoice.entity.item';
import { Receipt } from './receipt/receipt.entity';
import { PaymentService } from './payment/payment.service';
import { PaymentResolver } from './payment/payment.resolver';


@Module({
  imports: [
    TypeOrmModule.forFeature([
      FeeBucket,
      FeeStructure,
      FeeAssignment,
      FeeStructureItem,
      StudentFeeAssignment,
      StudentFeeItem,
      FeeAssignmentGradeLevel,
      Invoice,
      Payment,
      InvoiceItem,
      Receipt

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
    FeeStructureItemResolver,

    InvoiceResolver,
    InvoiceService,

    PaymentService,
    PaymentResolver

  ],
  exports: [
    FeeBucketService,
    FeeStructureService,
    FeeStructureItemService,
    FeeAssignmentService,
    InvoiceResolver,
    InvoiceService,

  ],
})
export class FeeManagementModule {}