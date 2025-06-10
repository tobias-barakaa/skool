import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
@Entity('color_palettes')
export class ColorPalette {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ length: 100, default: 'Default Palette' })
  name: string;

  @Field()
  @Column({ length: 7, default: '#1976D2' }) 
  primary: string;

  @Field()
  @Column({ length: 7, default: '#DC004E' }) 
  secondary: string;

  @Field()
  @Column({ length: 7, default: '#4CAF50' })
  success: string;

  @Field()
  @Column({ length: 7, default: '#FF9800' }) 
  warning: string;

  @Field()
  @Column({ length: 7, default: '#F44336' }) 
  error: string;

  @Field()
  @Column({ length: 7, default: '#9E9E9E' }) 
  info: string;

  @Field()
  @Column({ length: 7, default: '#FFFFFF' }) 
  background: string;

  @Field()
  @Column({ length: 7, default: '#FAFAFA' }) 
  surface: string;

  @Field()
  @Column({ length: 7, default: '#212121' }) 
  textPrimary: string;

  @Field()
  @Column({ length: 7, default: '#757575' }) 
  textSecondary: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  customCss?: string;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}