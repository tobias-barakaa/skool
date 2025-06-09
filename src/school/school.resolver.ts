// src/school/school.resolver.ts
import { Resolver, Query, Mutation, Args, ID, Context } from '@nestjs/graphql';
import { School } from './entities/school.entity';
import { SchoolService } from './providers/school.service';

@Resolver(() => School)
export class SchoolResolver {
  constructor(private readonly schoolService: SchoolService) {}

  @Query(() => School, { name: 'mySchoolProfile' })
  async getMySchoolProfile(
  ) {
    // A school admin can only see their own school's profile
    
  }

 
}