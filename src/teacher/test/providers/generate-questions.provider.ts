import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateQuestionInput } from '../dtos/create-question-input.dto';
import { GenerateQuestionsInput } from '../dtos/generate-questions-input.dto';
import { QuestionType } from '../dtos/create-question-input.dto'; // ✅ Import the enum

@Injectable()
export class GenerateQuestionsProvider {
  async generateQuestions(
    input: GenerateQuestionsInput,
  ): Promise<CreateQuestionInput[]> {
    try {
      const questions: CreateQuestionInput[] = [];

      for (let i = 0; i < input.numberOfQuestions; i++) {
        const question: CreateQuestionInput = {
          text: `Generated question ${i + 1} for ${input.subject} - ${input.grade}: ${input.prompt}`,
          marks: input.marksPerQuestion,
          order: i + 1,
          type: QuestionType.MULTIPLE_CHOICE, // ✅ Use the enum
          isAIGenerated: true,
          aiPrompt: input.prompt,
          options: [
            {
              text: `Option A for question ${i + 1}`,
              isCorrect: true,
              order: 1,
            },
            {
              text: `Option B for question ${i + 1}`,
              isCorrect: false,
              order: 2,
            },
            {
              text: `Option C for question ${i + 1}`,
              isCorrect: false,
              order: 3,
            },
            {
              text: `Option D for question ${i + 1}`,
              isCorrect: false,
              order: 4,
            },
          ],
        };

        questions.push(question);
      }

      return questions;
    } catch (error) {
      throw new BadRequestException(
        `Failed to generate questions: ${error.message}`,
      );
    }
  }
}
