import { registerEnumType } from "@nestjs/graphql";

export enum AssessType {
  CA = 'CA',
  EXAM = 'EXAM',
}


// Register the enums with GraphQL
registerEnumType(AssessType, {
  name: 'AssessType',
  description: 'The type of assessment',
});
