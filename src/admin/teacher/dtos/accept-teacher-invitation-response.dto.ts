import { ObjectType, Field } from '@nestjs/graphql';
import { TeacherOutput } from './teacher-ouput.dto';
import { User } from 'src/admin/users/entities/user.entity';
import { TokensOutput } from 'src/admin/users/dtos/tokens.output';

@ObjectType()
export class AcceptInvitationResponse {

  @Field(() => User)
  user: { id: string, email: string, name: string };

  @Field()
  message: string;


  @Field(() => TokensOutput)
  tokens: TokensOutput;

  @Field(() => TeacherOutput, { nullable: true })
  teacher?: TeacherOutput | null;

}
