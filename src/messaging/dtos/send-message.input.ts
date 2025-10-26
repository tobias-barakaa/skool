import { InputType, Field } from '@nestjs/graphql';
import { IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

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


// @InputType()
// export class BroadcastMessageInput {
//   @Field()
//   recipientType: string; // 'STUDENT', 'PARENT'

//   @Field({ nullable: true })
//   subject?: string;

//   @Field()
//   message: string;

//   @Field({ nullable: true })
//   imageUrl?: string;
// }


@InputType()
export class BroadcastMessageInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  @IsIn(['STUDENT', 'PARENT'], { message: 'recipientType must be STUDENT or PARENT' })
  recipientType: string; 

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(150, { message: 'Subject should not exceed 150 characters' })
  subject?: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  @MaxLength(2000, { message: 'Message should not exceed 2000 characters' })
  message: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
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

import { ObjectType } from '@nestjs/graphql';

@ObjectType()
export class TypingIndicator {
  @Field()
  userId: string;

  @Field()
  roomId: string;

  @Field()
  isTyping: boolean;
}


@InputType()
export class BroadcastToGradeLevelsInput {
  @Field()
  @IsNotEmpty()
  recipientType: string; // 'STUDENT' or 'PARENT'

  @Field({ nullable: true })
  @IsOptional()
  subject?: string;

  @Field()
  @IsNotEmpty()
  message: string;

  @Field({ nullable: true })
  @IsOptional()
  imageUrl?: string;

  @Field(() => [String])
  @IsNotEmpty()
  gradeLevelIds: string[]; // Array of TenantGradeLevel IDs
}


// import {IsString, IsIn, MaxLength } from 'class-validator';

// @InputType()
// export class BroadcastMessageInput {
//   @Field()
//   @IsNotEmpty()
//   @IsString()
//   @IsIn(['STUDENT', 'PARENT'], { message: 'recipientType must be STUDENT or PARENT' })
//   recipientType: string; // target audience of the broadcast

//   @Field({ nullable: true })
//   @IsOptional()
//   @IsString()
//   @MaxLength(150, { message: 'Subject should not exceed 150 characters' })
//   subject?: string;

//   @Field()
//   @IsNotEmpty()
//   @IsString()
//   @MaxLength(2000, { message: 'Message should not exceed 2000 characters' })
//   message: string;

//   @Field({ nullable: true })
//   @IsOptional()
//   @IsString()
//   imageUrl?: string;
// }

