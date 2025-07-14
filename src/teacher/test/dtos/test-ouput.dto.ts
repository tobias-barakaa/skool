// import { Field, InputType, ObjectType, Int } from '@nestjs/graphql';
// import {
//   IsString,
//   IsNotEmpty,
//   IsDate,
//   IsInt,
//   Min,
//   IsUrl,
//   IsOptional,
//   IsEnum,
// } from 'class-validator';
// import { ReferenceMaterialOutput } from './referrence-output-dto';


// @ObjectType()
// export class TestOutput {
//   @Field()
//   @IsString()
//   id: string;

//   @Field()
//   @IsString()
//   title: string;

//   @Field()
//   @IsString()
//   subject: string;

//   @Field()
//   @IsString()
//   grade: string;

//   @Field()
//   @IsDate()
//   date: Date;

//   @Field()
//   @IsString()
//   startTime: string;

//   @Field({ nullable: true })
//   @IsOptional()
//   @IsString()
//   endTime?: string;

//   @Field(() => Int)
//   @IsInt()
//   @Min(1)
//   duration: number;

//   @Field(() => Int)
//   @IsInt()
//   @Min(1)
//   totalMarks: number;

//   @Field({ nullable: true })
//   @IsOptional()
//   @IsUrl()
//   resourceUrl?: string;

//   @Field({ nullable: true })
//   @IsOptional()
//   @IsString()
//   instructions?: string;

//   @Field()
//   @IsEnum(['draft', 'active', 'archived'])
//   status: 'draft' | 'active' | 'archived';

//   @Field()
//   @IsString()
//   teacherId: string;

//   @Field()
//   @IsString()
//   tenantId: string;

//   @Field(() => [ReferenceMaterialOutput])
//   referenceMaterials: ReferenceMaterialOutput[];

//   @Field()
//   @IsDate()
//   createdAt: Date;

//   @Field()
//   @IsDate()
//   updatedAt: Date;
// }
