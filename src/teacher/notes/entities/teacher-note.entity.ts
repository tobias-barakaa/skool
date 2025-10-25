import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
  } from 'typeorm';
  import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
  import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
  import { User } from 'src/admin/users/entities/user.entity';
  import { TenantGradeLevel } from 'src/admin/school-type/entities/tenant-grade-level';
import { TenantSubject } from 'src/admin/school-type/entities/tenant-specific-subject';
  
  export enum NoteVisibility {
    PRIVATE = 'PRIVATE',
    GRADE = 'GRADE',
    SCHOOL = 'SCHOOL',
  }
  
  registerEnumType(NoteVisibility, {
    name: 'NoteVisibility',
    description: 'Visibility level of the note',
  });
  
  @ObjectType()
  @Entity('teacher_notes')
  export class TeacherNote {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Field(() => ID)
    @Column('uuid')
    tenant_id: string;
  
    @Field(() => Tenant)
    @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'tenant_id' })
    tenant: Tenant;
  
    @Field(() => ID)
    @Column('uuid')
    teacher_id: string;
  
    @Field(() => User)
    @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'teacher_id' })
    teacher: User;
  
    @Field()
    @Column({ type: 'varchar', length: 255 })
    title: string;
  
    @Field()
    @Column({ type: 'text' })
    content: string;
  
    @Field(() => [String], { nullable: true })
    @Column({ type: 'text', array: true, nullable: true })
    links?: string[];
  
    @Field(() => ID, { nullable: true })
    @Column({ type: 'uuid', nullable: true })
    subject_id?: string;
  
    @Field(() => TenantSubject, { nullable: true })
    @ManyToOne(() => TenantSubject, { eager: true, nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'subject_id' })
    subject?: TenantSubject;
  
    @Field(() => ID, { nullable: true })
    @Column({ type: 'uuid', nullable: true })
    grade_level_id?: string;
  
    @Field(() => TenantGradeLevel, { nullable: true })
    @ManyToOne(() => TenantGradeLevel, { eager: true, nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'grade_level_id' })
    gradeLevel?: TenantGradeLevel;
  
    @Field(() => NoteVisibility)
    @Column({
      type: 'enum',
      enum: NoteVisibility,
      default: NoteVisibility.PRIVATE,
    })
    visibility: NoteVisibility;
  
    @Field()
    @Column({ type: 'boolean', default: false })
    is_ai_generated: boolean;
  
    @Field(() => Date)
    @CreateDateColumn()
    created_at: Date;
  
    @Field(() => Date)
    @UpdateDateColumn()
    updated_at: Date;
  }