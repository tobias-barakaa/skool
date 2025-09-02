import { InputType, Field, ID, PartialType, Int } from '@nestjs/graphql';
import { CreateTransportBusInput } from './create-transport-bus.input';
import { IsUUID } from 'class-validator';

@InputType()
export class UpdateTransportBusInput extends PartialType(CreateTransportBusInput) {
  @Field(() => ID)
  @IsUUID()
  id: string;
}
