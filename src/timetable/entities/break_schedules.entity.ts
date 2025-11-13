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
  import { ObjectType, Field, ID, Int, registerEnumType } from '@nestjs/graphql';
  import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
  import { User } from 'src/admin/users/entities/user.entity';
import { DayOfWeek } from '../enums/day_of_week.enum';
import { BreakType } from './timetable_break.entity';
import { Term } from 'src/admin/academic_years/entities/terms.entity';
  
  
  registerEnumType(DayOfWeek, { name: 'DayOfWeek' });
  registerEnumType(BreakType, { name: 'BreakType' });

@Entity('break_schedules')
@ObjectType()
@Unique(['tenantId', 'termId', 'gradeLevel', 'dayOfWeek', 'periodNumber'])
@Index(['tenantId', 'termId'])
export class BreakSchedule {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  tenantId: string;

  @Field(() => Term)
  @ManyToOne(() => Term, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'term_id' })
  term: Term;

  @Column({ name: 'term_id' })
  termId: string;

  @Field(() => Int)
  @Column({ type: 'int' })
  gradeLevel: number; // 1, 2, 3, 4 (null = applies to all grades)

  @Field(() => DayOfWeek)
  @Column({ type: 'int' })
  dayOfWeek: DayOfWeek; // 1-5

  @Field(() => Int)
  @Column({ type: 'int' })
  periodNumber: number; // Which period is break

  @Field(() => BreakType)
  @Column({ type: 'enum', enum: BreakType })
  breakType: BreakType;

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