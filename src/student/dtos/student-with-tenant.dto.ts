// src/students/dtos/student-with-tenant.dto.ts
import { Field, ObjectType } from '@nestjs/graphql';
import { User } from 'src/users/entities/user.entity';

@ObjectType()
export class StudentWithTenant {
  @Field()
  id: string;

  @Field()
  admission_number: string;

  @Field()
  phone: string;

  @Field()
  gender: string;

  @Field()
  grade: string;

  @Field(() => User)
  user: User;

  @Field()
  tenantId: string; 
}
