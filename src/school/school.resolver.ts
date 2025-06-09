// import { Resolver, Query, Mutation, Args, ID, Context } from '@nestjs/graphql';
// import { School } from './entities/school.entity';
// import { UseGuards } from '@nestjs/common';
// import { GqlAuthGuard } from '../auth/guards/gql-auth.guard'; // Use GqlAuthGuard for GraphQL context
// import { CurrentUser } from '../auth/decorators/current-user.decorator';
// import { SchoolsService } from './providers/school.service';

// @Resolver(() => School)
// export class SchoolResolver {
//   constructor(private readonly schoolService: SchoolsService) {}

//   @Query(() => School, { name: 'mySchoolProfile' })
//   @UseGuards(GqlAuthGuard) // Protect this query
// //   async getMySchoolProfile(
// //     @CurrentUser() user: JwtPayload,
// //   ): Promise<School> {
// //     // A school admin can only see their own school's profile
// //     //return this.schoolService.findOne(user.schoolId);
// //   }

//   @Mutation(() => School)
//   @UseGuards(GqlAuthGuard)
//   async updateMySchoolProfile(
//     @CurrentUser() user: JwtPayload,
//     @Args('updateSchoolInput') updateSchoolInput: UpdateSchoolInput,
//   ): Promise<School> {
//     // Ensure the ID being updated matches the user's schoolId
//     if (updateSchoolInput.id !== user.schoolId) {
//       throw new Error('You can only update your own school profile.');
//     }
//     return this.schoolService.update(updateSchoolInput.id, updateSchoolInput);
//   }
// }