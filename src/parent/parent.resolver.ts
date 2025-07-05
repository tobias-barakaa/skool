// import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
// import { UseGuards } from '@nestjs/common';
// import { StudentSearchInput } from './dtos/search-student.dto';
// import { Student } from 'src/student/entities/student.entity';
// import { CreateParentInput } from './dtos/create-parent.dto';
// import { Parent } from './entities/parent.entity';
// import { AuthType } from 'src/auth/enums/auth-type.enum';
// import { Auth } from 'src/auth/decorator/auth.decorator';
// import { ParentService } from './providers/parent.service';
// import { ActiveUserData } from 'src/auth/interface/active-user.interface';
// import { ActiveUser } from 'src/auth/decorator/active-user.decorator';

// @Resolver(() => Parent)
// @Auth(AuthType.Bearer)
// export class ParentResolver {
//   constructor(private readonly parentService: ParentService) {}

//   @Mutation(() => Parent)
//   async createParent(
//     @Args('createParentInput') createParentInput: CreateParentInput,
//     @ActiveUser() currentUser: ActiveUserData,
//   ): Promise<Parent> {
//     return await this.parentService.createParent(createParentInput, currentUser.tenantId);
//   }

//   @Query(() => [Parent])
//   async parents(
//     @ActiveUser() currentUser: ActiveUserData,
//   ): Promise<Parent[]> {
//     return await this.parentService.findAllParents(currentUser.tenantId);
//   }

//   @Query(() => Parent)
//   async parent(
//     @Args('id', { type: () => ID }) id: string,
//     @ActiveUser() currentUser: ActiveUserData,
//   ): Promise<Parent> {
//     return await this.parentService.findParentById(id, currentUser.tenantId);
//   }

//   @Query(() => [Student])
//   async searchStudents(
//     @Args('searchInput') searchInput: StudentSearchInput,
//     @ActiveUser() currentUser: ActiveUserData,
//   ): Promise<Student[]> {
//     return await this.parentService.searchStudents(searchInput, currentUser.tenantId);
//   }

//   @Mutation(() => Parent)
//   async updateParent(
//     @Args('id', { type: () => ID }) id: string,
//     @Args('updateParentInput') updateParentInput: CreateParentInput,
//     @ActiveUser() currentUser: ActiveUserData,
//   ): Promise<Parent> {
//     return await this.parentService.updateParent(id, updateParentInput, currentUser.tenantId);
//   }

//   @Mutation(() => Boolean)
//   async deleteParent(
//     @Args('id', { type: () => ID }) id: string,
//     @ActiveUser() currentUser: ActiveUserData,
//   ): Promise<boolean> {
//     return await this.parentService.deleteParent(id, currentUser.tenantId);
//   }
// }
