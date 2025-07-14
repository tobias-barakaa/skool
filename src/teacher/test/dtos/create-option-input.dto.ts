import { InputType, Field, Int } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsOptional,
  IsNumber,
} from 'class-validator';

@InputType()
export class CreateOptionInput {
  @Field()
  @IsNotEmpty()
  text: string;

  @Field()
  isCorrect: boolean;

  @Field({ nullable: true })
  @IsOptional()
  imageUrl?: string;

  @Field(() => Int)
  @IsNumber()
  order: number;
}
