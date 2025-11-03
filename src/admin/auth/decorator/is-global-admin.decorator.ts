import { SetMetadata } from '@nestjs/common';

export const IS_GLOBAL_ADMIN_KEY = 'isGlobalAdmin';
export const IsGlobalAdmin = () => SetMetadata(IS_GLOBAL_ADMIN_KEY, true);
