import { Field, ID, ObjectType } from "@nestjs/graphql";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Scholarship } from "./scholarship.entity";
import { Student } from "src/admin/student/entities/student.entity";

@Entity('student_scholarships')
@ObjectType()
export class StudentScholarship {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @ManyToOne(() => Scholarship, (s) => s.studentScholarships, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'scholarship_id' })
  @Field(() => Scholarship)
  scholarship: Scholarship;

  @ManyToOne(() => Student, (student) => student.scholarships, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'student_id' })
  @Field(() => Student)
  student: Student;

  @Column()
  @Field()
  academicYear: string;

  @Column({ default: 'ACTIVE' })
  @Field()
  status: string;

  @CreateDateColumn()
  @Field(() => Date)
  awardedAt: Date;
}

