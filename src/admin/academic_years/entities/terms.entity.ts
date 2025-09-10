import { Field, ID, ObjectType, GraphQLISODateTime } from "@nestjs/graphql"; // Import GraphQLISODateTime
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Index, Unique } from "typeorm";
import { AcademicYear } from "./academic_years.entity";

@Entity('terms')
@ObjectType({ description: 'Represents an academic term' })
@Unique(['tenantId', 'academicYearId', 'name']) 
@Index(['tenantId', 'academicYearId']) 
export class Term {
  
  @Field(() => ID, { description: 'The unique identifier of the term' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field({ description: 'The ID of the tenant this term belongs to' })
  @Column()
  tenantId: string;

  @Field({ description: 'The name of the term' })
  @Column()
  name: string;

  @Field(() => GraphQLISODateTime, { description: 'The start date of the term' }) 
  @Column({ type: 'timestamp' })
  startDate: Date;

 
  @Field(() => GraphQLISODateTime, { description: 'The end date of the term' }) 
  @Column({ type: 'timestamp' })
  endDate: Date;

  @Field({ description: 'Indicates if the term is currently active' })
  @Column({ default: true })
  isActive: boolean;

  
  @Field(() => GraphQLISODateTime, { description: 'The date and time when the term was created' }) 
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Field(() => GraphQLISODateTime, { description: 'The date and time when the term was last updated' }) 
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Field(() => AcademicYear, { description: 'The academic year to which this term belongs' })
  @ManyToOne(() => AcademicYear, (year) => year.terms, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'academic_year_id' })
  academicYear: AcademicYear;

  @Field(() => ID, { description: 'The ID of the academic year this term belongs to' })
  @Column({ name: 'academic_year_id' })
  academicYearId: string;

  @Field()
  @Column({ default: false })
  isCurrent: boolean;
}