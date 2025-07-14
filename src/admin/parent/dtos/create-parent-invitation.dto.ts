import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { TokensOutput } from 'src/admin/users/dtos/tokens.output';
import { User } from 'src/admin/users/entities/user.entity';
import { Parent } from '../entities/parent.entity';
import { MembershipRole } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';

@InputType()
export class AcceptParentInvitationInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  token: string;

  @Field()
  @IsString()
  @MinLength(8)
  password: string;
}

@ObjectType()
class UserResponse {
  @Field()
  id: string;

  @Field()
  email: string;

  @Field()
  name: string;
}

