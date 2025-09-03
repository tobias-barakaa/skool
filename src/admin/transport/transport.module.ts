// src/admin/transport/transport.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransportService } from './transport.service';
import { TransportResolver } from './transport.resolver';
import { TransportRoute } from './entities/transport_routes.entity';
import { TransportAssignment } from './entities/transport_assignment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TransportRoute, TransportAssignment])],
  providers: [TransportService, TransportResolver],
  exports: [TransportService],
})
export class TransportModule {}
