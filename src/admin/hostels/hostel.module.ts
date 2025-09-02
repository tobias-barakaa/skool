import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HostelService } from './hostel.service';
import { HostelResolver } from './hostel.resolver';
import { Hostel } from './entities/hostel.entity';
import { HostelAssignment } from './entities/hostel.assignment';

@Module({
  imports: [TypeOrmModule.forFeature([Hostel,HostelAssignment])],
  providers: [HostelService, HostelResolver],
  exports: [HostelService],
})
export class HostelModule {}
