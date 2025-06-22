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

@ObjectType()
@Entity()
export class SchoolConfig {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => School)
  @OneToOne(() => School, { eager: true })
  @JoinColumn()
  school: School;

  @Field(() => [SchoolLevel])
  @ManyToMany(() => SchoolLevel, { cascade: true })
  @JoinTable()
  selectedLevels: SchoolLevel[];

  @Field(() => Date)
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Field(() => Date)
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;


}
