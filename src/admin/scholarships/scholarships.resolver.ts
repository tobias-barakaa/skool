import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { ScholarshipsService } from './scholarships.service';
import { Scholarship } from './entities/scholarship.entity';
import { CreateScholarshipInput } from './dtos/create-scholarship.input';
import { UpdateScholarshipInput } from './dtos/update-scholarship.input';
import { ActiveUserData } from '../auth/interface/active-user.interface';
import { ActiveUser } from '../auth/decorator/active-user.decorator';
import { StudentScholarship } from './entities/scholarship_assignments.entity';
import { AssignScholarshipInput } from './dtos/assign-scholarship.input';
import { UpdateStudentScholarshipInput } from './dtos/update-student-scholarship.input';

@Resolver(() => Scholarship)
export class ScholarshipsResolver {
  constructor(private readonly scholarshipsService: ScholarshipsService) {}

 
  @Mutation(() => Scholarship)
createScholarship(
  @ActiveUser() user: ActiveUserData,  
  @Args('input') input: CreateScholarshipInput,
) {
  return this.scholarshipsService.create(input, user);
}

  
@Query(() => [Scholarship])
async scholarships(@ActiveUser() user: ActiveUserData) {
  return this.scholarshipsService.findAll(user);
}



  @Query(() => Scholarship)
  scholarship(@Args('id', { type: () => ID }) id: string) {
    return this.scholarshipsService.findOne(id);
  }

  @Mutation(() => Scholarship)
  async updateScholarship(
    @Args('input') input: UpdateScholarshipInput,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.scholarshipsService.update(input, user);
  }
  

  @Mutation(() => Boolean)
  removeScholarship(@Args('id', { type: () => ID }) id: string) {
    return this.scholarshipsService.remove(id);
  }



@Mutation(() => StudentScholarship)
async assignScholarship(
  @Args('input') input: AssignScholarshipInput,
  @ActiveUser() user: ActiveUserData,
) {
  return this.scholarshipsService.assignScholarship(input, user);
}

@Query(() => [StudentScholarship])
async studentScholarships(
  @Args('studentId', { type: () => String }) studentId: string,
  @ActiveUser() user: ActiveUserData,
) {
  return this.scholarshipsService.findAssignmentsByStudent(studentId, user);
}



@Query(() => [StudentScholarship])
async allStudentScholarships(@ActiveUser() user: ActiveUserData) {
  return this.scholarshipsService.findAllAssignments(user);
}

@Mutation(() => StudentScholarship)
async updateStudentScholarship(
  @Args('input') input: UpdateStudentScholarshipInput,
  @ActiveUser() user: ActiveUserData,
) {
  return this.scholarshipsService.updateAssignment(input, user);
}




@Mutation(() => Boolean)
async removeStudentScholarship(
  @Args('id') id: string,
  @ActiveUser() user: ActiveUserData,
) {
  return this.scholarshipsService.removeAssignment(id, user);
}

}
