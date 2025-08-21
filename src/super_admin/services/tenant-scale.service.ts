// import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import Redis from 'ioredis';
// import { DEFAULT_SCALE_CONFIGS, ScaleTier } from 'src/admin/tenants/dtos/scale-dto';
// import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
// import { Repository } from 'typeorm';
// import { TenantScaleInfo, UpdateTenantScaleInput } from '../dtos/test-dto';
// import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';

// @Injectable()
// export class TenantScaleService {
//   constructor(
//     @InjectRepository(Tenant) private readonly tenantRepo: Repository<Tenant>,
//     @Inject('REDIS_CLIENT') private readonly redis: Redis,
//   ) {}

//   async getTenantScaleConfig(tenantId: string): Promise<ScaleConfig> {
//     // Check cache first
//     const cacheKey = `tenant_scale:${tenantId}`;
//     const cached = await this.redis.get(cacheKey);

//     if (cached) {
//       return JSON.parse(cached);
//     }

//     // Fetch from database
//     const tenant = await this.tenantRepo.findOne({
//       where: { id: tenantId },
//       select: ['scaleTier', 'scaleConfig'],
//     });

//     if (!tenant) {
//       throw new BadRequestException('Tenant not found');
//     }

//     // Merge default config with tenant-specific overrides
//     const defaultConfig =
//       DEFAULT_SCALE_CONFIGS[tenant.scaleTier || ScaleTier.SMALL];
//     const effectiveConfig = { ...defaultConfig, ...tenant.scaleConfig };

//     // Cache for fast access (5 minute TTL)
//     await this.redis.setex(cacheKey, 300, JSON.stringify(effectiveConfig));

//     return effectiveConfig;
//   }

//   async updateTenantScale(
//     input: UpdateTenantScaleInput,
//     adminUser: ActiveUserData,
//   ): Promise<TenantScaleInfo> {
//     // Verify admin permissions (implement your admin check logic)
//     if (!this.isSuperAdmin(adminUser)) {
//       throw new ForbiddenException('Super Admin access required');
//     }

//     const tenant = await this.tenantRepo.findOne({
//       where: { id: input.tenantId },
//     });

//     if (!tenant) {
//       throw new BadRequestException('Tenant not found');
//     }

//     // Update tenant scale configuration
//     tenant.scaleTier = input.scaleTier;
//     tenant.scaleConfig = input.customConfig || {};

//     const updatedTenant = await this.tenantRepo.save(tenant);

//     // Invalidate cache
//     const cacheKey = `tenant_scale:${input.tenantId}`;
//     await this.redis.del(cacheKey);

//     // Return effective configuration
//     const effectiveConfig = await this.getTenantScaleConfig(input.tenantId);

//     return {
//       tenantId: input.tenantId,
//       scaleTier: updatedTenant.scaleTier,
//       effectiveConfig,
//       lastUpdated: new Date(),
//     };
//   }

//   private isSuperAdmin(user: ActiveUserData): boolean {
//     // Implement your super admin check logic
//     return (
//       user.role === 'SUPER_ADMIN' ||
//       user.permissions?.includes('MANAGE_TENANT_SCALE')
//     );
//   }
// }
