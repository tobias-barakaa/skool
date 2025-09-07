import { InputType, Field, Float, ID } from '@nestjs/graphql';
import { IsOptional, IsUUID, IsString, IsNumber } from 'class-validator';

@InputType()
export class UpdateTransportRouteInput {
  @Field(() => ID)
  @IsUUID()
  id: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  fee?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  billingCycleLabel?: string;
}
