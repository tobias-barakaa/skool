// src/admin/transport/transport.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bus } from './entities/bus.entity';
import { TransportService } from './transport.service';
import { TransportResolver } from './transport.resolver';
import { TransportRoute } from './entities/transport_routes.entity';
import { TransportAssignment } from './entities/transport_assignment.entity';
import { TransportBus } from './entities/transport_buses.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TransportRoute, Bus, TransportAssignment, TransportBus])],
  providers: [TransportService, TransportResolver],
  exports: [TransportService],
})
export class TransportModule {}
