import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { ScholarshipsService } from './scholarships.service';
import { Scholarship } from './entities/scholarship.entity';
import { CreateScholarshipInput } from './dtos/create-scholarship.input';
import { UpdateScholarshipInput } from './dtos/update-scholarship.input';

@Resolver(() => Scholarship)
export class ScholarshipsResolver {
  constructor(private readonly scholarshipsService: ScholarshipsService) {}

  @Mutation(() => Scholarship)
  createScholarship(@Args('input') input: CreateScholarshipInput) {
    return this.scholarshipsService.create(input);
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
