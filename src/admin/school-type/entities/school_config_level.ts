

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
import { Level } from 'src/admin/level/entities/level.entities';



@ObjectType()
@Entity()
export class SchoolConfigLevel {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Level)
  @ManyToOne(() => Level, { eager: true })
  @JoinColumn()
  level: Level;

  @ManyToOne(() => SchoolConfig, (config) => config.configLevels, {
    onDelete: 'CASCADE',
  })
  schoolConfig: SchoolConfig;

  @OneToMany(() => SchoolConfigGradeLevel, (g) => g.configLevel)
  gradeLevels: SchoolConfigGradeLevel[];

  @OneToMany(() => SchoolConfigSubject, (s) => s.configLevel)
  subjects: SchoolConfigSubject[];
}
