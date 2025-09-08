import { SetMetadata } from '@nestjs/common';

export const SKIP_SCHOOL_CONFIG_KEY = 'skipSchoolConfigCheck';
export const SkipSchoolConfig = () => SetMetadata(SKIP_SCHOOL_CONFIG_KEY, true);