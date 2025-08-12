import {
  Entity,
  Column,
  ManyToOne,
  PrimaryGeneratedColumn,
  BaseEntity,
} from 'typeorm';
import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
import { Curriculum } from 'src/admin/curriculum/entities/curicula.entity';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { SubjectTypeEnum } from '../dtos/tenant-subject.input';
import { IsEnum, IsOptional } from 'class-validator';

@ObjectType()
@Entity()
export class CustomSubject extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => SubjectTypeEnum, { nullable: true })
  @IsOptional()
  @IsEnum(SubjectTypeEnum)
  @Column({ nullable: true })
  subjectType?: SubjectTypeEnum;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  tenant: Tenant;

  @ManyToOne(() => Curriculum, { onDelete: 'CASCADE' })
  curriculum: Curriculum;

  @Field()
  @Column()
  name: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  code?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  shortName?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  category?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  department?: string;

  @Field()
  @Column({ default: true })
  isActive: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true })
  isCompulsory?: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true })
  totalMarks?: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  passingMarks?: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  creditHours?: number;
}
