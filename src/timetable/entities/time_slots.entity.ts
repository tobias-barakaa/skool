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
  import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
  import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
  
  @ObjectType()
  @Entity('time_slots')
  @Unique(['tenantId', 'periodNumber'])
  @Index(['tenantId', 'periodNumber'])
  export class TimeSlot {
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
  
    @Field(() => Int)
    @Column({ type: 'int' })
    periodNumber: number; // 1, 2, 3, 4, etc.
  
    @Field()
    @Column({ type: 'varchar', length: 50 })
    displayTime: string; // "8:00 AM – 8:45 AM"
  
    @Field()
    @Column({ type: 'time' })
    startTime: string; // "08:00:00"
  
    @Field()
    @Column({ type: 'time' })
    endTime: string; // "08:45:00"
  
    @Field({ nullable: true })
    @Column({ type: 'varchar', length: 20, nullable: true })
    color?: string; // For UI purposes
  
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
  