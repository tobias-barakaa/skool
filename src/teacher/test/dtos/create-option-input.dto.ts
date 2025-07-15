import { InputType, Field, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsBoolean, IsNumber, IsOptional } from 'class-validator';

@InputType()
export class CreateOptionInput {
  @Field()
  @IsNotEmpty()
  text: string;

  @Field()
  @IsBoolean()
  isCorrect: boolean;

  @Field(() => Int)
  @IsNumber()
  order: number;

  @Field({ nullable: true })
  @IsOptional()
  imageUrl?: string;
}
