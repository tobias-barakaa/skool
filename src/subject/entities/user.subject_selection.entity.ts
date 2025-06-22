import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { UserSchoolSelection } from "../../school-type/entities/user.school-selection.entity";
import { CurriculumSubject } from "src/curriculum/entities/curriculum_subjects.entity";

@Entity('user_subject_selections')
export class UserSubjectSelection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => UserSchoolSelection)
  schoolSelection: UserSchoolSelection;

  @ManyToOne(() => CurriculumSubject)
  curriculumSubject: CurriculumSubject;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  selectedAt: Date;
}
