import { Field, InputType, registerEnumType } from '@nestjs/graphql';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  IsUUID,
  IsArray,
  ArrayNotEmpty,
} from 'class-validator';

export enum ParentLinkingMethod {
  SEARCH_BY_NAME = 'SEARCH_BY_NAME',
  SEARCH_BY_ADMISSION = 'SEARCH_BY_ADMISSION',
  MANUAL_INPUT = 'MANUAL_INPUT',
}

registerEnumType(ParentLinkingMethod, {
  name: 'ParentLinkingMethod',
  description: 'How the parent is linked to a student',
});

@InputType()
export class CreateParentInvitationDto {
  @Field()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  phone?: string;

  @Field(() => ParentLinkingMethod)
  @IsEnum(ParentLinkingMethod)
  linkingMethod: ParentLinkingMethod;

  @Field(() => [String])
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(4, { each: true })
  studentIds: string[];
}
