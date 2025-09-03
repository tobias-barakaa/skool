import { InputType, Field, ID, Float, PartialType } from '@nestjs/graphql';
import { CreateTransportRouteInput } from './create-transport-route.input';
import { IsUUID, IsNumber, IsOptional } from 'class-validator';

@InputType()
export class UpdateTransportRouteInput extends PartialType(CreateTransportRouteInput) {
  @Field(() => ID)
  @IsUUID()
  id: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  fee?: number;
}
