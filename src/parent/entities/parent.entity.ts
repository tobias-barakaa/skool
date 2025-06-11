// src/parents/entities/parent.entity.ts

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn,
    ManyToOne,
    OneToMany,
  } from 'typeorm';
  import { ObjectType, Field, ID } from '@nestjs/graphql';
  import { User } from 'src/users/entities/user.entity';
import { School } from 'src/school/entities/school.entity';
  
  @ObjectType()
  @Entity()
  export class Parent {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    parentId: string;
  
    @Field()
    @Column()
    firstName: string;
  
    @Field()
    @Column()
    lastName: string;
  
    @Field()
    @Column()
    phoneNumber: string;
  
    @Field({ nullable: true })
    @Column({ nullable: true })
    emergencyContact?: string;
  
    @Field({ nullable: true })
    @Column({ nullable: true })
    occupation?: string;
  
    @Field({ nullable: true })
    @Column({ nullable: true })
    address?: string;
  
    @Field()
    @Column()
    schoolId: string;
  
    // 🔗 Relations
  
    @Field(() => School)
    @ManyToOne(() => School, (school) => school.parents, { onDelete: 'CASCADE' })
    school: School;
  
    @Field(() => User)
    @OneToOne(() => User, { cascade: true })
    @JoinColumn()
    user: User;
  
    @Field(() => [Student])
    @OneToMany(() => Student, (student) => student.parent)
    children: Student[];
  }
  