import { Field, ObjectType } from "@nestjs/graphql";
import { UserInvitation } from "src/admin/invitation/entities/user-iInvitation.entity";
import { MembershipRole } from "src/admin/user-tenant-membership/entities/user-tenant-membership.entity";
import { TokensOutput } from "src/admin/users/dtos/tokens.output";
import { User } from "src/admin/users/entities/user.entity";
import { ParentOutput } from "./parent-output";
import { Parent } from "../entities/parent.entity";


@ObjectType()
export class AcceptParentInvitationResponse {
  @Field()
  message: string;

  @Field(() => User)
  user: { id: string; email: string; name: string };

  @Field(() => TokensOutput)
  tokens: TokensOutput;

  @Field(() => Parent)
  parent: Parent;

  // ✅ Add this line:
   @Field(() => UserInvitation)
   invitation: UserInvitation;

  @Field(() => MembershipRole)
  role: MembershipRole;
}
