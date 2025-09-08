import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Test } from './test.entity';

@ObjectType()
@Entity()
export class ReferenceMaterial {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  fileUrl: string;

  @Field()
  @Column()
  fileType: 'pdf' | 'doc' | 'txt' | 'image';

  @Field({ nullable: true })
  @Column({ nullable: true })
  fileSize: number;

  @Field(() => Test)
  @ManyToOne(() => Test, (test) => test.referenceMaterials)
  test: Test;

  @Field()
  @CreateDateColumn()
  createdAt: Date;
}