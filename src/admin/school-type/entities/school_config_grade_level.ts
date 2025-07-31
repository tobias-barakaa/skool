
import { ObjectType, Field, ID } from '@nestjs/graphql';
import {
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from 'typeorm';
import { SchoolLevel } from './school_level.entity';
import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
import { SchoolConfig } from './school-config.entity';
import { SchoolConfigLevel } from './school_config_level';
import { GradeLevel } from 'src/admin/level/entities/grade-level.entity';

@Entity()
export class SchoolConfigGradeLevel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SchoolConfigLevel, { onDelete: 'CASCADE' })
  configLevel: SchoolConfigLevel;

  @ManyToOne(() => GradeLevel)
  gradeLevel: GradeLevel;
}
