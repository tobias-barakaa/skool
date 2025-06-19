// If using TypeORM:
import { Field, HideField, ID } from '@nestjs/graphql';
import { User } from 'src/users/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { CBCLevelSelectionDto } from '../dtos/create-school-setup.dto';

@Entity('cbc_school_selections')
export class CBCSchoolSelectionEntity {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @HideField()
  @Column('uuid')
  userId: string;

  @Column('jsonb')
  @Field(() => [CBCLevelSelectionDto])
  selectedLevels: CBCLevelSelectionDto[];

  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  @Field()
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;


}