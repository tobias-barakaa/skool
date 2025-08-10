import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { SchoolConfig } from './school-config.entity';
import { Curriculum } from 'src/admin/curriculum/entities/curicula.entity';

@Entity('school_config_curriculum')
export class SchoolConfigCurriculum {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SchoolConfig, (sc) => sc.configCurricula, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'schoolConfigId' })
  schoolConfig: SchoolConfig;

  @ManyToOne(() => Curriculum, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'curriculumId' })
  curriculum: Curriculum;
}
