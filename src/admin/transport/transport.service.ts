import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransportRoute } from './entities/transport_routes.entity';
import { TransportBus } from './entities/transport_buses.entity';
import { CreateTransportRouteInput } from './dtos/create-transport-route.input';
import { UpdateTransportRouteInput } from './dtos/update-transport-route.input';
import { CreateTransportBusInput } from './dtos/create-transport-bus.input';
import { UpdateTransportBusInput } from './dtos/update-transport-bus.input';

@Injectable()
export class TransportService {
  constructor(
    @InjectRepository(TransportRoute)
    private routeRepo: Repository<TransportRoute>,

    @InjectRepository(TransportBus)
    private busRepo: Repository<TransportBus>,
  ) {}

  // --- ROUTE CRUD ---
  async createRoute(input: CreateTransportRouteInput): Promise<TransportRoute> {
    const route = this.routeRepo.create(input);
    return this.routeRepo.save(route);
  }

  async updateRoute(input: UpdateTransportRouteInput): Promise<TransportRoute> {
    const route = await this.routeRepo.findOne({ where: { id: input.id } });
    if (!route) throw new NotFoundException('Route not found');
    Object.assign(route, input);
    return this.routeRepo.save(route);
  }

  async deleteRoute(id: string): Promise<boolean> {
    const result = await this.routeRepo.delete(id);
    return typeof result.affected === 'number' && result.affected > 0;
  }

  async findRoutesByTenant(tenantId: string): Promise<TransportRoute[]> {
    return this.routeRepo.find({
      where: { tenantId },
      relations: ['buses'],
    });
  }

  // --- BUS CRUD ---
  async createBus(input: CreateTransportBusInput): Promise<TransportBus> {
    const bus = this.busRepo.create({
      ...input,
      route: { id: input.routeId } as TransportRoute,
    });
    return this.busRepo.save(bus);
  }

  async updateBus(input: UpdateTransportBusInput): Promise<TransportBus> {
    const bus = await this.busRepo.findOne({ where: { id: input.id } });
    if (!bus) throw new NotFoundException('Bus not found');
    Object.assign(bus, {
      ...input,
      route: input.routeId ? ({ id: input.routeId } as TransportRoute) : bus.route,
    });
    return this.busRepo.save(bus);
  }

  async deleteBus(id: string): Promise<boolean> {
    const result = await this.busRepo.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async findBusesByRoute(routeId: string): Promise<TransportBus[]> {
    return this.busRepo.find({
      where: { route: { id: routeId } },
      relations: ['route', 'assignments'],
    });
  }
}
