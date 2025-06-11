// src/app.controller.ts
import { Controller, Get, Redirect } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  @Redirect('/graphql') // Redirect to GraphQL playground
  getRoot() {
    return;
  }
}