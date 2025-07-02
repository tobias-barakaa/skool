// src/students/entities/student.entity.ts
import { Field, ID, ObjectType } from "@nestjs/graphql";
import { Stream } from "src/streams/entities/streams.entity";
import { User } from "src/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@ObjectType()
@Entity('students')
export class Student {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column({ unique: true })
  @Field()
  admission_number: string;

  @Column('uuid')
  @Field(() => ID)
  user_id: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  @Field(() => User)
  user: User;
  

  @Column()
  @Field()
  phone: string;

  @Column()
  @Field()
  gender: string;

  @Column()
  @Field()
  grade: string; 

  @Field()
  @Column({ default: 0 })
  feesOwed: number;

  @Field()
  @Column({ default: 0 })
  totalFeesPaid: number;

  @CreateDateColumn()
  @Field(() => Date)
  createdAt: Date;

  @Field()
  @Column({ default: true })
  isActive: boolean;

  @UpdateDateColumn()
  @Field(() => Date)
  updatedAt: Date;

  @ManyToOne(() => Stream, stream => stream.students, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  stream: Stream;
}



