import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

@InputType()
export class SendMessageInput {
  @Field()
  @IsNotEmpty()
  @IsUUID()
  recipientId: string;

  @Field()
  @IsNotEmpty()
  recipientType: string; // 'STUDENT', 'PARENT'

  @Field({ nullable: true })
  @IsOptional()
  subject?: string;

  @Field()
  @IsNotEmpty()
  message: string;

  @Field({ nullable: true })
  @IsOptional()
  imageUrl?: string;
}



@InputType()
export class CreateChatRoomInput {
  @Field()
  @IsNotEmpty()
  name: string;

  @Field()
  @IsNotEmpty()
  type: string;

  @Field(() => [String])
  @IsNotEmpty()
  participantIds: string[];
}
