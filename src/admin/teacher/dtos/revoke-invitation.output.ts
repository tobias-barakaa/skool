// dtos/revoke-invitation.output.ts
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class RevokeInvitationResponse {
  @Field()
  message: string;
}
