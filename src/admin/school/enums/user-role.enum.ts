// src/user/enums/user-role.enum.ts
import { registerEnumType } from '@nestjs/graphql';

export enum UserRole {
  SCHOOL_ADMIN = 'SCHOOL_ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
}

registerEnumType(UserRole, {
  name: 'UserRole',
  description: 'The role of the user within the school.',
});