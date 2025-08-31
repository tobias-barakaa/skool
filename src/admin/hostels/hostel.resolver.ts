import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { HostelService } from './hostel.service';
import { CreateHostelInput } from './dtos/create-hostel.input';
import { Hostel } from './entities/hostel.entity';
import { UpdateHostelInput } from './dtos/update-hostel.input';
import { ActiveUserData } from '../auth/interface/active-user.interface';
import { ActiveUser } from '../auth/decorator/active-user.decorator';

@Resolver(() => Hostel)
export class HostelResolver {
  constructor(private readonly hostelService: HostelService) {}

  @Mutation(() => Hostel)
  createHostel(
    @Args('input') input: CreateHostelInput,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.hostelService.create(input, user.tenantId);
  }

  @Query(() => [Hostel])
  hostels(@Args('tenantId') tenantId: string) {
    return this.hostelService.findAll(tenantId);
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
}
