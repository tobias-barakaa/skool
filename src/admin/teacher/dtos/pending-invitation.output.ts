// dtos/pending-invitation.output.ts
import { Field, ObjectType } from '@nestjs/graphql';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { InvitationStatus } from 'src/admin/invitation/entities/user-iInvitation.entity';
import { User } from 'src/admin/users/entities/user.entity';

@ObjectType()
export class PendingInvitation {
  @Field()
  id: string;

  @Field()
  email: string;

  @Field()
  role: string;

  @Field(() => InvitationStatus)
  status: InvitationStatus;

  @Field()
  createdAt: Date;

  @Field(() => User, { nullable: true })
  invitedBy?: User;
}
