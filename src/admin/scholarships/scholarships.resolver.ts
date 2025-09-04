import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { ScholarshipsService } from './scholarships.service';
import { Scholarship } from './entities/scholarship.entity';
import { CreateScholarshipInput } from './dtos/create-scholarship.input';
import { UpdateScholarshipInput } from './dtos/update-scholarship.input';
import { ActiveUserData } from '../auth/interface/active-user.interface';
import { ActiveUser } from '../auth/decorator/active-user.decorator';

@Resolver(() => Scholarship)
export class ScholarshipsResolver {
  constructor(private readonly scholarshipsService: ScholarshipsService) {}

  // @Mutation(() => Scholarship)
  // createScholarship(
  //   @ActiveUser() user: ActiveUserData,   // 👈 inject logged-in user
  //   @Args('input') input: CreateScholarshipInput,
  // ) {
  //   return this.scholarshipsService.create(input, user.tenantId);
  // }


  @Mutation(() => Scholarship)
createScholarship(
  @ActiveUser() user: ActiveUserData,  
  @Args('input') input: CreateScholarshipInput,
) {
  return this.scholarshipsService.create(input, user.tenantId);
}

  

  @Query(() => [Scholarship])
  scholarships() {
    return this.scholarshipsService.findAll();
  }

  @Query(() => Scholarship)
  scholarship(@Args('id', { type: () => ID }) id: string) {
    return this.scholarshipsService.findOne(id);
  }

  @Mutation(() => Scholarship)
  updateScholarship(@Args('input') input: UpdateScholarshipInput) {
    return this.scholarshipsService.update(input);
  }

  @Mutation(() => Boolean)
  removeScholarship(@Args('id', { type: () => ID }) id: string) {
    return this.scholarshipsService.remove(id);
  }
}
