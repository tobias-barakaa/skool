import { ObjectType, Field, ID } from '@nestjs/graphql';
import { School } from 'src/school/entities/school.entity';
import {
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';
import { SchoolLevel } from './school_level.entity';
import { Tenant } from 'src/tenants/entities/tenant.entity';

@ObjectType()
@Entity()
export class SchoolConfig {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Tenant, { eager: true, onDelete: 'CASCADE' })
@JoinColumn()
tenant: Tenant;

  @Field(() => [SchoolLevel])
  @ManyToMany(() => SchoolLevel, { cascade: true })
  @JoinTable()
  selectedLevels: SchoolLevel[];

  @Field()
  @Column({ default: true })
  isActive: boolean; 

  @Field(() => Date)
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Field(() => Date)
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;


}
