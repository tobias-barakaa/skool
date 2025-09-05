import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { StudentProfileService } from "./student-profile.service";
import { StudentProfileResolver } from "./student-profile.resolver";

import { Student } from "src/admin/student/entities/student.entity";
import { User } from "src/admin/users/entities/user.entity";
import { UserTenantMembership } from "src/admin/user-tenant-membership/entities/user-tenant-membership.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Student, User, UserTenantMembership]),
  ],
  providers: [
    StudentProfileService,
    StudentProfileResolver,
  ],
  exports: [StudentProfileService], 
})
export class StudentSummaryModule {}
