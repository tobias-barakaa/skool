import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class SelectedSchoolStructure {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  schoolType: string; // e.g. "CBC"

  @Column("jsonb")
  menuItems: string[];

  @Column("jsonb")
  levels: any; 

  @CreateDateColumn()
  createdAt: Date;
}
