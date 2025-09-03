import { Module } from "@nestjs/common";
import { AssignmentModule } from "./assignment/assignment.module";

@Module({
  providers: [
  
  ],
  exports: [],
  imports: [AssignmentModule]
})
export class StudentPortalModule {}