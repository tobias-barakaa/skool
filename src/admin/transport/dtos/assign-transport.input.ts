import { Field, InputType } from '@nestjs/graphql';
import { IsUUID, IsOptional, IsString } from 'class-validator';

@InputType()
export class AssignTransportInput {
  @Field()
  @IsUUID()
  studentId: string;

  @Field()
  @IsUUID()
  routeId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  pickupPoint?: string;
}
