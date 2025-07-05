import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Field, ObjectType, ID } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { Student } from '../../student/entities/student.entity';
import { Teacher } from '../../teacher/entities/teacher.entity';
import { SchoolTypeConfig } from '../../school/dtos/school-type-config';

@ObjectType()
@Entity('organizations')
export class Organization {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ unique: true })
  subdomain: string;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column({ type: 'enum', enum: ['CBC', 'INTERNATIONAL', 'MADRASA', 'HOMESCHOOL'] })
  schoolType: string;

  @Field()
  @Column({ type: 'jsonb' })
  schoolConfig: SchoolTypeConfig; 

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