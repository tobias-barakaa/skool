import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { TransportService } from './transport.service';
import { TransportRoute } from './entities/transport_routes.entity';
import { TransportAssignment } from './entities/transport_assignment.entity';
import { CreateTransportRouteInput } from './dtos/create-transport-route.input';
import { UpdateTransportRouteInput } from './dtos/update-transport-route.input';
import { AssignTransportInput } from './dtos/assign-transport.input';
import { ActiveUserData } from '../auth/interface/active-user.interface';
import { ActiveUser } from '../auth/decorator/active-user.decorator';
import { MembershipRole } from '../user-tenant-membership/entities/user-tenant-membership.entity';
import { Roles } from 'src/iam/decorators/roles.decorator';
import { BulkTransportAssignmentInput } from './dtos/bulk-assign-transport.input';
import { CreateTransportAssignmentInput } from './dtos/transport-assign.input';
import { UpdateTransportAssignmentInput } from './dtos/update-assignment-transport.input';

@Resolver()
@Roles(MembershipRole.SCHOOL_ADMIN)
export class TransportResolver {
  constructor(private readonly transportService: TransportService) {}

  @Mutation(() => TransportRoute)
  async createTransportRoute(
    @Args('input') input: CreateTransportRouteInput,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.transportService.createRoute(input, user.tenantId);
  }
  

  @Mutation(() => TransportRoute)
  updateTransportRoute(
    @Args('input') input: UpdateTransportRouteInput,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.transportService.updateRoute(input, user.tenantId);
  }
  

  @Mutation(() => Boolean)
removeTransportRoute(
  @Args('id', { type: () => String }) id: string,
  @ActiveUser() user: ActiveUserData,
) {
  return this.transportService.removeRoute(id, user.tenantId);
}


@Query(() => [TransportRoute])
transportRoutes(@ActiveUser() user: ActiveUserData) {
  return this.transportService.findAllRoutes(user.tenantId);
}


  @Mutation(() => Boolean)
  deleteTransportRoute(
    @Args('id', { type: () => ID }) id: string,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.transportService.deleteRoute(id, user.tenantId);
  }

  // @Query(() => [TransportRoute])
  // transportRoutes(@ActiveUser() user: ActiveUserData) {
  //   return this.transportService.findRoutesByTenant(user.tenantId);
  // }


  @Mutation(() => TransportAssignment)
async assignStudentToRoute(
  @Args('input') input: AssignTransportInput,
  @ActiveUser() user: ActiveUserData,
) {
 const existing = await this.transportService.assignTransportStudent(input, user.tenantId);
 return existing;
}

  @Mutation(() => [TransportAssignment])
  assignStudentsToRoute(
    @Args('input') input: BulkTransportAssignmentInput,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.transportService.assignBulkTransportStudents(input, user.tenantId);
  }

  // @Mutation(() => [BulkTransportAssignmentInput])
  // bulkAssignStudentsToRoute(
  //   @Args('input') input: BulkTransportAssignmentInput,
  //   @ActiveUser() user: ActiveUserData,
  // ) {
  //   return this.transportService.assignBulkTransportStudents(input, user.tenantId);
  // }


  @Mutation(() => [TransportAssignment])
bulkAssignStudentsToRoute(
  @Args('input') input: BulkTransportAssignmentInput,
  @ActiveUser() user: ActiveUserData,
) {
  return this.transportService.assignBulkTransportStudents(input, user.tenantId);
}

  @Mutation(() => TransportAssignment)
  updateTransportAssignment(
    @Args('input') input: UpdateTransportAssignmentInput,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.transportService.updateAssignment(input, user.tenantId);
  }

  @Query(() => [TransportAssignment])
  getAssignmentsByRoute(
    @Args('routeId') routeId: string,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.transportService.getAssignmentsByRoute(routeId, user.tenantId);
  }
}
