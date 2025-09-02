import { InputType, Field, ID, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID, IsInt } from 'class-validator';

@InputType()
export class CreateTransportBusInput {
  @Field()
  @IsNotEmpty()
  plateNumber: string;

  @Field(() => Int)
  @IsInt()
  capacity: number;

  @Field(() => ID)
  @IsUUID()
  routeId: string;
}
