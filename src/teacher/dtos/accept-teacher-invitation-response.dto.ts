import { ObjectType, Field } from '@nestjs/graphql';
import { TokensOutput } from 'src/users/dtos/tokens.output';
import { User } from 'src/users/entities/user.entity';
import { TeacherOutput } from './teacher-ouput.dto';

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
