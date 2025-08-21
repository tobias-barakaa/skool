// import {  Args, Mutation, Resolver, Query } from '@nestjs/graphql';
// import { TenantScaleService } from '../services/tenant-scale.service';
// import { TenantScaleInfo, UpdateTenantScaleInput } from '../dtos/test-dto';
// import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
// import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
// import { ForbiddenException } from '@nestjs/common';

// @Resolver()
// export class SuperAdminScaleResolver {
//   constructor(private readonly tenantScaleService: TenantScaleService) {}

//   @Mutation(() => TenantScaleInfo)
//   async updateTenantScale(
//     @Args('input') input: UpdateTenantScaleInput,
//     @ActiveUser() currentUser: ActiveUserData,
//   ): Promise<TenantScaleInfo> {
//     return this.tenantScaleService.updateTenantScale(input, currentUser);
//   }

//   @Query(() => [TenantScaleInfo])
//   async getTenantScales(
//     @Args('tenantIds', { type: () => [String] }) tenantIds: string[],
//     @ActiveUser() currentUser: ActiveUserData,
//   ): Promise<TenantScaleInfo[]> {
//     // Verify super admin permissions
//     if (!this.isSuperAdmin(currentUser)) {
//       throw new ForbiddenException('Super Admin access required');
//     }

//     const results = [];
//     for (const tenantId of tenantIds) {
//       const config =
//         await this.tenantScaleService.getTenantScaleConfig(tenantId);
//       // Fetch tenant info and return scale info
//       results.push({
//         tenantId,
//         scaleTier: config.scaleTier,
//         effectiveConfig: config,
//         lastUpdated: new Date(),
//       });
//     }

//     return results;
//   }

//   private isSuperAdmin(user: ActiveUserData): boolean {
//     return (
//       user.role === 'SUPER_ADMIN' ||
//       user.permissions?.includes('MANAGE_TENANT_SCALE')
//     );
//   }
// }
