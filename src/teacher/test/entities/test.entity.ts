// src/tests/entities/test.entity.ts
import { Field, GraphQLISODateTime, ID, ObjectType } from '@nestjs/graphql';
import { User } from 'src/admin/users/entities/user.entity';
import { Question } from './question.entity';
import { ReferenceMaterial } from './reference-material.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TenantSubject } from 'src/admin/school-type/entities/tenant-specific-subject';
import { TenantGradeLevel } from 'src/admin/school-type/entities/tenant-grade-level';

@ObjectType()
@Entity()
export class Test {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  title: string;

  @Field(() => TenantSubject)
  @ManyToOne(() => TenantSubject, { eager: true })
  subject: TenantSubject;

  @Field(() => [TenantGradeLevel])
  @ManyToMany(() => TenantGradeLevel, { eager: true })
  @JoinTable({
    name: 'test_tenant_grade_levels',
    joinColumn: { name: 'test_id', referencedColumnName: 'id' },
    inverseJoinColumn: {
      name: 'tenant_grade_level_id',
      referencedColumnName: 'id',
    },
  })
  gradeLevels: TenantGradeLevel[];

  @Field(() => GraphQLISODateTime)
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  date: Date;

  @Field()
  @Column()
  startTime: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  endTime?: string;

  @Field()
  @Column()
  duration: number;

  @Field()
  @Column()
  totalMarks: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  resourceUrl?: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  instructions?: string;

  @Field()
  @Column({ default: 'pending' })
  status: 'pending' | 'active' | 'completed';

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.tests)
  teacher: User;

  @Field(() => [Question])
  @OneToMany(() => Question, (q) => q.test)
  questions: Question[];

  @Field(() => [ReferenceMaterial])
  @OneToMany(() => ReferenceMaterial, (rm) => rm.test, { cascade: true })
  referenceMaterials: ReferenceMaterial[];

  @CreateDateColumn()
  @Field(() => Date)
  createdAt: Date;

  @UpdateDateColumn()
  @Field(() => Date)
  updatedAt: Date;
}


// import { Field, ObjectType, ID } from '@nestjs/graphql';
// import { User } from 'src/admin/users/entities/user.entity';
// import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
// import { Question } from './question.entity';
// import { ReferenceMaterial } from './reference-material.entity';
// import { GradeLevel } from 'src/admin/level/entities/grade-level.entity';

// @ObjectType()
// @Entity()
// export class Test {
//   @Field(() => ID)
//   @PrimaryGeneratedColumn('uuid')
//   id: string;

//   @Field()
//   @Column()
//   title: string;

//   @Field()
//   @Column()
//   subject: string;

//   @ManyToMany(() => GradeLevel, { eager: true })
//   @JoinTable({
//     name: 'test_grade_levels',
//     joinColumn: {
//       name: 'test_id',
//       referencedColumnName: 'id',
//     },
//     inverseJoinColumn: {
//       name: 'grade_level_id',
//       referencedColumnName: 'id',
//     },
//   })
//   @Field(() => [GradeLevel])
//   gradeLevels: GradeLevel[];

//   @Field()
//   @Column()
//   date: Date;

//   @Field()
//   @Column()
//   startTime: string;

//   @Field({ nullable: true })
//   @Column({ nullable: true })
//   endTime?: string;

//   @Field()
//   @Column()
//   duration: number;

//   @Field()
//   @Column()
//   totalMarks: number;

//   @Field({ nullable: true })
//   @Column({ nullable: true })
//   resourceUrl?: string;

//   @Field({ nullable: true })
//   @Column({ nullable: true, type: 'text' })
//   instructions?: string;

//   @Field()
//   @Column({ default: 'draft' })
//   status: 'draft' | 'active' | 'archived';

//   @Field(() => User)
//   @ManyToOne(() => User, (user) => user.tests)
//   teacher: User;

//   @Field(() => [Question])
//   @OneToMany(() => Question, (question) => question.test)
//   questions: Question[];

//   @Field(() => [ReferenceMaterial])
//   @OneToMany(() => ReferenceMaterial, (rm) => rm.test, { cascade: true })
//   referenceMaterials: ReferenceMaterial[];

//   @Field()
//   @CreateDateColumn()
//   createdAt: Date;

//   @Field()
//   @UpdateDateColumn()
//   updatedAt: Date;
// }
