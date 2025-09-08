import { Field, ID, ObjectType } from "@nestjs/graphql";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Index, Unique } from "typeorm";
import { Term } from "./terms.entity";

@Entity('academic_years')
@ObjectType()
@Unique(['tenantId', 'name'])
@Index(['tenantId', 'startDate'])
export class AcademicYear {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  tenantId: string;

  @Field()
  @Column()
  name: string; 

  @Field(() => Date)
  @Column({ type: 'date' })
  startDate: Date;

  @Field(() => Date)
  @Column({ type: 'date' })
  endDate: Date;

  @Field()
  @Column({ default: true })
  isActive: boolean;

  @Field(() => Date)
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Field(() => Date)
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Field(() => [Term], { nullable: true })
  @OneToMany(() => Term, (term) => term.academicYear, { cascade: true })
  terms?: Term[];
}