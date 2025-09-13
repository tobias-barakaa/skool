import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { FeeAssignment } from './entities/fee-assignment.entity';
import { FeeStructureService } from '../fee-structure/fee-structure.service';
import { BulkFeeAssignmentInput, CreateFeeAssignmentInput } from './dtos/create-fee-assignment.input';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';

@Injectable()
export class FeeAssignmentService {
  constructor(
    @InjectRepository(FeeAssignment)
    private readonly feeAssignmentRepository: Repository<FeeAssignment>,
    private readonly feeStructureService: FeeStructureService,
    private readonly dataSource: DataSource,
  ) {}

  async create(input: CreateFeeAssignmentInput, user: ActiveUserData): Promise<FeeAssignment[]> {
    const assignments = input.feeStructureItemIds.map(itemId => 
      this.feeAssignmentRepository.create({
        tenantId: user.tenantId,
        studentId: input.studentId,
        feeStructureItemId: itemId,
      })
    );

    return await this.feeAssignmentRepository.save(assignments);
  }

  async bulkAssign(input: BulkFeeAssignmentInput, user: ActiveUserData): Promise<FeeAssignment[]> {
    const feeStructure = await this.feeStructureService.findOne(input.feeStructureId, user);
    
    if (!feeStructure.items || feeStructure.items.length === 0) {
      throw new NotFoundException('Fee structure has no items');
    }

    return await this.dataSource.transaction(async manager => {
      const assignments: FeeAssignment[] = [];

      for (const studentId of input.studentIds) {
        for (const item of feeStructure.items) {
          const existingAssignment = await manager.findOne(FeeAssignment, {
            where: {
              tenantId: user.tenantId,
              studentId,
              feeStructureItemId: item.id
            }
          });

          if (!existingAssignment) {
            const assignment = manager.create(FeeAssignment, {
              tenantId: user.tenantId,
              studentId,
              feeStructureItemId: item.id,
            });
            assignments.push(assignment);
          }
        }
      }

      return await manager.save(FeeAssignment, assignments);
    });
  }

  async findByStudent(studentId: string, user: ActiveUserData): Promise<FeeAssignment[]> {
    return await this.feeAssignmentRepository.find({
      where: { 
        tenantId: user.tenantId, 
        studentId, 
        isActive: true 
      },
      relations: ['feeStructureItem', 'feeStructureItem.feeBucket', 'feeStructureItem.feeStructure']
    });
  }

  async findAll(user: ActiveUserData): Promise<FeeAssignment[]> {
    return await this.feeAssignmentRepository.find({
      where: { tenantId: user.tenantId, isActive: true },
      relations: ['student', 'feeStructureItem', 'feeStructureItem.feeBucket']
    });
  }

  async remove(id: string, user: ActiveUserData): Promise<boolean> {
    const assignment = await this.feeAssignmentRepository.findOne({
      where: { id, tenantId: user.tenantId }
    });

    if (!assignment) {
      throw new NotFoundException('Fee assignment not found');
    }

    await this.feeAssignmentRepository.remove(assignment);
    return true;
  }
}