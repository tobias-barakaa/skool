import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

export class SchoolAlreadyConfiguredException extends ConflictException {
  constructor() {
    super('School is already configured with levels');
  }
}

export class InvalidLevelsException extends BadRequestException {
  constructor(missingLevels: string[]) {
    super(`The following levels were not found: ${missingLevels.join(', ')}`);
  }
}

export class MixedSchoolTypesException extends BadRequestException {
  constructor() {
    super('All selected levels must belong to the same school type');
  }
}

export class TenantNotFoundException extends NotFoundException {
  constructor(tenantId: string) {
    super(`Tenant with ID ${tenantId} not found`);
  }
}
