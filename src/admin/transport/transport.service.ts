import { Injectable,Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { TransportRoute } from './entities/transport_routes.entity';
import { TransportAssignment } from './entities/transport_assignment.entity';
import { CreateTransportRouteInput } from './dtos/create-transport-route.input';
import { UpdateTransportRouteInput } from './dtos/update-transport-route.input';
import { AssignTransportInput, RemoveTransportAssignmentInput } from './dtos/assign-transport.input';
import { Student } from '../student/entities/student.entity';
import { Roles } from 'src/iam/decorators/roles.decorator';
import { MembershipRole } from '../user-tenant-membership/entities/user-tenant-membership.entity';
import { CreateTransportAssignmentInput } from './dtos/transport-assign.input';
import { BulkTransportAssignmentInput } from './dtos/bulk-assign-transport.input';
import { UpdateTransportAssignmentInput } from './dtos/update-assignment-transport.input';
import { In } from 'typeorm';


@Injectable()
export class TransportService {
  private readonly logger = new Logger(TransportService.name);
  constructor(
    @InjectRepository(TransportRoute)
    private routeRepo: Repository<TransportRoute>,

    @InjectRepository(TransportAssignment)
    private assignmentRepo: Repository<TransportAssignment>,

    @InjectRepository(Student)
    private studentRepo: Repository<Student>,

    private readonly dataSource: DataSource,
  ) {}

  async createRoute(input: CreateTransportRouteInput, tenantId: string): Promise<TransportRoute> {
    const existing = await this.routeRepo.findOne({
      where: { name: input.name, tenantId },
    });
  
    if (existing) {
      throw new ConflictException(`A transport route with the name "${input.name}" already exists.`);

    }
  
    const route = this.routeRepo.create({ ...input, tenantId });
    return this.routeRepo.save(route);
  }
  


  async updateRoute(input: UpdateTransportRouteInput, tenantId: string): Promise<TransportRoute> {
    const route = await this.routeRepo.findOne({
      where: { id: input.id, tenantId },
    });
  
    if (!route) {
      throw new NotFoundException('Transport route not found');
    }
  
    if (input.name !== undefined) route.name = input.name;
    if (input.fee !== undefined) route.fee = input.fee;
    if (input.billingCycleLabel !== undefined) route.billingCycleLabel = input.billingCycleLabel;
  
    return this.routeRepo.save(route);
  }
  
  async removeRoute(id: string, tenantId: string): Promise<boolean> {
    const result = await this.routeRepo.delete({ id, tenantId });
    return (result.affected ?? 0) > 0;
  }
  

  async deleteRoute(id: string, tenantId: string): Promise<boolean> {
    const res = await this.routeRepo.delete({ id, tenantId });
    return (res.affected ?? 0) > 0;
  }

  async findAllRoutes(tenantId: string): Promise<TransportRoute[]> {
    return this.routeRepo.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async findRoutesByTenant(tenantId: string): Promise<TransportRoute[]> {
    return this.routeRepo.find({ where: { tenantId } });
  }

  async findRoutes(tenantId: string): Promise<TransportRoute[]> {
    return this.routeRepo.find({
      where: { tenantId },
      relations: ['assignments', 'assignments.student', 'assignments.student.user'],
    });
  };


  async findAssignments(tenantId: string): Promise<TransportAssignment[]> {
    return this.assignmentRepo.find({
      where: { tenantId },
      relations: ['route', 'student', 'student.user'],
      order: { assignedAt: 'DESC' },
    });
  }
  
  async assignTransportStudent(
    input: AssignTransportInput,
    tenantId: string,
  ): Promise<TransportAssignment> {
    this.logger.debug('Starting single student assignment', { input, tenantId });
  
    const student = await this.studentRepo.findOne({
      where: { id: input.studentId, tenant_id: tenantId },
      relations: ['user'],
    });
    if (!student)
      throw new NotFoundException(
        `Student with ID ${input.studentId} not found in your organisation`,
      );
  
    const route = await this.routeRepo.findOne({
      where: { id: input.routeId, tenantId },
    });
    if (!route)
      throw new NotFoundException(
        `Transport route with ID ${input.routeId} not found in your organisation`,
      );
  
    const existing = await this.assignmentRepo.exist({
      where: {
        studentId: input.studentId,
        routeId: input.routeId,
        tenantId,
        status: 'ACTIVE',
      },
    });
    if (existing)
      throw new ConflictException(
        `Student ${student.user?.name ?? student.admission_number} is already assigned to route ${route.name}`,
      );
  
    // create & return … no try/catch needed
    const assignment = this.assignmentRepo.create({
      studentId: input.studentId,
      routeId: input.routeId,
      pickupPoint: input.pickupPoint,
      tenantId,
      status: 'ACTIVE',
    });
    const saved = await this.assignmentRepo.save(assignment);
  
    return this.assignmentRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.student', 's')
      .leftJoinAndSelect('s.user', 'u')
      .leftJoinAndSelect('a.route', 'r')
      .where('a.id = :id AND a.tenantId = :tenantId', { id: saved.id, tenantId })
      .getOneOrFail(); // throws EntityNotFoundError if somehow missing
  }

  
  async assignBulkTransportStudents(input: BulkTransportAssignmentInput, tenantId: string): Promise<TransportAssignment[]> {
    this.logger.debug('Starting bulk student assignment', { input, tenantId });

    try {
      // Validate route exists
      const route = await this.routeRepo.findOne({
        where: { id: input.routeId, tenantId }
      });

      if (!route) {
        throw new NotFoundException(`Transport route with ID ${input.routeId} not found in your organization`);
      }

      let students: Student[];
      if (input.studentIds && input.studentIds.length > 0) {
        students = await this.studentRepo.find({
          where: {
            id: In(input.studentIds),
            tenant_id: tenantId,
          },
          relations: ['user']
        });

        if (students.length !== input.studentIds.length) {
          const foundIds = students.map(s => s.id);
          const notFoundIds = input.studentIds.filter(id => !foundIds.includes(id));
          throw new NotFoundException(`Students not found: ${notFoundIds.join(', ')}`);
        }
      } else {
        students = await this.studentRepo.find({
          where: { tenant_id: tenantId },
          relations: ['user']
        });
      }

      if (students.length === 0) {
        throw new BadRequestException('No students found to assign');
      }

      const existingAssignments = await this.assignmentRepo.find({
        where: {
          routeId: input.routeId,
          studentId: In(students.map(s => s.id)),
          tenantId,
          status: 'ACTIVE'
        },
        relations: ['student', 'student.user']
      });

      if (existingAssignments.length > 0) {
        const alreadyAssigned = existingAssignments
          .map(a => a.student?.user?.name || a.student?.admission_number || 'Unknown')
          .join(', ');
        throw new ConflictException(`The following students are already assigned to this route: ${alreadyAssigned}`);
      }

      // Create assignments
      const assignments = students.map((student) =>
        this.assignmentRepo.create({
          routeId: input.routeId,
          studentId: student.id,
          tenantId,
          status: 'ACTIVE',
          pickupPoint: input.pickupPoint,
        })
      );

      const savedAssignments = await this.assignmentRepo.save(assignments);

      const results = await this.assignmentRepo
        .createQueryBuilder('assignment')
        .leftJoinAndSelect('assignment.student', 'student')
        .leftJoinAndSelect('student.user', 'user')
        .leftJoinAndSelect('assignment.route', 'route')
        .where('assignment.id IN (:...ids) AND assignment.tenantId = :tenantId', {
          ids: savedAssignments.map(a => a.id),
          tenantId
        })
        .getMany();

      this.logger.log(`Successfully assigned ${results.length} students to route ${route.name}`);
      return results;

    } catch (error) {
      this.logger.error('Failed to bulk assign students to route', { error: error.message, input, tenantId });
      
      if (error instanceof NotFoundException || error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      
      if (error instanceof QueryFailedError) {
        throw new BadRequestException('Database operation failed during bulk assignment');
      }
      
      throw new BadRequestException(`Failed to bulk assign students: ${error.message}`);
    }
  }

 
  async removeTransportAssignment(input: RemoveTransportAssignmentInput, tenantId: string): Promise<boolean> {
    this.logger.debug('Starting transport assignment removal', { input, tenantId });

    try {
      const assignment = await this.assignmentRepo.findOne({
        where: {
          studentId: input.studentId,
          routeId: input.routeId,
          tenantId,
          status: 'ACTIVE'
        },
        relations: ['student', 'student.user', 'route']
      });

      if (!assignment) {
        throw new NotFoundException('Active transport assignment not found for this student and route');
      }

      assignment.status = 'INACTIVE';
      assignment.vacatedAt = new Date();
      
      await this.assignmentRepo.save(assignment);

      this.logger.log(`Successfully removed student ${assignment.student?.user?.name} from route ${assignment.route?.name}`);
      return true;

    } catch (error) {
      this.logger.error('Failed to remove transport assignment', { error: error.message, input, tenantId });
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new BadRequestException(`Failed to remove transport assignment: ${error.message}`);
    }
  }

  async removeBulkTransportAssignments(input: { studentIds: string[]; routeId?: string }, tenantId: string): Promise<number> {
    this.logger.debug('Starting bulk transport assignment removal', { input, tenantId });

    try {
      const whereCondition: any = {
        studentId: In(input.studentIds),
        tenantId,
        status: 'ACTIVE'
      };

      if (input.routeId) {
        whereCondition.routeId = input.routeId;
      }

      const assignments = await this.assignmentRepo.find({
        where: whereCondition,
        relations: ['student', 'student.user', 'route']
      });

      if (assignments.length === 0) {
        throw new NotFoundException('No active transport assignments found for the specified students');
      }

      const updatedAssignments = assignments.map(assignment => ({
        ...assignment,
        status: 'INACTIVE' as const,
        vacatedAt: new Date()
      }));

      await this.assignmentRepo.save(updatedAssignments);

      this.logger.log(`Successfully removed ${assignments.length} transport assignments`);
      return assignments.length;

    } catch (error) {
      this.logger.error('Failed to bulk remove transport assignments', { error: error.message, input, tenantId });
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new BadRequestException(`Failed to bulk remove transport assignments: ${error.message}`);
    }
  }

 
  async updateTransportAssignment(input: UpdateTransportAssignmentInput, tenantId: string): Promise<TransportAssignment> {
    this.logger.debug('Starting transport assignment update', { input, tenantId });

    try {
      const assignment = await this.assignmentRepo.findOne({
        where: {
          id: input.assignmentId,
          tenantId,
          status: 'ACTIVE'
        },
        relations: ['student', 'student.user', 'route']
      });

      if (!assignment) {
        throw new NotFoundException('Active transport assignment not found');
      }

      // If changing route, validate new route exists
      if (input.newRouteId && input.newRouteId !== assignment.routeId) {
        const newRoute = await this.routeRepo.findOne({
          where: { id: input.newRouteId, tenantId }
        });

        if (!newRoute) {
          throw new NotFoundException(`New transport route with ID ${input.newRouteId} not found`);
        }

        // Check for existing assignment to new route
        const existingNewAssignment = await this.assignmentRepo.findOne({
          where: {
            studentId: assignment.studentId,
            routeId: input.newRouteId,
            tenantId,
            status: 'ACTIVE'
          }
        });

        if (existingNewAssignment) {
          throw new ConflictException('Student is already assigned to the new route');
        }

        assignment.routeId = input.newRouteId;
      }

      // Update pickup point if provided
      if (input.pickupPoint !== undefined) {
        assignment.pickupPoint = input.pickupPoint;
      }

      const updatedAssignment = await this.assignmentRepo.save(assignment);

      // Fetch with updated relations
      const result = await this.assignmentRepo
        .createQueryBuilder('assignment')
        .leftJoinAndSelect('assignment.student', 'student')
        .leftJoinAndSelect('student.user', 'user')
        .leftJoinAndSelect('assignment.route', 'route')
        .where('assignment.id = :id AND assignment.tenantId = :tenantId', {
          id: updatedAssignment.id,
          tenantId
        })
        .getOne();

      if (!result) {
        throw new Error('Failed to retrieve updated assignment');
      }

      // this.logger.log(`Successfully updated transport assignment for student ${result.student?.user?.name}`);
      return result;

    } catch (error) {
      // this.logger.error('Failed to update transport assignment', { error: error.message, input, tenantId });
      
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      
      throw new BadRequestException(`Failed to update transport assignment: ${error.message}`);
    }
  }

  /**
   * Get all transport assignments with filtering options
   */
  async getTransportAssignments(filters: {
    routeId?: string;
    studentId?: string;
    status?: 'ACTIVE' | 'INACTIVE';
    limit?: number;
    offset?: number;
  }, tenantId: string): Promise<{ assignments: TransportAssignment[]; total: number }> {
    try {
      const queryBuilder = this.assignmentRepo
        .createQueryBuilder('assignment')
        .leftJoinAndSelect('assignment.student', 'student')
        .leftJoinAndSelect('student.user', 'user')
        .leftJoinAndSelect('assignment.route', 'route')
        .where('assignment.tenantId = :tenantId', { tenantId });

      if (filters.routeId) {
        queryBuilder.andWhere('assignment.routeId = :routeId', { routeId: filters.routeId });
      }

      if (filters.studentId) {
        queryBuilder.andWhere('assignment.studentId = :studentId', { studentId: filters.studentId });
      }

      if (filters.status) {
        queryBuilder.andWhere('assignment.status = :status', { status: filters.status });
      }

      const total = await queryBuilder.getCount();

      if (filters.limit) {
        queryBuilder.limit(filters.limit);
      }

      if (filters.offset) {
        queryBuilder.offset(filters.offset);
      }

      const assignments = await queryBuilder
        .orderBy('assignment.createdAt', 'DESC')
        .getMany();

      return { assignments, total };

    } catch (error) {
      // this.logger.error('Failed to get transport assignments', { error: error.message, filters, tenantId });
      throw new BadRequestException(`Failed to retrieve transport assignments: ${error.message}`);
    }

  }


  async updateAssignment(input: UpdateTransportAssignmentInput, tenantId: string) {
    const assignment = await this.assignmentRepo.findOne({
      where: { id: input.assignmentId, tenantId },
    });

    if (!assignment) throw new NotFoundException('Assignment not found');

    Object.assign(assignment, input);
    return this.assignmentRepo.save(assignment);
  }

  async getAssignmentsByRoute(routeId: string, tenantId: string) {
    return this.assignmentRepo.find({
      where: { routeId, tenantId },
      relations: ['student', 'route'],
    });
  }

  // async assignStudent(
  //   input: AssignTransportInput,
  //   tenantId: string,
  // ): Promise<TransportAssignment> {
  //   const assignment = this.assignmentRepo.create({
  //     ...input,
  //     tenantId,
  //     status: 'ACTIVE',
  //   });
  //   return this.assignmentRepo.save(assignment);
  // }

  // async updateAssignment(input: UpdateTransportAssignmentInput, tenantId: string): Promise<TransportAssignment> {
  //   const assignment = await this.assignmentRepo.findOne({
  //     where: { id: input.id, tenantId },
  //     relations: ['route', 'student', 'student.user'],
  //   });
  //   if (!assignment) throw new NotFoundException('Assignment not found');

  //   if (typeof input.pickupPoint !== 'undefined') assignment.pickupPoint = input.pickupPoint;

  //   if (typeof input.status !== 'undefined') {
  //     assignment.status = input.status;
  //     if (input.status === 'INACTIVE' && !assignment.vacatedAt) {
  //       assignment.vacatedAt = new Date();
  //     }
  //     if (input.status === 'ACTIVE') {
  //       assignment.vacatedAt = undefined;
  //     }
  //   }

  //   return this.assignmentRepo.save(assignment);
  // }

  // async unassignById(id: string, tenantId: string): Promise<boolean> {
  //   const assignment = await this.assignmentRepo.findOne({ where: { id, tenantId } });
  //   if (!assignment) return false;
  //   assignment.status = 'INACTIVE';
  //   assignment.vacatedAt = new Date();
  //   await this.assignmentRepo.save(assignment);
  //   return true;
  // }

  // async getAssignmentsByRoute(routeId: string, tenantId: string): Promise<TransportAssignment[]> {
  //   return this.assignmentRepo.find({
  //     where: { routeId, tenantId },
  //     relations: ['route', 'student', 'student.user'],
  //   });
  // }

  // async getAssignmentsByStudent(studentId: string, tenantId: string): Promise<TransportAssignment[]> {
  //   return this.assignmentRepo.find({
  //     where: { studentId, tenantId },
  //     relations: ['route', 'student', 'student.user'],
  //   });
  // }
}
