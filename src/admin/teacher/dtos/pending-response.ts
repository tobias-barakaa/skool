import { ObjectType, Field } from '@nestjs/graphql';
import { InvitationStatus } from 'src/admin/invitation/entities/user-iInvitation.entity';
import GraphQLJSON from 'graphql-type-json';

@ObjectType()
export class PendingInvitationResponse {
  @Field()
  id: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  name?: string;

  @Field(() => InvitationStatus)
  status: InvitationStatus;

  @Field(() => GraphQLJSON, { nullable: true })
  userData?: Record<string, any>;

  @Field({ nullable: true })
  lastSentAt?: Date;
}
