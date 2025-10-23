import { Module } from "@nestjs/common";
import { AssignmentModule } from "./assignment/assignment.module";
import { StudentProfileService } from "./student-summary/student-profile.service";
import { StudentProfileResolver } from "./student-summary/student-profile.resolver";
import { StudentSummaryModule } from "./student-summary/student-summary.module";
import { ChatResolver } from "src/messaging/chat.resolver";
import { MessagingModule } from "src/messaging/messaging.module";

@Module({
  providers: [],
  exports: [],
  imports: [AssignmentModule, StudentSummaryModule, MessagingModule],
})
export class StudentPortalModule {}
