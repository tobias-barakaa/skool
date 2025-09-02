import { InputType, Field, ID, PartialType } from '@nestjs/graphql';
import { CreateTransportRouteInput } from './create-transport-route.input';
import { IsUUID } from 'class-validator';

@InputType()
export class UpdateTransportRouteInput extends PartialType(CreateTransportRouteInput) {
  @Field(() => ID)
  @IsUUID()
  id: string;
}
