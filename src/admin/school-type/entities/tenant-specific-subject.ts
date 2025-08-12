
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
import { Curriculum } from 'src/admin/curriculum/entities/curicula.entity';
import { Subject } from 'src/admin/subject/entities/subject.entity';
import { CustomSubject } from 'src/admin/subject/entities/cusotm-subject.entity';


@ObjectType()
@Entity()
export class TenantSubject {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn()
  tenant: Tenant;

  @Field(() => Curriculum) // <-- add this
  @ManyToOne(() => Curriculum, { eager: true })
  @JoinColumn()
  curriculum: Curriculum;

  // @Field(() => Subject) // <-- add this
  // @ManyToOne(() => Subject, { eager: true })
  // @JoinColumn()
  // subject: Subject;

  @Field(() => String)
  @Column({ default: 'core' })
  subjectType: 'core' | 'elective';

  @Field(() => Subject) // <-- add this
  @ManyToOne(() => Subject, { eager: true, nullable: true })
  @JoinColumn()
  subject?: Subject; // Global subject

  @ManyToOne(() => CustomSubject, { eager: true, nullable: true })
  @JoinColumn()
  customSubject?: CustomSubject; // Tenant's own subject

  @Field(() => Boolean)
  @Column({ default: true })
  isCompulsory: boolean;

  @Field(() => Number, { nullable: true })
  @Column({ nullable: true })
  totalMarks?: number;

  @Field(() => Number, { nullable: true })
  @Column({ nullable: true })
  passingMarks?: number;

  @Field(() => Number, { nullable: true })
  @Column({ nullable: true })
  creditHours?: number;

  @Field(() => Boolean)
  @Column({ default: true })
  isActive: boolean;

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt: Date;
}
