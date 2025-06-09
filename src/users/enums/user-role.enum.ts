import { registerEnumType } from '@nestjs/graphql';

export enum UserRole {
    SUPER_ADMIN = 'SUPER_ADMIN',
    SCHOOL_ADMIN = 'SCHOOL_ADMIN',
    TEACHER = 'TEACHER',
    STUDENT = 'STUDENT',
    PARENT = 'PARENT',
  }
  

  registerEnumType(UserRole, {
    name: 'UserRole', // This one must match the GraphQL enum name
    description: 'The role of the user',
  });