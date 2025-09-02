import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, IsString, IsUUID, IsIn, IsDateString } from 'class-validator';

@InputType()
export class UpdateHostelAssignmentInput {
  @Field()
  @IsUUID()
  id: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  roomNumber?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  bedNumber?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  vacatedAt?: Date;
}
