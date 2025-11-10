import { SetMetadata } from '@nestjs/common';
import { PUBLIC_ROUTE_KEY } from '../constants/auth.constants';

/**
 * Marks a route as public (no authentication required)
 * Equivalent to @Auth(AuthType.None)
 */
export const Public = () => SetMetadata(PUBLIC_ROUTE_KEY, true);