import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HostelService } from './hostel.service';
import { HostelResolver } from './hostel.resolver';
import { Hostel } from './entities/hostel.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Hostel])],
  providers: [HostelService, HostelResolver],
  exports: [HostelService],
})
export class HostelModule {}
