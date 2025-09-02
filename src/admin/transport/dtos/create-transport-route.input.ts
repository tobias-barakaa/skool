import { InputType, Field, Float } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID, IsNumber } from 'class-validator';

@InputType()
export class CreateTransportRouteInput {
  @Field()
  @IsNotEmpty()
  name: string;

  @Field()
  @IsNotEmpty()
  startLocation: string;

  @Field()
  @IsNotEmpty()
  endLocation: string;

  @Field(() => Float)
  @IsNumber()
  fee: number;

  @Field()
  @IsUUID()
  tenantId: string;
}
