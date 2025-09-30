// ============================================================================
// PAYMENT RESOLVER - Complete CRUD Operations
// ============================================================================

// ============================================================================
// RECEIPT RESOLVER
// ============================================================================


// ============================================================================
// LEDGER RESOLVER
// ============================================================================


// ============================================================================
// INPUT DTOs
// ============================================================================


// ============================================================================
// RECEIPT ENTITY
// ============================================================================

// ============================================================================
// LEDGER ENTITIES
// ============================================================================


// ============================================================================
// PAYMENT SERVICE - Enhanced with Update & Delete
// ============================================================================


// ============================================================================
// RECEIPT SERVICE
// ============================================================================



// ============================================================================
// LEDGER SERVICE
// ============================================================================



// ============================================================================
// GRAPHQL MUTATIONS & QUERIES DOCUMENTATION
// ============================================================================

/*
# ============================================================================
# PAYMENT MUTATIONS
# ============================================================================

# Create a new payment
mutation CreatePayment {
  createPayment(input: {
    invoiceId: "abc-123-def-456"
    amount: 15000.00
    paymentMethod: MPESA
    transactionReference: "QRT123456789"
    paymentDate: "2024-09-15T10:30:00Z"
    notes: "Term 1 fees - partial payment"
  }) {
    id
    receiptNumber
    amount
    paymentMethod
    transactionReference
    paymentDate
    notes
    invoice {
      id
      invoiceNumber
      totalAmount
      paidAmount
      balanceAmount
      status
    }
    student {
      id
      admission_number
      user {
        name
        email
      }
    }
    receivedByUser {
      id
      name
    }
    createdAt
  }
}

# Update an existing payment
mutation UpdatePayment {
  updatePayment(
    id: "payment-id-here"
    input: {
      amount: 16000.00
      transactionReference: "QRT123456790"
      notes: "Updated payment amount"
    }
  ) {
    id
    receiptNumber
    amount
    paymentMethod
    transactionReference
    notes
    invoice {
      invoiceNumber
      balanceAmount
      status
    }
    updatedAt
  }
}




# Void a payment (soft delete - reverses invoice updates)
mutation VoidPayment {
  voidPayment(
    id: "payment-id-here"
    reason: "Duplicate payment entry"
  )
}

# Permanently delete a payment (admin only)
mutation DeletePayment {
  deletePayment(id: "payment-id-here")
}

# ============================================================================
# PAYMENT QUERIES
# ============================================================================

# Get a single payment by ID
query GetPayment {
  payment(id: "payment-id-here") {
    id
    receiptNumber
    amount
    paymentMethod
    transactionReference
    paymentDate
    notes
    invoice {
      id
      invoiceNumber
      totalAmount
      balanceAmount
    }
    student {
      id
      admission_number
      user {
        name
        email
      }
    }
    receivedByUser {
      name
    }
  }
}




# Get all payments with filters
query GetAllPayments {
  payments(filters: {
    studentId: "student-id-here"
    paymentMethod: MPESA
    startDate: "2024-01-01"
    endDate: "2024-12-31"
  }) {
    id
    receiptNumber
    amount
    paymentMethod
    paymentDate
    student {
      admission_number
      user {
        name
      }
    }
    invoice {
      invoiceNumber
    }
  }
}

# Get payments for a specific student
query GetStudentPayments {
  paymentsByStudent(studentId: "student-id-here") {
    id
    receiptNumber
    amount
    paymentMethod
    paymentDate
    invoice {
      invoiceNumber
      term {
        name
      }
      academicYear {
        name
      }
    }
  }
}

# Get payments for a specific invoice
query GetInvoicePayments {
  paymentsByInvoice(invoiceId: "invoice-id-here") {
    id
    receiptNumber
    amount
    paymentMethod
    paymentDate
    transactionReference
    receivedByUser {
      name
    }
  }
}

# ============================================================================
# RECEIPT QUERIES & MUTATIONS
# ============================================================================

# Get receipt by payment ID
query GetReceiptByPayment {
  receiptByPayment(paymentId: "payment-id-here") {
    id
    receiptNumber
    type
    amount
    receiptDate
    payment {
      paymentMethod
      transactionReference
    }
    student {
      admission_number
      user {
        name
        email
      }
      grade {
        shortName
      }
    }
  }
}

# Get receipt by receipt number
query GetReceiptByNumber {
  receiptByNumber(receiptNumber: "RCP-2024-000123") {
    id
    receiptNumber
    type
    amount
    receiptDate
    pdfUrl
    payment {
      paymentMethod
      invoice {
        invoiceNumber
        term {
          name
        }
      }
    }
    student {
      admission_number
      user {
        name
      }
    }
  }
}

# Get all receipts for a student
query GetStudentReceipts {
  receiptsByStudent(studentId: "student-id-here") {
    id
    receiptNumber
    type
    amount
    receiptDate
    payment {
      paymentMethod
      invoice {
        invoiceNumber
      }
    }
  }
}

# Generate PDF receipt
mutation GenerateReceiptPDF {
  generateReceiptPDF(paymentId: "payment-id-here")
}

# Email receipt to parent/student
mutation EmailReceipt {
  emailReceipt(
    paymentId: "payment-id-here"
    emailAddress: "parent@example.com"
  )
}

# ============================================================================
# LEDGER QUERIES & MUTATIONS
# ============================================================================

# Get complete student ledger
query GetStudentLedger {
  studentLedger(
    studentId: "student-id-here"
    dateRange: {
      startDate: "2024-01-01"
      endDate: "2024-12-31"
    }
  ) {
    studentId
    student {
      admission_number
      user {
        name
        email
      }
      grade {
        shortName
      }
    }
    entries {
      date
      description
      reference
      debit
      credit
      balance
      invoiceNumber
      receiptNumber
    }
    summary {
      totalInvoiced
      totalPaid
      totalBalance
      invoiceCount
      paymentCount
      lastPaymentDate
      averagePaymentAmount
    }
    generatedAt
    dateRangeStart
    dateRangeEnd
  }
}

# Get ledger entries only
query GetLedgerEntries {
  ledgerEntries(
    studentId: "student-id-here"
    dateRange: {
      startDate: "2024-09-01"
      endDate: "2024-12-31"
    }
  ) {
    date
    description
    reference
    debit
    credit
    balance
    invoiceNumber
    receiptNumber
  }
}

# Get ledger summary
query GetLedgerSummary {
  ledgerSummary(studentId: "student-id-here") {
    totalInvoiced
    totalPaid
    totalBalance
    invoiceCount
    paymentCount
    lastPaymentDate
    averagePaymentAmount
  }
}

# Get ledgers for entire grade level
query GetGradeLevelLedgers {
  ledgersByGradeLevel(
    gradeLevelId: "grade-level-id-here"
    dateRange: {
      startDate: "2024-01-01"
      endDate: "2024-12-31"
    }
  ) {
    studentId
    student {
      admission_number
      user {
        name
      }
    }
    summary {
      totalInvoiced
      totalPaid
      totalBalance
    }
    entries {
      date
      description
      balance
    }
  }
}

# Generate ledger PDF report
mutation GenerateLedgerPDF {
  generateLedgerPDF(
    studentId: "student-id-here"
    dateRange: {
      startDate: "2024-01-01"
      endDate: "2024-12-31"
    }
  )
}

# ============================================================================
# COMPLETE WORKFLOW EXAMPLES
# ============================================================================

# Example 1: Record payment and get updated invoice status
mutation RecordPaymentWithInvoiceUpdate {
  createPayment(input: {
    invoiceId: "inv-123"
    amount: 25000.00
    paymentMethod: BANK_TRANSFER
    transactionReference: "BNK20240915001"
    paymentDate: "2024-09-15"
    notes: "Full payment for Term 1"
  }) {
    id
    receiptNumber
    amount
    invoice {
      invoiceNumber
      totalAmount
      paidAmount
      balanceAmount
      status
      term {
        name
      }
    }
    student {
      admission_number
      user {
        name
      }
    }
  }
}

# Example 2: Complete payment flow with receipt
mutation PaymentWithReceipt {
  createPayment(input: {
    invoiceId: "inv-456"
    amount: 15000.00
    paymentMethod: MPESA
    transactionReference: "MPESA123"
  }) {
    id
    receiptNumber
    amount
  }
}

query {
  receiptByPayment(paymentId: "payment-id-from-above") {
    receiptNumber
    amount
    receiptDate
    student {
      user {
        name
        email
      }
    }
  }
}

# Example 3: Get complete financial picture for a student
query StudentFinancialSummary {
  student: studentLedger(studentId: "student-123") {
    student {
      admission_number
      user {
        name
      }
    }
    summary {
      totalInvoiced
      totalPaid
      totalBalance
      invoiceCount
      paymentCount
      lastPaymentDate
    }
  }
  
  invoices: invoicesByStudent(studentId: "student-123") {
    invoiceNumber
    totalAmount
    balanceAmount
    status
    term {
      name
    }
  }
  
  payments: paymentsByStudent(studentId: "student-123") {
    receiptNumber
    amount
    paymentMethod
    paymentDate
  }
}

# Example 4: Partial payment scenario
mutation PartialPayment {
  createPayment(input: {
    invoiceId: "inv-789"
    amount: 10000.00
    paymentMethod: CASH
    notes: "First installment - balance to follow"
  }) {
    receiptNumber
    amount
    invoice {
      invoiceNumber
      totalAmount
      paidAmount
      balanceAmount
      status  # Should be PARTIALLY_PAID
    }
  }
}

# Example 5: Generate student statement
query GenerateStudentStatement {
  ledger: studentLedger(
    studentId: "student-123"
    dateRange: {
      startDate: "2024-01-01"
      endDate: "2024-12-31"
    }
  ) {
    student {
      admission_number
      user {
        name
        email
      }
      grade {
        shortName
      }
    }
    entries {
      date
      description
      reference
      debit
      credit
      balance
    }
    summary {
      totalInvoiced
      totalPaid
      totalBalance
    }
  }
}

# Example 6: Bulk payment reporting
query PaymentReport {
  payments(filters: {
    startDate: "2024-09-01"
    endDate: "2024-09-30"
    paymentMethod: MPESA
  }) {
    receiptNumber
    amount
    paymentDate
    transactionReference
    student {
      admission_number
      user {
        name
      }
      grade {
        shortName
      }
    }
    invoice {
      invoiceNumber
      term {
        name
      }
    }
  }
}

# ============================================================================
# ERROR HANDLING EXAMPLES
# ============================================================================

# Payment exceeds balance - will throw error
mutation PaymentExceedsBalance {
  createPayment(input: {
    invoiceId: "inv-123"
    amount: 999999.00  # More than balance
    paymentMethod: CASH
  }) {
    id
  }
}
# Error: Payment amount (999999) exceeds balance amount (25000)

# Update voided payment - will throw error
mutation UpdateVoidedPayment {
  updatePayment(
    id: "voided-payment-id"
    input: { amount: 5000.00 }
  ) {
    id
  }
}
# Error: Cannot update voided payment

# Invalid invoice ID
mutation InvalidInvoice {
  createPayment(input: {
    invoiceId: "non-existent-id"
    amount: 5000.00
    paymentMethod: CASH
  }) {
    id
  }
}
# Error: Invoice with id non-existent-id not found

*/