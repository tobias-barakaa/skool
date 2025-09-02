import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { TransportService } from './transport.service';
import { TransportRoute } from './entities/transport_routes.entity';
import { CreateTransportRouteInput } from './dtos/create-transport-route.input';
import { UpdateTransportRouteInput } from './dtos/update-transport-route.input';
import { TransportBus } from './entities/transport_buses.entity';
import { CreateTransportBusInput } from './dtos/create-transport-bus.input';
import { UpdateTransportBusInput } from './dtos/update-transport-bus.input';

@Resolver()
export class TransportResolver {
  constructor(private readonly transportService: TransportService) {}

  // --- ROUTE ---
  @Mutation(() => TransportRoute)
  createTransportRoute(@Args('input') input: CreateTransportRouteInput) {
    return this.transportService.createRoute(input);
  }

  @Mutation(() => TransportRoute)
  updateTransportRoute(@Args('input') input: UpdateTransportRouteInput) {
    return this.transportService.updateRoute(input);
  }

  @Mutation(() => Boolean)
  deleteTransportRoute(@Args('id', { type: () => ID }) id: string) {
    return this.transportService.deleteRoute(id);
  }

  @Query(() => [TransportRoute])
  transportRoutes(@Args('tenantId') tenantId: string) {
    return this.transportService.findRoutesByTenant(tenantId);
  }

  // --- BUS ---
  @Mutation(() => TransportBus)
  createTransportBus(@Args('input') input: CreateTransportBusInput) {
    return this.transportService.createBus(input);
  }

  @Mutation(() => TransportBus)
  updateTransportBus(@Args('input') input: UpdateTransportBusInput) {
    return this.transportService.updateBus(input);
  }

  @Mutation(() => Boolean)
  deleteTransportBus(@Args('id', { type: () => ID }) id: string) {
    return this.transportService.deleteBus(id);
  }

  @Query(() => [TransportBus])
  transportBuses(@Args('routeId', { type: () => ID }) routeId: string) {
    return this.transportService.findBusesByRoute(routeId);
  }
}
