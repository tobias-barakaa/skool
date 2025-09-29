import { Field, ID, ObjectType, Float, GraphQLISODateTime } from "@nestjs/graphql";
import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, Index } from "typeorm";
import { Invoice } from "./invoice.entity";
import { FeeBucket } from "../../fee-bucket/entities/fee-bucket.entity";

@Entity('invoice_items')
@ObjectType({ description: 'Represents individual line items on an invoice' })
@Index(['tenantId', 'invoiceId'])
export class InvoiceItem {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  tenantId: string;

  @Field(() => ID)
  @Column()
  invoiceId: string;

  @Field(() => Invoice)
  @ManyToOne(() => Invoice, invoice => invoice.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoiceId' })
  invoice: Invoice;

  @Field(() => ID)
  @Column()
  feeBucketId: string;

  @Field(() => FeeBucket)
  @ManyToOne(() => FeeBucket, { eager: true })
  @JoinColumn({ name: 'feeBucketId' })
  feeBucket: FeeBucket;

  @Field()
  @Column()
  description: string;

  @Field(() => Float)
  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @Field()
  @Column({ default: true })
  isMandatory: boolean;

  @Field(() => GraphQLISODateTime)
  @CreateDateColumn()
  createdAt: Date;
}
