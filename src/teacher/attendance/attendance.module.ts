import { Module } from '@nestjs/common';
import { AttendanceService } from './providers/attendance.service';
import { Attendance } from './entities/attendance.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentModule } from 'src/admin/student/student.module';
import { LevelModule } from 'src/admin/level/level.module';
import { UserTenantMembershipModule } from 'src/admin/user-tenant-membership/user-tenant-membership.module';
import { AttendanceResolver } from './attendance.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attendance]),
    StudentModule,
    LevelModule,
    UserTenantMembershipModule,
  ],
  providers: [AttendanceService, AttendanceResolver],
})
export class AttendanceModule {}
