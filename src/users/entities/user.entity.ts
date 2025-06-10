import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { UserRole } from '../enums/user-role.enum';
import { School } from '../../school/entities/school.entity'; 

@Entity('users')
@ObjectType()
export class User {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column({ unique: true })
  @Field()
  email: string;

  @Column()
  @Field()
  username: string; 

  @Column({ select: false })
  password_hash: string;

  @Column({ type: 'enum', enum: UserRole })
  @Field(() => UserRole)
  userRole: UserRole;

  @Column({ type: 'uuid' })
  @Field(() => ID)
  schoolId: string;

  @ManyToOne(() => School, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schoolId' })
  @Field(() => School)
  school: School;
}