// 1. Stream Entity
import { GradeLevel } from 'src/level/entities/grade-level.entity';
import { Student } from 'src/student/entities/student.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('streams')
export class Stream {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  
  @Column({ type: 'int', nullable: true })
  capacity: number; 

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => GradeLevel, gradeLevel => gradeLevel.streams, { 
    onDelete: 'CASCADE',
    nullable: false 
  })
  gradeLevel: GradeLevel;

  @OneToMany(() => Student, student => student.stream)
  students: Student[];
  

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
