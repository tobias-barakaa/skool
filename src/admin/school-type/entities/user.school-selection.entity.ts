import { Curriculum } from 'src/admin/curriculum/entities/curicula.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SchoolType } from './school-type';

@Entity('user_school_selections')
export class UserSchoolSelection {
  @PrimaryGeneratedColumn('uuid')
  userId: string;

  @ManyToOne(() => SchoolType)
  schoolType: SchoolType;

  @ManyToMany(() => Curriculum)
  @JoinTable({ name: 'user_selected_curricula' })
  selectedCurricula: Curriculum[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Column()
  schoolId: string; 
}
