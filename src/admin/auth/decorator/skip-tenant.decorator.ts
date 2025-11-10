import { SetMetadata } from '@nestjs/common';
import { SKIP_TENANT_KEY } from '../constants/auth.constants';

/**
 * Skip tenant validation for this route
 * Use for routes accessible without tenant context
 */
export const SkipTenant = () => SetMetadata(SKIP_TENANT_KEY, true);