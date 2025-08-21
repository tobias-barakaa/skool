// import { Args, Mutation, Resolver } from "@nestjs/graphql";
// import { Test } from "@nestjs/testing";
// import { TransparentScalingTestService } from "../services/transparent-scaling.service";
// import { CreateTestInput } from "src/teacher/test/dtos/create-test-input.dto";
// import { ActiveUserData } from "src/admin/auth/interface/active-user.interface";
// import { ActiveUser } from "src/admin/auth/decorator/active-user.decorator";
// import { validate } from "class-validator";
// import { BadRequestException } from "@nestjs/common";

// @Resolver(() => Test)
// export class TestResolver {
//   constructor(private readonly testService: TransparentScalingTestService) {}

//   // This resolver looks EXACTLY the same as your original!
//   @Mutation(() => Test)
//   async createTest(
//     @Args('createTestInput') createTestInput: CreateTestInput, // Your original DTO!
//     @ActiveUser() currentUser: ActiveUserData,
//   ): Promise<Test> {
//     try {
//       // Your existing validation logic
//       const validationErrors = await validate(createTestInput);
//       if (validationErrors.length > 0) {
//         const errorMessages = this.formatValidationErrors(validationErrors);
//         throw new BadRequestException({
//           message: 'Input validation failed',
//           errors: errorMessages,
//         });
//       }

//       // Validate questions if present
//       if (createTestInput.questions?.length) {
//         for (let i = 0; i < createTestInput.questions.length; i++) {
//           const question = createTestInput.questions[i];
//           const questionErrors = await validate(question);

//           if (questionErrors.length > 0) {
//             const errorMessages = this.formatValidationErrors(questionErrors);
//             throw new BadRequestException({
//               message: `Question ${i + 1} validation failed`,
//               errors: errorMessages,
//             });
//           }

//           if (
//             question.type === 'multiple_choice' &&
//             (!question.options || question.options.length === 0)
//           ) {
//             throw new BadRequestException(
//               `Multiple choice question ${i + 1} must have options`,
//             );
//           }

//           if (question.type === 'multiple_choice' && question.options) {
//             const hasCorrectOption = question.options.some(
//               (option) => option.isCorrect,
//             );
//             if (!hasCorrectOption) {
//               throw new BadRequestException(
//                 `Multiple choice question ${i + 1} must have at least one correct option`,
//               );
//             }
//           }
//         }
//       }

//       // The magic happens here - scaling is completely transparent!
//       return await this.testService.createTest(createTestInput, currentUser);
//     } catch (error) {
//       console.error('Error in createTest resolver:', error);

//       if (error instanceof BadRequestException) {
//         throw error;
//       }

//       throw new BadRequestException(
//         error.message || 'An error occurred while creating the test',
//       );
//     }
//   }

//   private formatValidationErrors(errors: any[]): string[] {
//     return errors
//       .map((error) => Object.values(error.constraints || {}).join(', '))
//       .filter(Boolean);
//   }
// }
