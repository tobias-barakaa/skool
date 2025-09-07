import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID, IsOptional, IsString } from 'class-validator';

@InputType()
export class CreateTransportAssignmentInput {
  @Field(() => ID)
  @IsUUID()
  routeId: string;

  @Field(() => ID)
  @IsUUID()
  studentId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  pickupPoint?: string;
}
