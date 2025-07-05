import { Entity, PrimaryGeneratedColumn, ManyToOne, ManyToMany, JoinTable, CreateDateColumn, UpdateDateColumn, Column } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { School } from '../../school/entities/school.entity';
import { Level } from '../../level/entities/level.entities';
import { IsBoolean } from 'class-validator';

@ObjectType()
@Entity()
export class SchoolLevelSetting {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => School)
  @ManyToOne(() => School, school => school.levelSettings, { onDelete: 'CASCADE' })
  school: School;

  @Field(() => [Level])
  @ManyToMany(() => Level)
  @JoinTable()
  selectedLevels: Level[];

  @Field()
  @CreateDateColumn()
  createdAt: Date;



  @Field()
  @Column({ default: true }) 
  @IsBoolean()
  isActive: boolean;

    @Field()
    @UpdateDateColumn()
  updatedAt: Date


}

