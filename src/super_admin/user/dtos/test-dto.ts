// import { Field, InputType, ObjectType } from "@nestjs/graphql";
// import { IsEnum, IsOptional, IsString } from "class-validator";
// import { ScaleTier } from "src/admin/tenants/dtos/scale-dto";

// @InputType()
// export class UpdateTenantScaleInput {
//   @Field()
//   @IsString()
//   tenantId!: string;

//   @Field(() => ScaleTier)
//   @IsEnum(ScaleTier)
//   scaleTier!: ScaleTier;

//   @Field(() => GraphQLJSONObject, { nullable: true })
//   @IsOptional()
//   customConfig?: Partial<ScaleConfig>;
// }

// @ObjectType()
// export class TenantScaleInfo {
//   @Field()
//   tenantId!: string;

//   @Field(() => ScaleTier)
//   scaleTier!: ScaleTier;

//   @Field(() => GraphQLJSONObject)
//   effectiveConfig!: ScaleConfig;

//   @Field()
//   lastUpdated!: Date;
// }
