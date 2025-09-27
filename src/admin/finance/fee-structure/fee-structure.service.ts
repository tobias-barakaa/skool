import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { FeeStructure } from './entities/fee-structure.entity';
import { FeeStructureItem } from '../fee-structure-item/entities/fee-structure-item.entity';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { CreateFeeStructureInput } from './dtos/create-fee-structure.input';
import { FeeBucket } from '../fee-bucket/entities/fee-bucket.entity';
import { AcademicYear } from 'src/admin/academic_years/entities/academic_years.entity';
import { Term } from 'src/admin/academic_years/entities/terms.entity';
import { GradeLevel } from 'src/admin/level/entities/grade-level.entity';
import { TenantGradeLevel } from 'src/admin/school-type/entities/tenant-grade-level';
import { UpdateFeeStructureInput } from './dtos/update-fee-structure.input.dto';

@Injectable()
export class FeeStructureService {
  constructor(
    @InjectRepository(FeeStructure)
    private readonly feeStructureRepository: Repository<FeeStructure>,
    @InjectRepository(FeeStructureItem)
    private readonly feeStructureItemRepository: Repository<FeeStructureItem>,
    private readonly dataSource: DataSource,
    @InjectRepository(FeeBucket)
    private readonly feeBucketRepository: Repository<FeeBucket>,
    // @InjectRepository(AcademicYear)
    // private readonly academicYearRepository: Repository<AcademicYear>,
    // @InjectRepository(Term)
    // private readonly termRepository: Repository<Term>,
    // @InjectRepository(TenantGradeLevel)
    // private readonly tenantGradeLevelRepository: Repository<TenantGradeLevel>


  ) {}

  // async create(input: CreateFeeStructureInput, user: ActiveUserData) {
  //   const existingStructure = await this.feeStructureRepository.findOne({
  //     where: {
  //       tenantId: user.tenantId,
  //       academicYearId: input.academicYearId,
  //       termId: input.termId,
  //       name: input.name,
  //     }
  //   });
  
  //   if (existingStructure) {
  //     throw new ConflictException('Fee structure already exists for this combination');
  //   }
  
  //   await this.validateCoreEntities(input, user.tenantId);
  
  //   return await this.dataSource.transaction(async manager => {
  //     const feeStructure = manager.create(FeeStructure, {
  //       ...input,
  //       tenantId: user.tenantId,
  //     });
  
  //     const savedStructure = await manager.save(feeStructure);
  
  //     return await manager.findOne(FeeStructure, {
  //       where: { id: savedStructure.id },
  //       relations: ['academicYear', 'term']
  //     });
  //   });
  // }
  



  async create(input: CreateFeeStructureInput, user: ActiveUserData) {
    const existingStructure = await this.feeStructureRepository.findOne({
      where: {
        tenantId: user.tenantId,
        academicYearId: input.academicYearId,
        name: input.name,
      },
    });
  
    if (existingStructure) {
      throw new ConflictException('Fee structure already exists for this academic year and name');
    }
  
    await this.validateCoreEntities(input, user.tenantId);
  
    let gradeLevels: TenantGradeLevel[] = [];
    if (input.gradeLevelIds?.length) {
      gradeLevels = await this.validateGradeLevels(input.gradeLevelIds, user.tenantId);
    }
  

    const termRepository = this.dataSource.getRepository(Term);

    const terms = await termRepository.find({
      where: {
        id: In(input.termIds),
      },
    });
  
    return await this.dataSource.transaction(async (manager) => {
      const feeStructure = manager.create(FeeStructure, {
        name: input.name,
        academicYearId: input.academicYearId,
        tenantId: user.tenantId,
        terms,
      });
  
      const savedStructure = await manager.save(feeStructure);
  
      if (gradeLevels.length > 0) {
        savedStructure.gradeLevels = gradeLevels;
        await manager.save(savedStructure);
      }
  
      return await manager.findOne(FeeStructure, {
        where: { id: savedStructure.id },
        relations: ['academicYear', 'terms', 'gradeLevels'],
      });
    });
  }
  
  // async create(input: CreateFeeStructureInput, user: ActiveUserData) {
  //   const existingStructure = await this.feeStructureRepository.findOne({
  //     where: {
  //       tenantId: user.tenantId,
  //       academicYearId: input.academicYearId,
  //       termId: input.termId,
  //       name: input.name,
  //     }
  //   });

  //   if (existingStructure) {
  //     throw new ConflictException('Fee structure already exists for this combination');
  //   }

  //   await this.validateCoreEntities(input, user.tenantId);
    
  //   let gradeLevels: TenantGradeLevel[] = [];
  //   if (input.gradeLevelIds && input.gradeLevelIds.length > 0) {
  //     gradeLevels = await this.validateGradeLevels(input.gradeLevelIds, user.tenantId);
  //   }

  //   return await this.dataSource.transaction(async manager => {
  //     const feeStructure = manager.create(FeeStructure, {
  //       name: input.name,
  //       academicYearId: input.academicYearId,
  //       termId: input.termId,
  //       tenantId: user.tenantId,
  //     });

  //     const savedStructure = await manager.save(feeStructure);

  //     if (gradeLevels.length > 0) {
  //       savedStructure.gradeLevels = gradeLevels;
  //       await manager.save(savedStructure);
  //     }

  //     return await manager.findOne(FeeStructure, {
  //       where: { id: savedStructure.id },
  //       relations: ['academicYear', 'term', 'gradeLevels']
  //     });
  //   });
  // }

  private async validateGradeLevels(gradeLevelIds: string[], tenantId: string): Promise<TenantGradeLevel[]> {
   

    const gradeLevels = await this.dataSource.getRepository(TenantGradeLevel).createQueryBuilder('tenantGradeLevel')
  .where('tenantGradeLevel.id IN (:...gradeLevelIds) AND tenantGradeLevel.tenantId = :tenantId', { gradeLevelIds, tenantId })
  .getMany();

    if (gradeLevels.length !== gradeLevelIds.length) {
      throw new BadRequestException('One or more grade levels not found or do not belong to your tenant');
    }

    return gradeLevels;
  }

  
  

  private async validateCoreEntities(
    input: CreateFeeStructureInput,
    tenantId: string,
  ): Promise<void> {
    const repo = this.dataSource.getRepository.bind(this.dataSource);
  
    /* ---------- 1. Academic-year check ---------- */
    const ayPromise = repo(AcademicYear)
      .findOne({ where: { id: input.academicYearId, tenantId }, select: ['id'] })
      .then((row) => {
        if (!row)
          throw new BadRequestException(
            `Academic-year ${input.academicYearId} not found or does not belong to your organisation.`,
          );
      });
  
    /* ---------- 2. Term(s) check ---------- */
    const termPromise = repo(Term)
      .find({
        where: { id: In(input.termIds), tenantId },
        select: ['id'],
      })
      .then((rows) => {
        if (rows.length !== input.termIds.length) {
          const found = new Set(rows.map((r) => r.id));
          const missing = input.termIds.filter((id) => !found.has(id));
          throw new BadRequestException(
            `Term(s) ${missing.join(', ')} not found or do not belong to your organisation.`,
          );
        }
      });
  
      let glPromise: Promise<void> = Promise.resolve();
      const glIds = input.gradeLevelIds;          
      if (glIds?.length) {
        glPromise = repo(TenantGradeLevel)
          .find({
            where: { id: In(glIds), tenantId },
            select: ['id'],
          })
          .then((rows) => {
            if (rows.length !== glIds.length) {
              const found = new Set(rows.map((r) => r.id));
              const missing = glIds.filter((id) => !found.has(id)); // <-- safe
              throw new BadRequestException(
                `Grade-level(s) ${missing.join(', ')} not found or do not belong to your organisation.`,
              );
            }
          });
      }
    }
      

  // private async validateCoreEntities<T extends Partial<CreateFeeStructureInput>>(
  //   input: T,
  //   tenantId: string,
  // ): Promise<void> {
  
  //   const validationPromises: Promise<void>[] = [];
  
  //   const academicYearRepository = this.dataSource.getRepository(AcademicYear)
  //   validationPromises.push(
  //     academicYearRepository.findOne({
  //       where: { id: input.academicYearId, tenantId },
  //       select: ['id']
  //     }).then(result => {
  //       if (!result) {
  //         throw new BadRequestException(`Academic year with ID ${input.academicYearId} not found or doesn't belong to your organization`);
  //       }
  //     })
  //   );
  
  //   const termRepository = this.dataSource.getRepository(Term)
  //   validationPromises.push(
  //     termRepository.findOne({
  //       where: { id: input.termId, tenantId },
  //       select: ['id']
  //     }).then(result => {
  //       if (!result) {
  //         throw new BadRequestException(`Term with ID ${input.termId} not found or doesn't belong to your organization`);
  //       }
  //     })
  //   );

  

  
  //   await Promise.all(validationPromises);
  // }



//     const tenantGradeLevelRepository = this.dataSource.getRepository(TenantGradeLevel);

// validationPromises.push(
//   tenantGradeLevelRepository
//     .findOne({
//       where: {
//         tenant: { id: tenantId },
//         isActive: true

//       },
//       relations: ['gradeLevel'],
//     })
//     .then((row) => {
//       if (!row) {
//         throw new BadRequestException(
//           `Grade level ${input.termId} is not enabled for your organisation`,
//         );
//       }
//     })
// );

  async findAll(user: ActiveUserData): Promise<FeeStructure[]> {
    return this.feeStructureRepository.find({
      where: { tenantId: user.tenantId, isActive: true },
      relations: [
        'academicYear',
        'term',
        'items',
        'items.feeBucket',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, user: ActiveUserData): Promise<FeeStructure> {
    const feeStructure = await this.feeStructureRepository.findOne({
      where: { id, tenantId: user.tenantId },
      relations: ['items', 'items.feeBucket', 'academicYear', 'term', 'gradeLevel']
    });

    if (!feeStructure) {
      throw new NotFoundException('Fee structure not found');
    }

    return feeStructure;
  }

  async findByGradeAndTerm(
    termId: string,
    academicYearId: string,
    user: ActiveUserData,
  ): Promise<FeeStructure | null> {
    return this.feeStructureRepository.findOne({
      where: {
        tenantId: user.tenantId,
        termId,
        academicYearId,
        isActive: true,
      },
      relations: [
        'academicYear',
        'term',
        'items',
        'items.feeBucket',
        'gradeLevels', 
      ],
    });
  }
  




  async findOneById(id: string, user: ActiveUserData): Promise<FeeStructure> {
    const fs = await this.feeStructureRepository.findOne({
      where: { id, tenantId: user.tenantId },
      relations: [
        'academicYear',
        'term',
        'items',
        'items.feeBucket',
      ],
    });
    if (!fs) throw new NotFoundException('Fee structure not found');
    return fs;
  }
  
  // async remove(id: string, user: ActiveUserData): Promise<boolean> {
  //   const fs = await this.findOneById(id, user);        
  //   await this.feeStructureRepository.remove(fs);       
  //   return true;
  // }
  
  async update(
    id: string,
    input: UpdateFeeStructureInput,
    user: ActiveUserData,
  ): Promise<FeeStructure> {
    await this.findOneById(id, user);
  
    return this.dataSource.transaction(async (mgr) => {
      const updateData: Partial<FeeStructure> = {};
  
      if (input.name !== undefined) updateData.name = input.name;
      if (input.isActive !== undefined) updateData.isActive = input.isActive;
  
      await mgr.update(FeeStructure, id, updateData);
  
      if (input.gradeLevelIds && input.gradeLevelIds.length > 0) {
        const newGradeLevels = await this.validateGradeLevels(
          input.gradeLevelIds,
          user.tenantId,
        );
  
        const feeStructureToUpdate = await mgr.findOne(FeeStructure, {
          where: { id },
          relations: ['gradeLevels'],
        });
  
        if (!feeStructureToUpdate) throw new Error('Fee structure not found');
  
        const existing: TenantGradeLevel[] = feeStructureToUpdate.gradeLevels ?? [];
  
        const mergedMap = new Map<string, TenantGradeLevel>();
        for (const gl of existing) mergedMap.set(gl.id, gl);
        for (const gl of newGradeLevels) mergedMap.set(gl.id, gl);
  
        feeStructureToUpdate.gradeLevels = Array.from(mergedMap.values());
  
        await mgr.save(feeStructureToUpdate);
      }
  
      const feeStructure = await mgr.findOne(FeeStructure, {
        where: { id },
        relations: ['academicYear', 'term', 'gradeLevels'],
      });
  
      if (!feeStructure) throw new Error('Fee structure not found');
      return feeStructure;
    });
  }
  
  

  async remove(id: string, user: ActiveUserData): Promise<boolean> {
    const fs = await this.feeStructureRepository.findOneByOrFail({
      id,
      tenantId: user.tenantId,
    });
  
    await this.feeStructureRepository.remove(fs);
  
    return true; 
  }
  

}



