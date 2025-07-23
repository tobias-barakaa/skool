import { Resolver, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Parent } from 'src/admin/parent/entities/parent.entity';
import { TeacherParentsService } from './teacher-parents.service';
import { ParentStudent } from 'src/admin/parent/entities/parent-student.entity';
import { StudentWithParentsType } from 'src/teacher/students/dtos/student-with-parents.dto';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';

@Resolver(() => Parent)
// @UseGuards(TeacherAuthGuard, TenantGuard)
export class TeacherParentsResolver {
  constructor(private readonly teacherParentsService: TeacherParentsService) {}

  @Query(() => [Parent], { name: 'teacherGetParents' })
  async getParents(
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<Parent[]> {
    return await this.teacherParentsService.getParentsByTenant(
      currentUser.tenantId,
    );
  }

  @Query(() => [Parent], { name: 'teacherGetParentsByStudentId' })
  async getParentsByStudentId(
    @Args('studentId') studentId: string,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<Parent[]> {
    // console.log('Fetching parents for student ID:::::', currentUser);
    return await this.teacherParentsService.getParentsByStudentId(
      studentId,
      currentUser.tenantId,
    );
  }

  @Query(() => Parent, { name: 'teacherGetParentById', nullable: true })
  async getParentById(
    @Args('parentId') parentId: string,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<Parent | null> {
    return await this.teacherParentsService.getParentById(
      parentId,
      currentUser.tenantId,
    );
  }

  @Query(() => [ParentStudent], {
    name: 'teacherGetStudentParentRelationships',
  })
  async getStudentParentRelationships(
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<ParentStudent[]> {
    return await this.teacherParentsService.getStudentParentRelationships(
      currentUser.tenantId,
    );
  }

  @Query(() => Parent, {
    name: 'teacherGetPrimaryParentByStudentId',
    nullable: true,
  })
  async getPrimaryParentByStudentId(
    @Args('studentId') studentId: string,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<Parent | null> {
    return await this.teacherParentsService.getPrimaryParentByStudentId(
      studentId,
      currentUser.tenantId,
    );
  }

  @Query(() => [StudentWithParentsType], {
    name: 'teacherGetStudentsWithParents',
  })
  async getStudentsWithParents(
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<any[]> {
    return await this.teacherParentsService.getStudentsWithParents(
      currentUser.tenantId,
    );
  }
}

