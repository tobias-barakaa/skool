import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransportService } from './transport.service';
import { TransportResolver } from './transport.resolver';
import { TransportRoute } from './entities/transport_routes.entity';
import { TransportAssignment } from './entities/transport_assignment.entity';
import { StudentModule } from '../student/student.module';

@Module({
  imports: [TypeOrmModule.forFeature([TransportRoute, TransportAssignment]), StudentModule],
  providers: [TransportService, TransportResolver],
  exports: [TransportService],
})
export class TransportModule {}
