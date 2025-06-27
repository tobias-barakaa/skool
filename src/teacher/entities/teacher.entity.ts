import { Field, ID, ObjectType } from "@nestjs/graphql";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "../../users/entities/user.entity";
import { School } from "../../school/entities/school.entity";

@ObjectType()
@Entity()
export class Teacher {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Field()
  @Column()
  fullName: string;

  @Field()
  @Column()
  firstName: string;

  @Field()
  @Column()
  lastName: string;

  @Field()
  @Column()
  email: string;

  @Field()
  @Column({ type: 'enum', enum: ['MALE', 'FEMALE', 'OTHER'] })
  gender: string;

  @Field()
  @Column()
  department: string;

  @Field()
  @Column()
  phoneNumber: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  address?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  subject?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  employeeId?: string;

  @Field({ nullable: true })
  @Column({ type: 'date', nullable: true })
  dateOfBirth?: Date;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  qualifications?: string;

  @Field({ nullable: true })
  @Column({ default: false })
  isActive: boolean;

  @Field({ nullable: true })
  @Column({ default: false })
  hasCompletedProfile: boolean;

  // @OneToOne(() => User, (user) => user.teacherProfile, { nullable: true })
  // @JoinColumn()
  // @Field(() => User, { nullable: true })
  // user?: User;

  @Column({ nullable: true })
  userId?: string;

  @ManyToOne(() => School, { nullable: true })
  @Field(() => School, { nullable: true })
  school?: School;


  @CreateDateColumn()
  @Field(() => Date)
  createdAt: Date;

  @UpdateDateColumn()
  @Field(() => Date)
  updatedAt: Date;
}

