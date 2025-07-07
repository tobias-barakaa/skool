import { ObjectType, Field } from '@nestjs/graphql';
import { TeacherOutput } from './teacher-ouput.dto';
import { User } from 'src/admin/users/entities/user.entity';
import { TokensOutput } from 'src/admin/users/dtos/tokens.output';

@ObjectType()
export class TeacherStatsOutput {
  @Field()
  total: number;

  @Field()
  active: number;

  @Field()
  pendingInvitations: number;

  @Field(() => [RecentlyAddedTeacher])
  recentlyAdded: RecentlyAddedTeacher[];
}

@ObjectType()
export class RecentlyAddedTeacher {
  @Field()
  id: string;

  @Field()
  fullName: string;

  @Field()
  email: string;

  @Field()
  createdAt: Date;
}
