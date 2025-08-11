import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
import { GradeLevel } from 'src/admin/level/entities/grade-level.entity';
import { Curriculum } from 'src/admin/curriculum/entities/curicula.entity';

@ObjectType()
@Entity()
export class TenantGradeLevel {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn()
  tenant: Tenant;

  @ManyToOne(() => Curriculum, { eager: true })
  @JoinColumn()
  curriculum: Curriculum;

  @ManyToOne(() => GradeLevel, { eager: true })
  @JoinColumn()
  gradeLevel: GradeLevel;

  @Field(() => Boolean)
  @Column({ default: true })
  isActive: boolean;

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt: Date;
}
