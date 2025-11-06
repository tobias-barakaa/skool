import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { HostelService } from './hostel.service';
import { CreateHostelInput } from './dtos/create-hostel.input';
import { Hostel } from './entities/hostel.entity';
import { UpdateHostelInput } from './dtos/update-hostel.input';
import { ActiveUserData } from '../auth/interface/active-user.interface';
import { ActiveUser } from '../auth/decorator/active-user.decorator';
import { HostelAssignment } from './entities/hostel.assignment';
import { CreateHostelAssignmentInput } from './dtos/create-hostel-assignment.input';
import { UpdateHostelAssignmentInput } from './dtos/upsate-hostel-assignment.input';

@Resolver(() => Hostel)
export class HostelResolver {
  constructor(private readonly hostelService: HostelService) {}

  @Mutation(() => Hostel)
  createHostel(
    @Args('input') input: CreateHostelInput,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.hostelService.create(input, user);
  }

@Query(() => [Hostel])
findAllHostels(@ActiveUser() user: ActiveUserData) {
  return this.hostelService.findAll(user);
}

  @Query(() => Hostel)
  hostel(@Args('id') id: string) {
    return this.hostelService.findOne(id);
  }

  @Mutation(() => Hostel)
  updateHostel(@Args('input') input: UpdateHostelInput) {
    return this.hostelService.update(input);
  }

  @Mutation(() => Boolean)
  removeHostel(@Args('id') id: string) {
    return this.hostelService.remove(id);
  }

  // HOSTEL ASSIGNMENT RESOLVERS EBELOW

  @Mutation(() => HostelAssignment)
  assignStudentToHostel(
    @Args('input') input: CreateHostelAssignmentInput,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.hostelService.assignStudent(input, user);
  }

  @Mutation(() => HostelAssignment)
  updateHostelAssignment(
    @Args('input') input: UpdateHostelAssignmentInput,
  ) {
    return this.hostelService.updateAssignment(input);
  }

  @Mutation(() => Boolean)
  removeHostelAssignment(@Args('id', { type: () => String }) id: string) {
    return this.hostelService.removeAssignment(id);
  }

  @Query(() => [HostelAssignment])
  hostelAssignments(
    @Args('hostelId') hostelId: string,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.hostelService.getAssignmentsByHostel(hostelId, user);
  }
}
