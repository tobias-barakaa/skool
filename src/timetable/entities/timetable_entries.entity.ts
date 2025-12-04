import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    Unique,
  } from 'typeorm';
  import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
  import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
  import { User } from 'src/admin/users/entities/user.entity';
import { Term } from 'src/admin/academic_years/entities/terms.entity';
import { TenantGradeLevel } from 'src/admin/school-type/entities/tenant-grade-level';
import { TenantSubject } from 'src/admin/school-type/entities/tenant-specific-subject';
import { TimeSlot } from './time_slots.entity';
import { Teacher } from 'src/admin/teacher/entities/teacher.entity';
  
  @ObjectType()
  @Entity('timetable_entries')
  @Unique(['tenantId', 'termId', 'gradeId', 'dayOfWeek', 'timeSlotId'])
  @Index(['tenantId', 'termId', 'gradeId'])
  @Index(['tenantId', 'teacherId'])
  @Index(['dayOfWeek'])
  export class TimetableEntry {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Field()
    @Column()
    @Index()
    tenantId: string;
  
    @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'tenantId' })
    tenant: Tenant;
  
    // Which term this timetable entry belongs to
    @Field(() => ID)
    @Column()
    termId: string;
  
    @Field(() => Term)
    @ManyToOne(() => Term, { eager: true })
    @JoinColumn({ name: 'termId' })
    term: Term;
  
    // Which grade/class
    @Field(() => ID)
    @Column()
    gradeId: string;
  
    @Field(() => TenantGradeLevel)
    @ManyToOne(() => TenantGradeLevel, { eager: true })
    @JoinColumn({ name: 'gradeId' })
    grade: TenantGradeLevel;
  
    // Which subject
    @Field(() => ID)
    @Column()
    subjectId: string;
  
    @Field(() => TenantSubject)
    @ManyToOne(() => TenantSubject, { eager: true })
    @JoinColumn({ name: 'subjectId' })
    subject: TenantSubject;
  
    // Which teacher
    @Field(() => ID)
    @Column()
    teacherId: string;
  
    @Field(() => Teacher)
    @ManyToOne(() => Teacher, { eager: true })
    @JoinColumn({ name: 'teacherId' })
    teacher: Teacher;
  
    // Which time slot
    @Field(() => ID)
    @Column()
    timeSlotId: string;
  
    @Field(() => TimeSlot)
    @ManyToOne(() => TimeSlot, { eager: true })
    @JoinColumn({ name: 'timeSlotId' })
    timeSlot: TimeSlot;
  
    // Which day (1-5)
    @Field(() => Int)
    @Column({ type: 'int' })
    dayOfWeek: number; // 1=Monday, 2=Tuesday, ..., 5=Friday
  
    // Room/Location
    @Field(() => String, { nullable: true })
    @Column({ type: 'varchar', length: 50, nullable: true })
    roomNumber?: string | null;
  
    @Field()
    @Column({ default: true })
    isActive: boolean;
  
    @Field(() => Date)
    @CreateDateColumn()
    createdAt: Date;
  
    @Field(() => Date)
    @UpdateDateColumn()
    updatedAt: Date;
  }

