import { ObjectType, Field, ID } from '@nestjs/graphql';
import {
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { SchoolLevel } from './school_level.entity';
import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
import { SchoolType } from './school-type';
import { SchoolConfigLevel } from './school_config_level';

@ObjectType()
@Entity()
export class SchoolConfig {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @OneToOne(() => Tenant, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn()
  tenant: Tenant;
  @ManyToOne(() => SchoolType, { eager: true })
  @JoinColumn()
  schoolType: SchoolType;

  @Field(() => Boolean)
  @Column({ default: true })
  isActive: boolean;

  @Field(() => [SchoolConfigLevel], { nullable: true })
  @OneToMany(() => SchoolConfigLevel, (configLevel) => configLevel.schoolConfig)
  configLevels: SchoolConfigLevel[];

  @Field(() => Date)
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Field(() => Date)
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}



// @ObjectType()
// @Entity()
// export class SchoolConfig {
//   @Field(() => ID)
//   @PrimaryGeneratedColumn('uuid')
//   id: string;

//   @OneToOne(() => Tenant, { eager: true, onDelete: 'CASCADE' })
//   @JoinColumn()
//   tenant: Tenant;

//   @ManyToOne(() => SchoolType, { eager: true })
//   @JoinColumn()
//   schoolType: SchoolType;

//   @Field(() => Boolean)
//   @Column({ default: true })
//   isActive: boolean;

//   @Field(() => Date)
//   @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
//   createdAt: Date;

//   @Field(() => Date)
//   @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
//   updatedAt: Date;
// }
