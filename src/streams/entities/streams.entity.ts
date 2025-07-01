import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { GradeLevel } from 'src/level/entities/grade-level.entity';
import { School } from 'src/school/entities/school.entity';
import { Student } from 'src/student/entities/student.entity';
import { Tenant } from 'src/tenants/entities/tenant.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
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

  @ManyToOne(() => GradeLevel, gradeLevel => gradeLevel.streams, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  gradeLevel: GradeLevel;

  @OneToMany(() => Student, student => student.stream)
  students: Student[];

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;


@ManyToOne(() => Tenant, tenant => tenant.streams, { onDelete: 'CASCADE' })
@Field(() => Tenant)
tenant: Tenant;

@Column()
tenantId: string;

}
