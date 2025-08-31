import { Field, ID, ObjectType } from "@nestjs/graphql";
import { TenantGradeLevel } from "src/admin/school-type/entities/tenant-grade-level";
import { TenantSubject } from "src/admin/school-type/entities/tenant-specific-subject";
import { TenantStream } from "src/admin/school-type/entities/tenant-stream";
import { ClassTeacherAssignment } from "../entities/class_teacher_assignments.entity";

@ObjectType()
export class TeacherType {
  @Field(() => ID) id: string;
  @Field() fullName: string;
  @Field() email: string;

  @Field(() => [TenantSubject])
  tenantSubjects: TenantSubject[];

  @Field(() => [TenantGradeLevel])
  tenantGradeLevels: TenantGradeLevel[];

  @Field(() => [TenantStream])
  tenantStreams: TenantStream[];

  @Field(() => [ClassTeacherAssignment])
  classTeacherAssignments: ClassTeacherAssignment[];
}
