import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { ColorPalette } from '../../color-palettes/entities/color-palette.entity';
import { SchoolStatus } from '../enums/school-status.enum';
import { SubscriptionPlan } from '../enums/subscription.enum';


registerEnumType(SchoolStatus, { name: 'SchoolStatus' });
registerEnumType(SubscriptionPlan, { name: 'SubscriptionPlan' });

@ObjectType()
@Entity('schools')
export class School {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ length: 200 })
  name: string;

  @Field({ nullable: true })
  @Column({ unique: true, nullable: true })
  subdomain?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  logo?: string;

  @Field({ nullable: true })
  @Column({ length: 255, nullable: true })
  email?: string;

  @Field({ nullable: true })
  @Column({ length: 20, nullable: true })
  phoneNumber?: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  address?: string;

  @Field({ nullable: true })
  @Column({ length: 100, nullable: true })
  city?: string;

  @Field({ nullable: true })
  @Column({ length: 100, nullable: true })
  state?: string;

  @Field({ nullable: true })
  @Column({ length: 20, nullable: true })
  zipCode?: string;

  @Field({ nullable: true })
  @Column({ length: 100, nullable: true })
  country?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  website?: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @Field(() => SchoolStatus)
  @Column({
    type: 'enum',
    enum: SchoolStatus,
    default: SchoolStatus.TRIAL,
  })
  status: SchoolStatus;

  @Field(() => SubscriptionPlan)
  @Column({
    type: 'enum',
    enum: SubscriptionPlan,
    default: SubscriptionPlan.BASIC,
  })
  subscriptionPlan: SubscriptionPlan;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  subscriptionExpiresAt?: Date;

  @Field({ nullable: true })
  @Column({ type: 'date', nullable: true })
  academicYearStart?: Date;

  @Field({ nullable: true })
  @Column({ type: 'date', nullable: true })
  academicYearEnd?: Date;

  @Field(() => [User])
  @OneToMany(() => User, user => user.school)
  users: User[];

  @Field(() => ColorPalette, { nullable: true })
  @OneToOne(() => ColorPalette, { cascade: true })
  @JoinColumn()
  colorPalette?: ColorPalette;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  @Field()
  get totalUsers(): number {
    return this.users?.length || 0;
  }
}