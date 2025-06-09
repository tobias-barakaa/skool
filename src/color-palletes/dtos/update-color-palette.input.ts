import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, IsString, IsHexColor, MaxLength } from 'class-validator';

@InputType()
export class UpdateColorPaletteInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor()
  primary?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor()
  secondary?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor()
  success?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor()
  warning?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor()
  error?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor()
  info?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor()
  background?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor()
  surface?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor()
  textPrimary?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor()
  textSecondary?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  customCss?: string;
}