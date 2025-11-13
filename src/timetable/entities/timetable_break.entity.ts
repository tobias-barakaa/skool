import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    Unique,
  } from 'typeorm';
  import { ObjectType, Field, ID, Int, registerEnumType } from '@nestjs/graphql';
  import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
  
  export enum BreakType {
    SHORT_BREAK = 'short_break',
    LUNCH = 'lunch',
    ASSEMBLY = 'assembly',
  }
  
  registerEnumType(BreakType, { name: 'BreakType' });
  
  @ObjectType()
  @Entity('timetable_breaks')
  @Unique(['tenantId', 'dayOfWeek', 'afterPeriod'])
  @Index(['tenantId', 'dayOfWeek'])
  export class TimetableBreak {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Field()
    @Column()
    @Index()
    tenantId: string;
  
    @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'tenantId' })
    tenant: Tenant;
  
    @Field()
    @Column({ type: 'varchar', length: 100 })
    name: string; // "Morning Break", "Lunch", etc.
  
    @Field(() => BreakType)
    @Column({ type: 'enum', enum: BreakType })
    type: BreakType;
  
    @Field(() => Int)
    @Column({ type: 'int' })
    dayOfWeek: number; // 1-5 (Mon-Fri), 0 means applies to all days
  
    @Field(() => Int)
    @Column({ type: 'int' })
    afterPeriod: number; // Break comes after which period number
  
    @Field(() => Int)
    @Column({ type: 'int' })
    durationMinutes: number;
  
    @Field({ nullable: true })
    @Column({ type: 'varchar', length: 10, nullable: true })
    icon?: string; // "🍽️", "☕"
  
    @Field({ nullable: true })
    @Column({ type: 'varchar', length: 20, nullable: true })
    color?: string;
  
    @Field()
    @Column({ default: true })
    isActive: boolean;
  
    @Field(() => Date)
    @CreateDateColumn()
    createdAt: Date;
  
    @Field(() => Date)
    @UpdateDateColumn()
    updatedAt: Date;
  }
  