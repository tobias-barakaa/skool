import { Field, ID, ObjectType } from "@nestjs/graphql";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Index, Unique } from "typeorm";
import { AcademicYear } from "./academic_years.entity";

@Entity('terms')
@ObjectType()
@Unique(['tenantId', 'academicYearId', 'name']) 
@Index(['tenantId', 'academicYearId']) 
export class Term {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  tenantId: string;

  @Field()
  @Column()
  name: string;

  @Field(() => Date)
  @Column({ type: 'date' })
  startDate: Date;

  @Field(() => Date)
  @Column({ type: 'date' })
  endDate: Date;

  @Field()
  @Column({ default: true })
  isActive: boolean;

  @Field(() => Date)
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Field(() => Date)
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Field(() => AcademicYear)
  @ManyToOne(() => AcademicYear, (year) => year.terms, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'academic_year_id' })
  academicYear: AcademicYear;

  @Field(() => ID)
  @Column({ name: 'academic_year_id' })
  academicYearId: string;
}