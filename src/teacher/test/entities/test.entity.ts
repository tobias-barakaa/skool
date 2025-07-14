import { Field, ObjectType, ID } from '@nestjs/graphql';
import { User } from 'src/admin/users/entities/user.entity';
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Question } from './question.entity';
import { ReferenceMaterial } from './reference-material.entity';

@ObjectType()
@Entity()
export class Test {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  title: string;

  @Field()
  @Column()
  subject: string;

  @Field()
  @Column()
  grade: string;

  @Field()
  @Column()
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
  @Column({ nullable: true, type: 'text' })
  instructions?: string;

  @Field()
  @Column({ default: 'draft' })
  status: 'draft' | 'active' | 'archived';

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.tests)
  teacher: User;

  @Field(() => [Question])
  @OneToMany(() => Question, (question) => question.test)
  questions: Question[];

  @Field(() => [ReferenceMaterial])
  @OneToMany(() => ReferenceMaterial, (rm) => rm.test, { cascade: true })
  referenceMaterials: ReferenceMaterial[];

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
