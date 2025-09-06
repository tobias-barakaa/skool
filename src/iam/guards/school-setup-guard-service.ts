import { SetMetadata } from '@nestjs/common';

export const SkipSchoolConfigCheck = () => SetMetadata('skipSchoolConfigCheck', true);