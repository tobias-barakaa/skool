import { Field, ID, ObjectType } from "@nestjs/graphql";
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { StudentScholarship } from "./scholarship_assignments.entity";

@ObjectType()
@Entity('scholarships')
export class Scholarship {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Field()
  @Column()
  name: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description?: string;

  @Field()
  @Column({ type: 'float' })
  amount: number;

  @Field()
  @Column({ default: 'FIXED' }) 
  type: string;

  @OneToMany(() => StudentScholarship, (ss) => ss.scholarship)
  @Field(() => [StudentScholarship], { nullable: true })
  studentScholarships?: StudentScholarship[];

  @Field()
  @Column('uuid')
  tenantId: string;

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date;


}
