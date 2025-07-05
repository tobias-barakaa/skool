import { registerEnumType } from '@nestjs/graphql';

export enum SubjectCategory {
  CORE = "core",
  ELECTIVE = "elective",
  OPTIONAL = "optional",
  EXTRA_CURRICULAR = "extra_curricular",
  REMEDIAL = "remedial",
  ADVANCED = "advanced"
}

// ✅ Register it for GraphQL
registerEnumType(SubjectCategory, {
  name: 'SubjectCategory', // GraphQL name
  description: 'The category of the subject', // optional
});
