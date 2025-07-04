import { Field, ObjectType } from '@nestjs/graphql';
import { User } from 'src/users/entities/user.entity';

@ObjectType()
export class StudentWithTenant {
  @Field()
  id: string;

  @Field()
  admission_number: string;

  @Field()
  phone: string;

  @Field()
  gender: string;

  @Field()
  grade: string;

  @Field()
  user_id: string;

  @Field()
  feesOwed: number;

  @Field()
  totalFeesPaid: number;

  @Field()
  createdAt: Date;

  @Field()
  isActive: boolean;

  @Field()
  updatedAt: Date;

  @Field({ nullable: true })
  streamId?: string;

  @Field(() => User)
  user: User;

  @Field()
  tenantId: string;
}
