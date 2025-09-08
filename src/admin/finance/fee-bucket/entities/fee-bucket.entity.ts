import { Field, ID, ObjectType, GraphQLISODateTime } from "@nestjs/graphql";
import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, Unique } from "typeorm";

@Entity('fee_buckets')
@ObjectType({ description: 'Represents a fee category/bucket like Tuition, Transport, etc.' })
@Unique(['tenantId', 'name'])
@Index(['tenantId'])
export class FeeBucket {
  @Field(() => ID, { description: 'The unique identifier of the fee bucket' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field({ description: 'The ID of the tenant this fee bucket belongs to' })
  @Column()
  tenantId: string;

  @Field({ description: 'The name of the fee bucket' })
  @Column()
  name: string; 

  @Field({ nullable: true, description: 'Description of the fee bucket' })
  @Column({ nullable: true })
  description?: string;

  @Field({ description: 'Indicates if the fee bucket is currently active' })
  @Column({ default: true })
  isActive: boolean;

  @Field(() => GraphQLISODateTime, { description: 'The date and time when the fee bucket was created' })
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => GraphQLISODateTime, { description: 'The date and time when the fee bucket was last updated' })
  @UpdateDateColumn()
  updatedAt: Date;
}