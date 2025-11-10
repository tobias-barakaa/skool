import { SetMetadata } from '@nestjs/common';
import { SKIP_SCHOOL_CONFIG_KEY } from '../constants/auth.constants';

/**
 * Skip school configuration check
 * Use for setup routes or super admin routes
 */
export const SkipSchoolConfig = () => SetMetadata(SKIP_SCHOOL_CONFIG_KEY, true);
