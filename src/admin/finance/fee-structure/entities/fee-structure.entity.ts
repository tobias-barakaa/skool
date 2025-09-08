import { Field, ID, ObjectType, GraphQLISODateTime } from "@nestjs/graphql";
import { Column, Entity, PrimaryGeneratedColumn, OneToMany, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index, Unique } from "typeorm";
import { AcademicYear } from "src/admin/academic_years/entities/academic_years.entity";
import { Term } from "src/admin/academic_years/entities/terms.entity";
import { TenantGradeLevel } from "src/admin/school-type/entities/tenant-grade-level";
import { FeeStructureItem } from "../../fee-structure-item/entities/fee-structure-item.entity";


@Entity('fee_structures')
@ObjectType({ description: 'Represents a fee structure for a specific grade, term and academic year' })
@Unique(['tenantId', 'academicYearId', 'termId', 'gradeLevelId'])
@Index(['tenantId', 'academicYearId', 'termId'])
@Index(['tenantId', 'gradeLevelId'])
export class FeeStructure {
  @Field(() => ID, { description: 'The unique identifier of the fee structure' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field({ description: 'The ID of the tenant this fee structure belongs to' })
  @Column()
  tenantId: string;

  @Field({ description: 'The name of the fee structure' })
  @Column()
  name: string; // e.g. "Grade 1 Day Fee Structure"

  @Field(() => ID, { description: 'The ID of the academic year' })
  @Column()
  academicYearId: string;

  @Field(() => AcademicYear, { description: 'The academic year this fee structure belongs to' })
  @ManyToOne(() => AcademicYear, { eager: true })
  @JoinColumn({ name: 'academicYearId' })
  academicYear: AcademicYear;

  @Field(() => ID, { description: 'The ID of the term' })
  @Column()
  termId: string;

  @Field(() => Term, { description: 'The term this fee structure belongs to' })
  @ManyToOne(() => Term, { eager: true })
  @JoinColumn({ name: 'termId' })
  term: Term;

  @Field(() => ID, { description: 'The ID of the grade level' })
  @Column()
  gradeLevelId: string;

  @Field(() => TenantGradeLevel, { description: 'The grade level this fee structure applies to' })
  @ManyToOne(() => TenantGradeLevel, { eager: true })
  @JoinColumn({ name: 'gradeLevelId' })
  gradeLevel: TenantGradeLevel;

  @Field({ description: 'Indicates if the fee structure is currently active' })
  @Column({ default: true })
  isActive: boolean;

  @Field(() => [FeeStructureItem], { description: 'The fee items in this structure' })
  @OneToMany(() => FeeStructureItem, (item) => item.feeStructure, { cascade: true })
  items: FeeStructureItem[];

  @Field(() => GraphQLISODateTime, { description: 'The date and time when the fee structure was created' })
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => GraphQLISODateTime, { description: 'The date and time when the fee structure was last updated' })
  @UpdateDateColumn()
  updatedAt: Date;
}