import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { Test } from './test.entity';
import { Option } from './option.entity';

@ObjectType()
@Entity()
export class Question {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  text: string;

  @Field(() => [String], { nullable: true })
  @Column('simple-array', { nullable: true })
  imageUrls?: string[];

  @Field()
  @Column()
  marks: number;

  @Field()
  @Column()
  order: number;

  @Field()
  @Column({ default: 'multiple_choice' })
  type: 'multiple_choice' | 'short_answer' | 'true_false';

  @Field({ nullable: true })
  @Column({ nullable: true })
  aiPrompt?: string;

  @Field()
  @Column({ default: false })
  isAIGenerated: boolean;

  @Field(() => Test)
  @Index()
  @ManyToOne(() => Test, (test) => test.questions)
  test: Test;

  @Field(() => [Option])
  @OneToMany(() => Option, (option) => option.question, { cascade: true })
  options: Option[];
}
