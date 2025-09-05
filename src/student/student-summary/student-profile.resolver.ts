import { Resolver, Query, Args, ObjectType, Field, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Student } from 'src/admin/student/entities/student.entity';
import { StudentProfileService } from './student-profile.service';
import { Roles } from 'src/iam/decorators/roles.decorator';
import { MembershipRole } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { HostelAssignment } from 'src/admin/hostels/entities/hostel.assignment';
import { TransportRoute } from 'src/admin/transport/entities/transport_routes.entity';
import { TransportAssignment } from 'src/admin/transport/entities/transport_assignment.entity';
import { Scholarship } from 'src/admin/scholarships/entities/scholarship.entity';


@ObjectType()
class AcademicSummary {
  @Field()
  totalAssessments: number;

  @Field()
  averageScore: number;

  @Field({ nullable: true })
  currentGrade?: string;

  @Field({ nullable: true })
  currentStream?: string;

  @Field()
  feesOwed: number;

  @Field()
  totalFeesPaid: number;

  @Field({ nullable: true })
  schoolType?: string;
}

@ObjectType()
class StudentAcademicProfile {
  @Field(() => Student)
  student: Student;

  @Field(() => AcademicSummary)
  academicSummary: AcademicSummary;
}

@ObjectType()
class HostelService {
  @Field()
  isAssigned: boolean;

  @Field(() => [HostelAssignment], { nullable: true })
  assignments?: HostelAssignment[];
}

@ObjectType()
class TransportService {
  @Field()
  isAssigned: boolean;

  @Field(() => TransportRoute, { nullable: true })
  route?: TransportRoute;

  @Field({ nullable: true })
  pickupPoint?: string;

  @Field(() => [TransportAssignment], { nullable: true })
  assignments?: TransportAssignment[];
}

@ObjectType()
class ScholarshipService {
  @Field()
  hasScholarship: boolean;

  @Field(() => Scholarship, { nullable: true })
  currentScholarship?: Scholarship;

  @Field(() => [Scholarship], { nullable: true })
  scholarshipHistory?: Scholarship[];
}

@ObjectType()
class StudentServices {
  @Field(() => HostelService)
  hostel: HostelService;

  @Field(() => TransportService)
  transport: TransportService;

  @Field(() => ScholarshipService)
  scholarship: ScholarshipService;
}

@ObjectType()
class StudentServicesProfile {
  @Field(() => Student)
  student: Student;

  @Field(() => StudentServices)
  services: StudentServices;
}

@Resolver(() => Student)
export class StudentProfileResolver {
  constructor(private readonly studentProfileService: StudentProfileService) {}

  @Query(() => Student, { 
    name: 'myStudentProfile',
    description: 'Get the complete student profile for the currently authenticated student' 
  })
  @Roles(MembershipRole.STUDENT)
  async getMyStudentProfile(
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<Student> {
    return this.studentProfileService.getStudentProfile(currentUser.sub);
  }

  @Query(() => Student, { 
    name: 'studentProfileById',
    description: 'Get student profile by ID (only accessible by the student themselves)' 
  })
  @Roles(MembershipRole.STUDENT)
  async getStudentProfileById(
    @Args('studentId', { type: () => ID }) studentId: string,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<Student> {
    return this.studentProfileService.getStudentById(studentId, currentUser.sub);
  }

  @Query(() => StudentAcademicProfile, { 
    name: 'myAcademicProfile',
    description: 'Get academic summary and profile for the currently authenticated student' 
  })
  @Roles(MembershipRole.STUDENT)
  async getMyAcademicProfile(
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<StudentAcademicProfile> {
    return this.studentProfileService.getStudentAcademicSummary(currentUser.sub);
  }

  @Query(() => StudentServicesProfile, { 
    name: 'myStudentServices',
    description: 'Get all services (hostel, transport, scholarship) for the currently authenticated student' 
  })
  @Roles(MembershipRole.STUDENT)
  async getMyStudentServices(
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<StudentServicesProfile> {
    return this.studentProfileService.getStudentServices(currentUser.sub);
  }
}
