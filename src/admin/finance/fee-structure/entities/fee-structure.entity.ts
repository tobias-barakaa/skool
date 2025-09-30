import { ObjectType, Field, ID } from '@nestjs/graphql';
import { AcademicYear } from 'src/admin/academic_years/entities/academic_years.entity';
import { Term } from 'src/admin/academic_years/entities/terms.entity';
import { TenantGradeLevel } from 'src/admin/school-type/entities/tenant-grade-level';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { FeeStructureItem } from '../../fee-structure-item/entities/fee-structure-item.entity';


@Entity('fee_structures')
@ObjectType()
export class FeeStructure {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column()
  tenantId: string;

  @Field()
  @Column()
  academicYearId: string;

  @Field(() => AcademicYear)
  @ManyToOne(() => AcademicYear)
  @JoinColumn({ name: 'academicYearId' })
  academicYear: AcademicYear;

  @Field(() => [Term])
  @ManyToMany(() => Term)
  @JoinTable({
    name: 'fee_structure_terms',
    joinColumn: { name: 'fee_structure_id' },
    inverseJoinColumn: { name: 'term_id' }
  })
  terms: Term[];

  @Field(() => [TenantGradeLevel], { nullable: true })
  @ManyToMany(() => TenantGradeLevel)
  @JoinTable({
    name: 'fee_structure_grade_levels',
    joinColumn: { name: 'fee_structure_id' },
    inverseJoinColumn: { name: 'grade_level_id' }
  })
  gradeLevels?: TenantGradeLevel[];

  @Field(() => [FeeStructureItem], { nullable: true })
  @OneToMany(() => FeeStructureItem, item => item.feeStructure)
  items?: FeeStructureItem[];

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

// import { Field, ID, ObjectType, GraphQLISODateTime } from "@nestjs/graphql";
// import {
//   Column,
//   Entity,
//   PrimaryGeneratedColumn,
//   OneToMany,
//   ManyToOne,
//   JoinColumn,
//   CreateDateColumn,
//   UpdateDateColumn,
//   Index,
//   Unique,
//   ManyToMany,
//   JoinTable
// } from "typeorm";
// import { AcademicYear } from "src/admin/academic_years/entities/academic_years.entity";
// import { Term } from "src/admin/academic_years/entities/terms.entity";
// import { TenantGradeLevel } from "src/admin/school-type/entities/tenant-grade-level";
// import { FeeStructureItem } from "../../fee-structure-item/entities/fee-structure-item.entity";

// @Entity('fee_structures')
// @ObjectType({ description: 'Represents a fee structure for specific grades, terms and academic year' })
// @Unique(['tenantId', 'academicYearId', 'name']) 
// export class FeeStructure {
//   @Field(() => ID, { description: 'The unique identifier of the fee structure' })
//   @PrimaryGeneratedColumn('uuid')
//   id: string;

//   @Field({ description: 'The ID of the tenant this fee structure belongs to' })
//   @Column()
//   tenantId: string;

//   @Field({ description: 'The name of the fee structure' })
//   @Column()
//   name: string;

//   @Field(() => ID, { description: 'The ID of the academic year' })
//   @Column()
//   academicYearId: string;

//   @Field(() => AcademicYear, { description: 'The academic year this fee structure belongs to' })
//   @ManyToOne(() => AcademicYear, { eager: true })
//   @JoinColumn({ name: 'academicYearId' })
//   academicYear: AcademicYear;


//   @Field(() => [Term], { description: 'The terms this fee structure applies to' })
//   @ManyToMany(() => Term, { eager: true })
//   @JoinTable({
//     name: 'fee_structure_terms',
//     joinColumn: { name: 'fee_structure_id', referencedColumnName: 'id' },
//     inverseJoinColumn: { name: 'term_id', referencedColumnName: 'id' },
//   })
//   terms: Term[];

//   @Field(() => [TenantGradeLevel], {
//     description: 'The grade levels this fee structure applies to',
//     nullable: true,
//   })
//   @ManyToMany(() => TenantGradeLevel, { eager: true })
//   @JoinTable({
//     name: 'fee_structure_grade_levels',
//     joinColumn: { name: 'fee_structure_id', referencedColumnName: 'id' },
//     inverseJoinColumn: { name: 'grade_level_id', referencedColumnName: 'id' },
//   })
//   gradeLevels?: TenantGradeLevel[];

//   @Field({ description: 'Indicates if the fee structure is currently active' })
//   @Column({ default: true })
//   isActive: boolean;

//   @Field(() => [FeeStructureItem], { description: 'The fee items in this structure' })
//   @OneToMany(() => FeeStructureItem, (item) => item.feeStructure, { cascade: true })
//   items: FeeStructureItem[];

//   @Field(() => GraphQLISODateTime, { description: 'The date and time when the fee structure was created' })
//   @CreateDateColumn()
//   createdAt: Date;

//   @Field(() => GraphQLISODateTime, { description: 'The date and time when the fee structure was last updated' })
//   @UpdateDateColumn()
//   updatedAt: Date;
// }



// import { Field, ID, ObjectType, GraphQLISODateTime } from "@nestjs/graphql";
// import {
//   Column,
//   Entity,
//   PrimaryGeneratedColumn,
//   OneToMany,
//   ManyToOne,
//   JoinColumn,
//   CreateDateColumn,
//   UpdateDateColumn,
//   Index,
//   Unique,
//   ManyToMany,
//   JoinTable
// } from "typeorm";
// import { AcademicYear } from "src/admin/academic_years/entities/academic_years.entity";
// import { Term } from "src/admin/academic_years/entities/terms.entity";
// import { TenantGradeLevel } from "src/admin/school-type/entities/tenant-grade-level";
// import { FeeStructureItem } from "../../fee-structure-item/entities/fee-structure-item.entity";

// @Entity('fee_structures')
// @ObjectType({ description: 'Represents a fee structure for specific grades, terms and academic year' })
// @Unique(['tenantId', 'academicYearId', 'name']) 
// export class FeeStructure {
//   @Field(() => ID, { description: 'The unique identifier of the fee structure' })
//   @PrimaryGeneratedColumn('uuid')
//   id: string;

//   @Field({ description: 'The ID of the tenant this fee structure belongs to' })
//   @Column()
//   tenantId: string;

//   @Field({ description: 'The name of the fee structure' })
//   @Column()
//   name: string;

//   @Field(() => ID, { description: 'The ID of the academic year' })
//   @Column()
//   academicYearId: string;

//   @Field(() => AcademicYear, { description: 'The academic year this fee structure belongs to' })
//   @ManyToOne(() => AcademicYear)
//   @JoinColumn({ name: 'academicYearId' })
//   academicYear: AcademicYear;

//   @Field(() => [Term], { description: 'The terms this fee structure applies to' })
//   @ManyToMany(() => Term)
//   @JoinTable({
//     name: 'fee_structure_terms',
//     joinColumn: { name: 'fee_structure_id', referencedColumnName: 'id' },
//     inverseJoinColumn: { name: 'term_id', referencedColumnName: 'id' },
//   })
//   terms: Term[];

//   @Field(() => [TenantGradeLevel], {
//     description: 'The grade levels this fee structure applies to',
//     nullable: true,
//   })
//   @ManyToMany(() => TenantGradeLevel)
//   @JoinTable({
//     name: 'fee_structure_grade_levels',
//     joinColumn: { name: 'fee_structure_id', referencedColumnName: 'id' },
//     inverseJoinColumn: { name: 'grade_level_id', referencedColumnName: 'id' },
//   })
//   gradeLevels?: TenantGradeLevel[];

//   @Field({ description: 'Indicates if the fee structure is currently active' })
//   @Column({ default: true })
//   isActive: boolean;

//   @Field(() => [FeeStructureItem], { description: 'The fee items in this structure' })
//   @OneToMany(() => FeeStructureItem, (item) => item.feeStructure, { cascade: true })
//   items: FeeStructureItem[];

//   @Field(() => GraphQLISODateTime, { description: 'The date and time when the fee structure was created' })
//   @CreateDateColumn()
//   createdAt: Date;

//   @Field(() => GraphQLISODateTime, { description: 'The date and time when the fee structure was last updated' })
//   @UpdateDateColumn()
//   updatedAt: Date;
// }