/ src/users/entities/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { School } from '../../schools/entities/school.entity';


registerEnumType(UserRole, { name: 'UserRole' });
registerEnumType(UserStatus, { name: 'UserStatus' });

@ObjectType()
@Entity('users')
@Index(['email', 'schoolId'], { unique: true })
export class User {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ length: 100 })
  firstName: string;

  @Field()
  @Column({ length: 100 })
  lastName: string;

  @Field()
  @Column({ length: 255 })
  email: string;

  @Column()
  password: string;

  @Field(() => UserRole)
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STUDENT,
  })
  role: UserRole;

  @Field(() => UserStatus)
  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING,
  })
  status: UserStatus;

  @Field({ nullable: true })
  @Column({ nullable: true })
  avatar?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  phoneNumber?: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Field()
  @Column({ type: 'uuid' })
  schoolId: string;

  @Field(() => School)
  @ManyToOne(() => School, school => school.users, { eager: true })
  school: School;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt?: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  emailVerifiedAt?: Date;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual field for full name
  @Field()
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}