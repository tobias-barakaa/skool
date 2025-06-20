import { Entity, PrimaryGeneratedColumn, ManyToOne, ManyToMany, JoinTable, CreateDateColumn } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { School } from 'src/school/entities/school.entity';
import { Level } from 'src/level/entities/level.entities';

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
}
