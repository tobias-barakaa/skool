import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateSchoolInput {
  @Field()
  name: string;

  @Field({ nullable: true })
  subdomain?: string;

  @Field({ nullable: true })
  logoUrl?: string;

  @Field({ nullable: true })
  secondaryColor?: string; // Optional, fallback to default in service

  @Field({ nullable: true })
  contactEmail?: string;

  @Field(() => [String], { nullable: true })
  termDates?: string[];

  @Field(() => String, { nullable: true })
  colorPaletteId?: string; // Optional: pass an existing ColorPalette by ID
}
