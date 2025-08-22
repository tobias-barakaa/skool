import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID, Float } from '@nestjs/graphql';


@ObjectType()
@Entity('marks')
@Index(['tenantId', 'studentId', 'assessmentId'], { unique: true })
export class Mark {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => ID)
  @Column('uuid')
  tenantId: string;

  @Field(() => ID)
  @Column('uuid')
  studentId: string;

  @Field(() => ID)
  @Column('uuid')
  assessmentId: string;

  @Field(() => Float)
  @Column('decimal', { precision: 5, scale: 2 })
  score: number;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
