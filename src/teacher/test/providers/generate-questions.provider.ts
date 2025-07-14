import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateQuestionInput } from '../dtos/create-question-input.dto';
import { GenerateQuestionsInput } from '../dtos/generate-questions-input.dto';

@Injectable()
export class GenerateQuestionsProvider {
  constructor() {}

  async generateQuestions(input: GenerateQuestionsInput): Promise<CreateQuestionInput[]> {
    try {
      // This is a mock implementation. In a real app, you'd integrate with an AI service
      // like OpenAI, Claude, or a custom AI model

      const questions: CreateQuestionInput[] = [];

      for (let i = 0; i < input.numberOfQuestions; i++) {
        const question: CreateQuestionInput = {
          text: `Generated question ${i + 1} for ${input.subject} - ${input.grade}: ${input.prompt}`,
          marks: input.marksPerQuestion,
          order: i + 1,
          type: 'multiple_choice',
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
      throw new BadRequestException(`Failed to generate questions: ${error.message}`);
    }
  }
}
