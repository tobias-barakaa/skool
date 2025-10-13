import { Module } from "@nestjs/common";
import { AssignmentModule } from "./assignment/assignment.module";
import { StudentProfileService } from "./student-summary/student-profile.service";
import { StudentProfileResolver } from "./student-summary/student-profile.resolver";
import { StudentSummaryModule } from "./student-summary/student-summary.module";
import { ChatResolver } from "src/messaging/chat.resolver";
import { StudentChatProvider } from "./chat/providers/chat.provider";
import { StudentChatResolver } from "./chat/chat.resolver";
import { StudentChatService } from "./chat/chat.service";

@Module({
  providers: [
    StudentChatResolver,
    StudentChatProvider,
    StudentChatService,
  ],
  exports: [],
  imports: [AssignmentModule, StudentSummaryModule]
})
export class StudentPortalModule {}
