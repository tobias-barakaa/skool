import { Field, ID, ObjectType, Float, GraphQLISODateTime } from "@nestjs/graphql";
import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { FeeStructure } from "../../fee-structure/entities/fee-structure.entity";
import { FeeBucket } from "../../fee-bucket/entities/fee-bucket.entity";

@Entity('fee_structure_items')
@ObjectType({ description: 'Represents individual fee items within a fee structure' })
@Index(['tenantId', 'feeStructureId'])
@Index(['tenantId', 'feeBucketId'])
export class FeeStructureItem {
  @Field(() => ID, { description: 'The unique identifier of the fee structure item' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field({ description: 'The ID of the tenant this fee structure item belongs to' })
  @Column()
  tenantId: string;

  @Field(() => FeeStructure, { description: 'The fee structure this item belongs to' })
  @ManyToOne(() => FeeStructure, (structure) => structure.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'feeStructureId' })
  feeStructure: FeeStructure;

  @Field(() => ID, { description: 'The ID of the fee structure' })
  @Column()
  feeStructureId: string;

  @Field(() => FeeBucket, { description: 'The fee bucket this item belongs to' })
  @ManyToOne(() => FeeBucket, { eager: true })
  @JoinColumn({ name: 'feeBucketId' })
  feeBucket: FeeBucket;

  @Field(() => ID, { description: 'The ID of the fee bucket' })
  @Column()
  feeBucketId: string;

  @Field(() => Float, { description: 'The amount for this fee item' })
  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @Field({ description: 'Indicates if this fee item is mandatory' })
  @Column({ default: true })
  isMandatory: boolean; 

  @Field(() => GraphQLISODateTime, { description: 'When this fee item was created' })
  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @Field(() => GraphQLISODateTime, { description: 'When this fee item was last updated' })
  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}