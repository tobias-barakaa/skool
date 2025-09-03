import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { TransportService } from './transport.service';
import { TransportRoute } from './entities/transport_routes.entity';
import { TransportAssignment } from './entities/transport_assignment.entity';
import { CreateTransportRouteInput } from './dtos/create-transport-route.input';
import { UpdateTransportRouteInput } from './dtos/update-transport-route.input';
import { AssignTransportInput } from './dtos/assign-transport.input';
import { UpdateTransportAssignmentInput } from './dtos/update-transport-assignment.input';
import { ActiveUserData } from '../auth/interface/active-user.interface';
import { ActiveUser } from '../auth/decorator/active-user.decorator';

@Resolver()
export class TransportResolver {
  constructor(private readonly transportService: TransportService) {}

  @Mutation(() => TransportRoute)
createTransportRoute(
  @Args('input') input: CreateTransportRouteInput,
  @ActiveUser() user: ActiveUserData,
) {
  return this.transportService.createRoute(
    { ...input, tenantId: user.tenantId } as CreateTransportRouteInput,
    user.tenantId,
  );
}

  @Mutation(() => TransportRoute)
  updateTransportRoute(
    @Args('input') input: UpdateTransportRouteInput,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.transportService.updateRoute(input, user.tenantId);
  }

  @Mutation(() => Boolean)
  deleteTransportRoute(
    @Args('id', { type: () => ID }) id: string,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.transportService.deleteRoute(id, user.tenantId);
  }

  @Query(() => [TransportRoute])
  transportRoutes(@ActiveUser() user: ActiveUserData) {
    return this.transportService.findRoutesByTenant(user.tenantId);
  }

  // ---- Assignments
  @Mutation(() => TransportAssignment)
  assignTransport(
    @Args('input') input: AssignTransportInput,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.transportService.assignTransport(input, user.tenantId);
  }

  @Mutation(() => TransportAssignment)
  updateTransportAssignment(
    @Args('input') input: UpdateTransportAssignmentInput,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.transportService.updateAssignment(input, user.tenantId);
  }

  @Mutation(() => Boolean)
  unassignTransport(
    @Args('id', { type: () => ID }) id: string,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.transportService.unassignById(id, user.tenantId);
  }

  @Query(() => [TransportAssignment])
  transportAssignmentsByRoute(
    @Args('routeId', { type: () => ID }) routeId: string,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.transportService.getAssignmentsByRoute(routeId, user.tenantId);
  }

  @Query(() => [TransportAssignment])
  transportAssignmentsByStudent(
    @Args('studentId', { type: () => ID }) studentId: string,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.transportService.getAssignmentsByStudent(studentId, user.tenantId);
  }
}
