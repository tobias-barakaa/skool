import { InputType, Field } from '@nestjs/graphql';
import { IsUUID, IsOptional, IsString, IsIn } from 'class-validator';

@InputType()
export class UpdateStudentScholarshipInput {
  @Field()
  @IsUUID()
  id: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  academicYear?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE', 'REVOKED'])
  status?: string;
}
