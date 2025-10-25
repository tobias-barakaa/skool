import { Module } from "@nestjs/common";
import { AssignmentModule } from "./assignment/assignment.module";
import { StudentProfileService } from "./student-summary/student-profile.service";
import { StudentProfileResolver } from "./student-summary/student-profile.resolver";
import { StudentSummaryModule } from "./student-summary/student-summary.module";
import { ChatResolver } from "src/messaging/chat.resolver";
import { MessagingModule } from "src/messaging/messaging.module";
import { StudentChatService } from "./chat/chat.service";
import { StudentChatResolver } from "./chat/chat.resolver";
import { StudentModule } from "src/admin/student/student.module";
import { TeacherModule } from "src/admin/teacher/teacher.module";
import { StudentNotesModule } from "./notes/student-notes.module";

@Module({
  providers: [StudentChatService, StudentChatResolver],
  exports: [],
  imports: [AssignmentModule, StudentSummaryModule, MessagingModule, StudentModule, TeacherModule, StudentNotesModule],
})
export class StudentPortalModule {}
