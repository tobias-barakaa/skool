import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantService } from '../providers/tenants.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly tenantService: TenantService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const host = req.get('host');
    const subdomain = host?.split('.')[0];

    if (!subdomain || subdomain === 'www') {
      return res.status(400).json({ error: 'Invalid subdomain' });
    }

    const isValidTenant = await this.tenantService.validateTenant(subdomain);
    if (!isValidTenant) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    req['subdomain'] = subdomain;
    next();
  }
}