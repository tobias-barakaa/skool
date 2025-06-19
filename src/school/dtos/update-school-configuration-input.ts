import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class UpdateSchoolConfigurationInput {
  @Field()
  schoolType: string;

  @Field(() => [String])
  selectedLevels: string[];
}
