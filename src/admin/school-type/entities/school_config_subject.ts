import { Field, HideField, ID } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { CBCLevelSelectionDto } from '../dtos/create-school-setup.dto';
import { SchoolConfigLevel } from './school_config_level';
import { Subject } from 'src/admin/subject/entities/subject.entity';
import { Tenant } from 'src/admin/tenants/entities/tenant.entity';



@Entity()
export class SchoolConfigSubject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SchoolConfigLevel, { onDelete: 'CASCADE' })
  configLevel: SchoolConfigLevel;

  @ManyToOne(() => Subject, { eager: true })
  @JoinColumn()
  subject: Subject;

  @Column({ default: 'core' })
  subjectType: 'core' | 'elective';

  @ManyToOne(() => Tenant, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn()
  tenant: Tenant;
}
