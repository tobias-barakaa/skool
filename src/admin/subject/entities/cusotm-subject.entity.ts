import {
  Entity,
  Column,
  ManyToOne,
  PrimaryGeneratedColumn,
  BaseEntity,
} from 'typeorm';
import { SubjectType } from '../enums/subject.type.enum';
import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
import { Curriculum } from 'src/admin/curriculum/entities/curicula.entity';

@Entity()
export class CustomSubject extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: SubjectType,
    default: SubjectType.CORE,
  })
  subjectType: SubjectType;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  tenant: Tenant;

  @ManyToOne(() => Curriculum, { onDelete: 'CASCADE' })
  curriculum: Curriculum; // needed because you're doing cs.curriculum.id

  @Column()
  name: string;

  @Column({ nullable: true })
  code?: string;

  @Column({ nullable: true })
  shortName?: string;

  @Column({ nullable: true })
  category?: string;

  @Column({ nullable: true })
  department?: string;

  @Column({ default: true })
  isActive: boolean;

  // Extra fields from Subject that you want for marks
  @Column({ nullable: true })
  isCompulsory?: boolean;

  @Column({ nullable: true })
  totalMarks?: number;

  @Column({ nullable: true })
  passingMarks?: number;

  @Column({ nullable: true })
  creditHours?: number;
}
