import { Module } from "@nestjs/common";
import { AssignmentModule } from "./assignment/assignment.module";
import { StudentProfileService } from "./student-summary/student-profile.service";
import { StudentProfileResolver } from "./student-summary/student-profile.resolver";
import { StudentSummaryModule } from "./student-summary/student-summary.module";

@Module({
  providers: [
    
  
  ],
  exports: [],
  imports: [AssignmentModule, StudentSummaryModule]
})
export class StudentPortalModule {}