// src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { SchoolService } from 'src/school/providers/school.service';
import { SignupInput } from '../dtos/signup.input';


@Injectable()
export class AuthService {
  constructor(
    private readonly schoolService: SchoolService,
  ) {}

  async signup(signupInput: SignupInput){
    

  
  }
}