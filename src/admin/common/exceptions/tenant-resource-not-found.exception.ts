export class TenantResourceNotFoundException extends Error {
    readonly response: { message: string; error: string; statusCode: number };
    readonly status = 400;
  
    constructor(
      resource: string,
      missingIds: string[],
      tenantId: string,
    ) {
      const ids = missingIds.join(', ');
      const message = `${resource}(s) with ID(s) ${ids} not found in tenant ${tenantId}`;
      super(message);
  
      this.response = {
        message,
        error: 'Bad Request',
        statusCode: 400,
      };
    }
  }

// import { BadRequestException } from '@nestjs/common';

// export class TenantResourceNotFoundException extends BadRequestException {
//   constructor(resourceType: string, missingIds: string[], tenantId: string) {
//     super(
//       `${resourceType}(s) with ID(s) ${missingIds.join(', ')} not found in tenant ${tenantId}`,
//     );
//   }
// }
