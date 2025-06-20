import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
  } from 'typeorm';
  import { ObjectType, Field, ID } from '@nestjs/graphql';
import { CBCLevelSelectionDto } from 'src/school-type/dtos/create-school-setup.dto';
import { Subject } from '../../subject/entities/subject.entity';
  
  @ObjectType()
  @Entity()
  export class SchoolSetup {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    setupId: string;
  
    @Field()
    @Column()
    schoolName: string;
  
    @Field()
    @Column()
    schoolSlug: string; 
  
    @Field({ nullable: true })
    @Column({ nullable: true })
    description?: string;
  
    @Field(() => [CBCLevelSelectionDto]) 
    @Column('jsonb')
    selectedLevels: CBCLevelSelectionDto[]; 
  
    @Field()
    @Column()
    createdBy: string;
  
    @Field()
    @Column({ default: true })
    isActive: boolean;
  
    @Field()
    @CreateDateColumn()
    createdAt: Date;
  
    @Field()
    @UpdateDateColumn()
    updatedAt: Date;
  
    // Relations
    @Field(() => [Subject])
    @OneToMany(() => Subject, (subject) => subject.school)
    subjects: Subject[];
  }
  