

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
  OneToMany,
} from 'typeorm';
import { SchoolLevel } from './school_level.entity';
import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
import { SchoolConfig } from './school-config.entity';
import { SchoolConfigGradeLevel } from './school_config_grade_level';
import { SchoolConfigSubject } from './school_config_subject';


@Entity()
export class SchoolConfigLevel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SchoolConfig, { onDelete: 'CASCADE' })
  schoolConfig: SchoolConfig;

  @ManyToOne(() => SchoolLevel)
  level: SchoolLevel;

  @OneToMany(() => SchoolConfigGradeLevel, (g) => g.configLevel)
  gradeLevels: SchoolConfigGradeLevel[];

  @OneToMany(() => SchoolConfigSubject, (s) => s.configLevel)
  subjects: SchoolConfigSubject[];
}
