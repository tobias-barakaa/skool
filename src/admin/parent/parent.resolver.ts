import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { StudentSearchInput } from './dtos/search-student.dto';
import { CreateParentInvitationDto } from './dtos/create-parent.dto';
import { Parent } from './entities/parent.entity';
import { AuthType } from '../auth/enums/auth-type.enum';
import { Auth } from '../auth/decorator/auth.decorator';
import { ParentService } from './providers/parent.service';
import { ActiveUserData } from '../auth/interface/active-user.interface';
import { ActiveUser } from '../auth/decorator/active-user.decorator';
import { Student } from '../student/entities/student.entity';
import { InvitationResponse, StudentSearchResult } from './dtos/invitation-parent-response.dto';

// Enhanced Parent Resolver with invitation functionality
@Resolver(() => Parent)
@Auth(AuthType.Bearer)
export class ParentResolver {
  constructor(private readonly parentService: ParentService) {}

  // NEW MUTATION: Invite parent
  @Mutation(() => InvitationResponse)
  async inviteParent(
    @Args('createParentInvitationInput') createParentInvitationInput: CreateParentInvitationDto,
    @Args('tenantId') tenantId: string,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<InvitationResponse> {
    return await this.parentService.inviteParent(
      createParentInvitationInput,
      currentUser,
      tenantId,
    );
  }

  // EXISTING MUTATION: Create parent directly
  @Mutation(() => Parent)
  async createParent(
    @Args('createParentInput') createParentInput: CreateParentInput,
    @Args('tenantId') tenantId: string,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<Parent> {
    return await this.parentService.createParent(
      createParentInput,
      currentUser.tenantId,
    );
  }

  // EXISTING QUERY: Get all parents
  @Query(() => [Parent])
  async parents(@ActiveUser() currentUser: ActiveUserData): Promise<Parent[]> {
    return await this.parentService.findAllParents(currentUser.tenantId);
  }

  // EXISTING QUERY: Get parent by ID
  @Query(() => Parent)
  async parent(
    @Args('id', { type: () => ID }) id: string,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<Parent> {
    return await this.parentService.findParentById(id, currentUser.tenantId);
  }

  // EXISTING QUERY: Search students
  @Query(() => [Student])
  async searchStudents(
    @Args('searchInput') searchInput: StudentSearchInput,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<Student[]> {
    return await this.parentService.searchStudents(
      searchInput,
      currentUser.tenantId,
    );
  }

  // NEW QUERY: Advanced student search
  @Query(() => StudentSearchResult)
  async searchStudentsAdvanced(
    @Args('searchInput') searchInput: StudentSearchInput,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<StudentSearchResult> {
    return await this.parentService.searchStudentsAdvanced(
      searchInput,
      currentUser.tenantId,
    );
  }
}



  // @Mutation(() => Parent)
  // async updateParent(
  //   @Args('id', { type: () => ID }) id: string,
  //   @Args('updateParentInput') updateParentInput: CreateParentInput,
  //   @ActiveUser() currentUser: ActiveUserData,
  // ): Promise<Parent> {
  //   return await this.parentService.updateParent(id, updateParentInput, currentUser.tenantId);
  // }

  // @Mutation(() => Boolean)
  // async deleteParent(
  //   @Args('id', { type: () => ID }) id: string,
  //   @ActiveUser() currentUser: ActiveUserData,
  // ): Promise<boolean> {
  //   return await this.parentService.deleteParent(id, currentUser.tenantId);
  // }
