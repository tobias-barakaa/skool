// ==================== ENTITIES ====================

// invoice.entity.ts


// invoice-item.entity.ts

// payment.entity.ts

// ==================== DTOs ====================

// create-invoice.input.ts


// create-payment.input.ts


// ==================== SERVICE ====================

// invoice.service.ts

// ==================== RESOLVER ====================

// invoice.resolver.ts


// ==================== MODULE ====================

// // invoice.module.ts
// import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { InvoiceService } from './invoice.service';
// import { InvoiceResolver } from './invoice.resolver';
// import { Invoice } from './entities/invoice.entity';
// import { InvoiceItem } from './entities/invoice-item.entity';
// import { Payment } from './entities/payment.entity';
// import { Student } from 'src/admin/students/entities/student.entity';
// import { Term } from 'src/admin/academic_years/entities/terms.entity';
// import { StudentFeeAssignment } from 'src/admin/fee-assignment/entities/student_fee_assignments.entity';
// import { StudentFeeItem } from 'src/admin/fee-assignment/entities/student_fee_items.entity';

// @Module({
//   imports: [
//     TypeOrmModule.forFeature([
//       Invoice,
//       InvoiceItem,
//       Payment,
//       Student,
//       Term,
//       StudentFeeAssignment,
//       StudentFeeItem,
//     ]),
//   ],
//   providers: [InvoiceResolver, InvoiceService],
//   exports: [InvoiceService],
// })
// export class InvoiceModule {}

// ==================== USAGE EXAMPLES ====================

/*
# Generate invoices for a single student
mutation {
  generateInvoices(input: {
    studentId: "student-uuid-here"
    termId: "1d6ad218-8c82-4a98-b6d7-10a7c323cf21"
    issueDate: "2024-09-01"
    dueDate: "2024-12-15"
    notes: "Term 1 fees"
  }) {
    id
    invoiceNumber
    student { id name }
    term { id name }
    totalAmount
    balanceAmount
    status
    items {
      id
      feeBucket { name }
      amount
    }
  }
}

# Generate invoices for specific grade levels
mutation {
  generateInvoices(input: {
    termId: "1d6ad218-8c82-4a98-b6d7-10a7c323cf21"
    tenantGradeLevelIds: ["e6089d87-047a-47ef-b917-6d5eec607516"]
    issueDate: "2024-09-01"
    dueDate: "2024-12-15"
  }) {
    id
    invoiceNumber
    student { id name }
    totalAmount
    status
  }
}

# Generate invoices for ALL students in the tenant
mutation {
  generateInvoices(input: {
    termId: "1d6ad218-8c82-4a98-b6d7-10a7c323cf21"
  }) {
    id
    invoiceNumber
    student { id name }
    totalAmount
  }
}

# Record a payment
mutation {
  createPayment(input: {
    invoiceId: "invoice-uuid-here"
    amount: 5000.00
    paymentMethod: MPESA
    transactionReference: "QXR123456"
    paymentDate: "2024-09-15"
    notes: "First installment"
  }) {
    id
    receiptNumber
    amount
    paymentMethod
    invoice {
      invoiceNumber
      balanceAmount
      status
    }
  }
}

# Get invoices for a student
query {
  invoicesByStudent(studentId: "student-uuid-here") {
    id
    invoiceNumber
    term { name }
    totalAmount
    paidAmount
    balanceAmount
    status
    items {
      feeBucket { name }
      amount
    }
    payments {
      receiptNumber
      amount
      paymentDate
    }
  }
}

# Get single invoice
query {
  invoice(id: "invoice-uuid-here") {
    id
    invoiceNumber
    student { name }
    term { name }
    academicYear { name }
    totalAmount
    paidAmount
    balanceAmount
    status
    items {
      feeBucket { name }
      amount
    }
    payments {
      receiptNumber
      amount
      paymentMethod
      paymentDate
      receivedByUser { name }
    }
  }
}

# Get all invoices for tenant
query {
  invoices {
    id
    invoiceNumber
    student { name }
    term { name }
    totalAmount
    balanceAmount
    status
    issueDate
    dueDate
  }
}
*/

// ==================== ADDITIONAL UPDATES NEEDED ====================

/*
UPDATE student_fee_assignments table to add hasInvoice column:
ALTER TABLE student_fee_assignments ADD COLUMN has_invoice BOOLEAN DEFAULT FALSE;

UPDATE StudentFeeAssignment entity to include:
*/

// student_fee_assignments.entity.ts - ADD THIS FIELD


// @Field({ description: 'Indicates if invoice has been generated for this assignment' })
// @Column({ default: false })
// hasInvoice: boolean;