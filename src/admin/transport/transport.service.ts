import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TransportRoute } from './entities/transport_routes.entity';
import { TransportAssignment } from './entities/transport_assignment.entity';
import { CreateTransportRouteInput } from './dtos/create-transport-route.input';
import { UpdateTransportRouteInput } from './dtos/update-transport-route.input';
import { AssignTransportInput } from './dtos/assign-transport.input';
import { UpdateTransportAssignmentInput } from './dtos/update-transport-assignment.input';
import { Student } from '../student/entities/student.entity';

@Injectable()
export class TransportService {
  constructor(
    @InjectRepository(TransportRoute)
    private routeRepo: Repository<TransportRoute>,

    @InjectRepository(TransportAssignment)
    private assignmentRepo: Repository<TransportAssignment>,

    private readonly dataSource: DataSource,
  ) {}

  // ---------------- Routes
  async createRoute(input: Omit<CreateTransportRouteInput, 'tenantId'>, tenantId: string): Promise<TransportRoute> {
    const route = this.routeRepo.create({ ...input, tenantId });
    return this.routeRepo.save(route);
  }

  async updateRoute(input: UpdateTransportRouteInput, tenantId: string): Promise<TransportRoute> {
    const route = await this.routeRepo.findOne({ where: { id: input.id, tenantId } });
    if (!route) throw new NotFoundException('Route not found');
    if (typeof input.name !== 'undefined') route.name = input.name;
    if (typeof input.fee !== 'undefined') route.fee = input.fee;
    return this.routeRepo.save(route);
  }

  async deleteRoute(id: string, tenantId: string): Promise<boolean> {
    const res = await this.routeRepo.delete({ id, tenantId });
    return (res.affected ?? 0) > 0;
  }

  async findRoutesByTenant(tenantId: string): Promise<TransportRoute[]> {
    return this.routeRepo.find({ where: { tenantId } });
  }

  // ---------------- Assignments
  async assignTransport(input: AssignTransportInput, tenantId: string): Promise<TransportAssignment> {
    
    // Validate student belongs to tenant
    const student = await this.dataSource.manager.findOne(Student, {
      where: { id: input.studentId, tenant_id: tenantId },
      relations: ['user'],
    });
    if (!student) {
      throw new BadRequestException('Student not found or not in this tenant');
    }

    // Validate route belongs to tenant
    const route = await this.routeRepo.findOne({ where: { id: input.routeId, tenantId } });
    if (!route) {
      throw new BadRequestException('Route not found or not in this tenant');
    }

    // Ensure student has at most 1 ACTIVE assignment
    const existingActive = await this.assignmentRepo.findOne({
      where: { studentId: input.studentId, tenantId, status: 'ACTIVE' as any },
    });
    if (existingActive) {
      throw new BadRequestException('Student already has an active transport assignment. Unassign first or update it.');
    }

    const assignment = this.assignmentRepo.create({
      tenantId,
      route,
      routeId: route.id,
      student,
      studentId: student.id,
      pickupPoint: input.pickupPoint,
      status: 'ACTIVE',
    });
    const saved = await this.assignmentRepo.save(assignment);

    return this.assignmentRepo.findOne({
      where: { id: saved.id },
      relations: ['route', 'student', 'student.user'],
    }) as Promise<TransportAssignment>;
  }

  async updateAssignment(input: UpdateTransportAssignmentInput, tenantId: string): Promise<TransportAssignment> {
    const assignment = await this.assignmentRepo.findOne({
      where: { id: input.id, tenantId },
      relations: ['route', 'student', 'student.user'],
    });
    if (!assignment) throw new NotFoundException('Assignment not found');

    if (typeof input.pickupPoint !== 'undefined') assignment.pickupPoint = input.pickupPoint;

    if (typeof input.status !== 'undefined') {
      assignment.status = input.status;
      if (input.status === 'INACTIVE' && !assignment.vacatedAt) {
        assignment.vacatedAt = new Date();
      }
      if (input.status === 'ACTIVE') {
        assignment.vacatedAt = undefined;
      }
    }

    return this.assignmentRepo.save(assignment);
  }

  async unassignById(id: string, tenantId: string): Promise<boolean> {
    const assignment = await this.assignmentRepo.findOne({ where: { id, tenantId } });
    if (!assignment) return false;
    assignment.status = 'INACTIVE';
    assignment.vacatedAt = new Date();
    await this.assignmentRepo.save(assignment);
    return true;
  }

  async getAssignmentsByRoute(routeId: string, tenantId: string): Promise<TransportAssignment[]> {
    return this.assignmentRepo.find({
      where: { routeId, tenantId },
      relations: ['route', 'student', 'student.user'],
    });
  }

  async getAssignmentsByStudent(studentId: string, tenantId: string): Promise<TransportAssignment[]> {
    return this.assignmentRepo.find({
      where: { studentId, tenantId },
      relations: ['route', 'student', 'student.user'],
    });
  }
}
