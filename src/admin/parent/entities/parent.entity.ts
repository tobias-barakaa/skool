import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { ParentStudent } from './parent-student.entity';
import { User } from 'src/admin/users/entities/user.entity';

@ObjectType()
@Entity('parents')
export class Parent {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column({ unique: true })
  email: string;

  @Field()
  @Column()
  phone: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  address?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  occupation?: string;

  @OneToOne(() => User, { nullable: true })
  @JoinColumn()
  @Field(() => User, { nullable: true })
  user?: User;

  

  @Column({ nullable: true })
  userId?: string;

  @Field(() => ID)
  @Column('uuid')
  tenantId: string;

  @Field(() => [ParentStudent])
  @OneToMany(() => ParentStudent, (parentStudent) => parentStudent.parent)
  parentStudents: ParentStudent[];

  @Field()
  @Column({ default: true })
  isActive: boolean;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
