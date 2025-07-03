import { SetMetadata } from '@nestjs/common';

export const SKIP_TENANT_VALIDATION_KEY = 'skipTenantValidation';
export const SkipTenantValidation = () => SetMetadata(SKIP_TENANT_VALIDATION_KEY, true);