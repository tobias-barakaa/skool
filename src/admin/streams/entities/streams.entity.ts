import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { GradeLevel } from 'src/admin/level/entities/grade-level.entity';
import { Student } from 'src/admin/student/entities/student.entity';
import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@ObjectType()
@Entity('streams')
export class Stream {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ length: 100 })
  name: string;

  @Field(() => Int, { nullable: true })
  @Column({ type: 'int', nullable: true })
  capacity: number;

  @Field({ nullable: true })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => GradeLevel, (gradeLevel) => gradeLevel.streams, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  gradeLevel: GradeLevel;

  @OneToMany(() => Student, (student) => student.stream)
  students: Student[];

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Tenant, (tenant) => tenant.streams, { onDelete: 'CASCADE' })
  @Field(() => Tenant)
  tenant: Tenant;

  @Column()
  tenantId: string;
}
