import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
import { GradeLevel } from 'src/admin/level/entities/grade-level.entity';
import { Curriculum } from 'src/admin/curriculum/entities/curicula.entity';
import { Stream } from 'src/admin/streams/entities/streams.entity';

@ObjectType()
@Entity()
export class TenantGradeLevel {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Tenant)
  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn()
  tenant: Tenant;

  @Field(() => Curriculum)
  @ManyToOne(() => Curriculum, { eager: true })
  @JoinColumn()
  curriculum: Curriculum;

  @Field(() => GradeLevel)
  @ManyToOne(() => GradeLevel, { eager: true })
  @JoinColumn()
  gradeLevel: GradeLevel;

  @Field(() => Boolean)
  @Column({ default: true })
  isActive: boolean;

  @Field({ nullable: true })
  @Column({ length: 20, nullable: true })
  shortName?: string;

  @Field({ nullable: true })
  @Column({ type: 'int', nullable: true, default: 0 })
  sortOrder?: number;

  @Field(() => [Stream], { nullable: true })
  @OneToMany(() => Stream, (s) => s.gradeLevel)
  streams?: Stream[];

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt: Date;
}
