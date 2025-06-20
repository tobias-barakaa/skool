// src/school-managers/entities/school-manager.entity.ts
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { School } from '../../school/entities/school.entity';

@ObjectType()
@Entity()
export class SchoolManager {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column({ nullable: true })
  @Field({ nullable: true })
  title?: string; // Mr, Mrs, Dr, etc.

  @Column()
  @Field()
  firstName: string;

  @Column()
  @Field()
  lastName: string;

  @Column({ nullable: true })
  @Field({ nullable: true })
  phoneNumber?: string;

  @Column({ nullable: true })
  @Field({ nullable: true })
  position?: string; // Principal, Administrator, etc.

  @OneToOne(() => User, (user) => user.managerProfile, { onDelete: 'CASCADE' })
  @JoinColumn()
  @Field(() => User)
  user: User;

  @OneToOne(() => School, (school: School) => school.manager, { nullable: true })
  @Field(() => School, { nullable: true })
  school?: School;

  @CreateDateColumn()
  @Field(() => Date)
  createdAt: Date;

  @UpdateDateColumn()
  @Field(() => Date)
  updatedAt: Date;
}