import { Level } from "../../level/entities/level.entities";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class SchoolType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @OneToMany(() => Level, level => level.schoolType, { cascade: true })
  levels: Level[];

  description: string;
  icon: string;
  priority: number;
}
