import { registerEnumType } from '@nestjs/graphql';


export enum SubjectType {
  ACADEMIC = "academic",
  PRACTICAL = "practical",
  THEORY = "theory",
  MIXED = "mixed",
  VOCATIONAL = "vocational",
  ARTS = "arts",
  SPORTS = "sports",
  CORE = 'core',
  ELECTIVE = 'elective', 
  COMPULSORY = 'compulsory',
  OPTIONAL = 'optional'
}
// ✅ Register for GraphQL
registerEnumType(SubjectType, {
  name: 'SubjectType',
  description: 'The type of the subject',
});
