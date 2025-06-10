import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Unique, OneToOne, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from 'src/users/entities/user.entity';
import { ColorPalette } from 'src/color-palletes/entities/color-palette.entity';

@Entity('schools') 
@Unique(['subdomain']) 
@ObjectType()
export class School {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column({ unique: true })
  @Field()
  name: string;

  @Column({ nullable: true })
  @Field({ nullable: true, description: 'Optional unique subdomain for the school' })
  subdomain: string;

  @Column({ nullable: true })
  @Field({ nullable: true })
  logoUrl: string;

  @Field(() => ColorPalette, { nullable: true })
  @OneToOne(() => ColorPalette, { cascade: true })
  @JoinColumn()
  colorPalette?: ColorPalette;

  @Column({ default: '#ffffff' }) 
  @Field()
  secondaryColor: string;

  @Column({ nullable: true })
  @Field({ nullable: true })
  contactEmail: string;

  @Column({ type: 'jsonb', nullable: true }) 
  @Field(() => [String], { nullable: true, description: 'Example: ["Fall 2024", "Spring 2025"]' })
  termDates: string[]; 

  @OneToMany(() => User, user => user.school)
  users: User[]; 
}






