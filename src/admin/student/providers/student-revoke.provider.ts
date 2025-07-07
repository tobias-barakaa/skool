import { InjectRepository } from "@nestjs/typeorm";
import { Student } from "../entities/student.entity";
import { Repository } from "typeorm";
import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { MembershipRole, UserTenantMembership } from "src/admin/user-tenant-membership/entities/user-tenant-membership.entity";
import { ActiveUserData } from "src/admin/auth/interface/active-user.interface";

@Injectable()
export class UsersCreateStudentProvider {

  constructor(

        @InjectRepository(Student)
        private studentRepository: Repository<Student>,

        @InjectRepository(UserTenantMembership)
        private membershipRepository: Repository<UserTenantMembership>
  ) {}


async revokeStudent(studentId: string, currentUser: ActiveUserData): Promise<{ message: string }> {
  const membership = await this.membershipRepository.findOne({
    where: {
      userId: currentUser.sub,
      tenantId: currentUser.tenantId,
      role: MembershipRole.SCHOOL_ADMIN,
    },
  });

  if (!membership) {
    throw new ForbiddenException('Only school admins can revoke students');
  }

  const student = await this.studentRepository.findOne({
    where: { id: studentId },
    relations: ['user'],
  });

  if (!student) {
    throw new NotFoundException('Student not found');
  }

  student.isActive = false;
  await this.studentRepository.save(student);

  return { message: 'Student revoked successfully' };
}


}
